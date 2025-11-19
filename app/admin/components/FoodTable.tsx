'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit2, Trash2, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const LOAD_STEP = 8; // number of items to show per page

interface FoodItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  spicy: boolean;
  vegetarian: boolean;
  available: boolean;
  preparationTime: number;
}

interface EditFormData {
  name: string;
  category: string;
  price: string;
  description: string;
  image: string;
  spicy: boolean;
  vegetarian: boolean;
  available: boolean;
}

const defaultEditForm: EditFormData = {
  name: '',
  category: '',
  price: '',
  description: '',
  image: '',
  spicy: false,
  vegetarian: false,
  available: true,
};

export function FoodTable({ refreshTrigger }: { refreshTrigger?: number }) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({ ...defaultEditForm });
  const [editLoading, setEditLoading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(LOAD_STEP);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      console.log('Fetching food items...');
      
      const response = await fetch('/api/food', {
        // Add cache: 'no-store' to prevent caching issues
        cache: 'no-store' as RequestCache,
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Food items data:', data);

      if (data.success) {
        setFoodItems(data.data);
        // reset pagination when new data is fetched
        setVisibleCount(LOAD_STEP);
      } else {
        throw new Error(data.message || 'Failed to load food items');
      }
    } catch (error: any) {
      console.error('Error fetching food items:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load food items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, [refreshTrigger]);

  const handleEditDialogChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) {
      setEditingItem(null);
      setEditFormData({ ...defaultEditForm });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleEditCategoryChange = (value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      category: value,
    }));
  };

  const handleEditImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setEditUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to upload image';
        throw new Error(errorMsg);
      }

      const imageUrl = data.secure_url;

      setEditFormData((prev) => ({
        ...prev,
        image: imageUrl,
      }));

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setEditUploading(false);
    }
  };

  const handleEditRemoveImage = () => {
    setEditFormData((prev) => ({
      ...prev,
      image: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) {
      return;
    }

    setEditLoading(true);

    try {
      if (!editFormData.name || !editFormData.category || !editFormData.price) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setEditLoading(false);
        return;
      }

      const parsedPrice = parseFloat(editFormData.price);
      if (Number.isNaN(parsedPrice)) {
        toast({
          title: 'Validation Error',
          description: 'Price must be a valid number',
          variant: 'destructive',
        });
        setEditLoading(false);
        return;
      }

      const payload = {
        name: editFormData.name.trim(),
        category: editFormData.category,
        price: parsedPrice,
        description: editFormData.description.trim(),
        image: editFormData.image.trim(),
        spicy: editFormData.spicy,
        vegetarian: editFormData.vegetarian,
        available: editFormData.available,
        preparationTime: editingItem.preparationTime,
      };

      const response = await fetch(`/api/food/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update food item');
      }

      toast({
        title: 'Success',
        description: 'Food item updated successfully',
      });

      setFoodItems((prev) =>
        prev.map((item) => (item._id === editingItem._id ? data.data : item))
      );

      handleEditDialogChange(false);

      // Notify other tabs/windows to refresh menu data
      if (typeof window !== 'undefined') {
        const bc = new BroadcastChannel('food-menu-updates');
        bc.postMessage({ type: 'refresh' });
        bc.close();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update food item',
        variant: 'destructive',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description || '',
      image: item.image || '',
      spicy: item.spicy,
      vegetarian: item.vegetarian,
      available: item.available,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setDeleting(id);
    try {
      console.log(`Deleting food item with ID: ${id}`);
      
      const response = await fetch(`/api/food/${id}`, {
        method: 'DELETE',
        cache: 'no-store' as RequestCache,
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Delete response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete food item');
      }

      toast({
        title: 'Success',
        description: 'Food item deleted successfully',
      });

      // Update the UI by removing the deleted item
      const newList = foodItems.filter((item) => item._id !== id);
      setFoodItems(newList);
      // adjust visibleCount so we don't show empty space
      setVisibleCount((prev) => Math.min(prev, Math.max(LOAD_STEP, newList.length)));

      // Notify other tabs/windows to refresh menu data
      if (typeof window !== 'undefined') {
        const bc = new BroadcastChannel('food-menu-updates');
        bc.postMessage({ type: 'refresh' });
        bc.close();
      }
    } catch (error: any) {
      console.error('Error deleting food item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete food item',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleAvailability = async (item: FoodItem) => {
    setTogglingId(item._id);
    try {
      const response = await fetch(`/api/food/${item._id}`, {
        method: 'PATCH',
        cache: 'no-store' as RequestCache,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update food visibility');
      }

      setFoodItems((previous) =>
        previous.map((food) => (food._id === item._id ? data.data : food))
      );

      toast({
        title: 'Success',
        description: data.data.available ? 'Food item is now visible' : 'Food item hidden from menu',
      });

      // Notify other tabs/windows to refresh menu data
      if (typeof window !== 'undefined') {
        const bc = new BroadcastChannel('food-menu-updates');
        bc.postMessage({ type: 'refresh' });
        bc.close();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update food visibility',
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'pizza': 'Pizza',
      'burgers': 'Burgers',
      'pasta': 'Pasta',
      'salads': 'Salads',
      'drinks': 'Drinks',
      'desserts': 'Desserts',
    };
    return labels[category] || category;
  };

  return (
    <>
      <Dialog open={editOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Food Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Name *
              </label>
              <input
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                placeholder="Enter food name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={editLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <Select
                value={editFormData.category}
                onValueChange={handleEditCategoryChange}
                disabled={editLoading}
              >
                <SelectTrigger className="w-full text-sm h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pizza">Pizza</SelectItem>
                  <SelectItem value="burgers">Burgers</SelectItem>
                  <SelectItem value="pasta">Pasta</SelectItem>
                  <SelectItem value="salads">Salads</SelectItem>
                  <SelectItem value="drinks">Drinks</SelectItem>
                  <SelectItem value="desserts">Desserts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">₹</span>
                <input
                  type="number"
                  name="price"
                  value={editFormData.price}
                  onChange={handleEditInputChange}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={editLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditInputChange}
                placeholder="Enter food description"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                disabled={editLoading}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="spicy"
                  checked={editFormData.spicy}
                  onChange={handleEditCheckboxChange}
                  disabled={editLoading}
                  className="h-4 w-4"
                />
                Spicy
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="vegetarian"
                  checked={editFormData.vegetarian}
                  onChange={handleEditCheckboxChange}
                  disabled={editLoading}
                  className="h-4 w-4"
                />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="available"
                  checked={editFormData.available}
                  onChange={handleEditCheckboxChange}
                  disabled={editLoading}
                  className="h-4 w-4"
                />
                Available
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleEditImageUpload}
                className="hidden"
                disabled={editUploading || editLoading}
              />
              {!editFormData.image ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={editUploading || editLoading}
                  className="w-full px-3 py-4 text-sm border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-gray-600"
                >
                  <Upload className="h-4 w-4" />
                  {editUploading ? 'Uploading...' : 'Click to upload image'}
                </button>
              ) : null}
              <p className="text-xs text-gray-500 mt-1">
                {editUploading ? 'Uploading image...' : 'Upload image files up to 5MB'}
              </p>
            </div>
            {editFormData.image ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Preview</p>
                <div className="relative">
                  <img
                    src={editFormData.image}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleEditRemoveImage}
                    disabled={editUploading || editLoading}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditDialogChange(false)}
                disabled={editLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading} className="w-full sm:w-auto">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="p-3 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Food Items ({loading ? '...' : foodItems.length})
        </h2>

        {loading ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-500 text-sm sm:text-base">Loading food items...</p>
          </div>
        ) : foodItems.length > 0 ? (
          <div className="space-y-3">
            {foodItems.slice(0, visibleCount).map((item) => (
              <div
                key={item._id}
                className={`flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg transition-all ${
                  item.available ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 hover:bg-gray-100 opacity-60'
                }`}
              >
                {/* Image - Full width on mobile, fixed width on desktop */}
                <div className="w-full sm:w-16 h-24 sm:h-16 flex-shrink-0 mb-2 sm:mb-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        // Use a data URI for a simple gray placeholder instead of an external service
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2232%22%20y%3D%2232%22%20dy%3D%22.3em%22%20fill%3D%22%23AAAAAA%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                        console.log('Image failed to load, using placeholder');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{item.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {item.spicy && (
                        <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Spicy</span>
                      )}
                      {item.vegetarian && (
                        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                          Veg
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                      {getCategoryLabel(item.category)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">₹{item.price.toFixed(0)}</span>
                    {!item.available && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">Unavailable</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                  
                  {/* Action buttons - Bottom on mobile, right on desktop */}
                  <div className="flex gap-2 mt-2 sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-700 h-8 text-xs flex-1"
                    >
                      <Edit2 size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAvailability(item)}
                      disabled={togglingId === item._id}
                      className={`h-8 text-xs flex-1 ${item.available ? 'text-gray-700 hover:text-gray-900' : 'text-green-700 hover:text-green-800'}`}
                    >
                      {togglingId === item._id
                        ? 'Updating...'
                        : item.available
                        ? 'Hide'
                        : 'Show'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item._id)}
                      disabled={deleting === item._id}
                      className="text-red-600 hover:text-red-700 h-8 text-xs flex-1"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Desktop action buttons */}
                <div className="hidden sm:flex gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAvailability(item)}
                    disabled={togglingId === item._id}
                    className={`${item.available ? 'text-gray-700 hover:text-gray-900' : 'text-green-700 hover:text-green-800'}`}
                  >
                    {togglingId === item._id ? 'Updating...' : item.available ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item._id)}
                    disabled={deleting === item._id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}

            {/* View More button */}
            {visibleCount < foodItems.length && (
              <div className="flex justify-center mt-2">
                <Button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + LOAD_STEP, foodItems.length))}
                  className="w-40"
                >
                  View More
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-500 text-sm sm:text-base">No food items found. Add one to get started!</p>
          </div>
        )}
      </Card>
    </>
  );
}
