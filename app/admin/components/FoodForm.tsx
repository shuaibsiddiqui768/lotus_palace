'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Upload, X, ChevronDown } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export function FoodForm({ onFoodAdded }: { onFoodAdded?: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
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

      setFormData((prev) => ({
        ...prev,
        image: imageUrl,
      }));
      setImagePreview(imageUrl);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: '',
    }));
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.category || !formData.price) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (isNaN(parseFloat(formData.price))) {
        toast({
          title: 'Validation Error',
          description: 'Price must be a valid number',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        image: formData.image.trim(),
        preparationTime: 30,
        spicy: false,
        vegetarian: false,
      };

      const response = await fetch('/api/food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(', '));
        }
        throw new Error(data.message || 'Failed to add food item');
      }

      toast({
        title: 'Success',
        description: 'Food item added successfully',
      });

      setFormData({
        name: '',
        category: '',
        price: '',
        description: '',
        image: '',
      });

      onFoodAdded?.();
    } catch (error: any) {
      console.error('Error adding food item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add food item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6 sticky top-0 sm:top-6 mx-auto max-w-full shadow-xl rounded-2xl border border-emerald-200/50 bg-emerald-50/70 backdrop-blur-md">
      <h2 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-emerald-700 to-lime-500 bg-clip-text text-transparent mb-3 sm:mb-4">
        Add New Food Item
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Food Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter food name"
            className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-emerald-400"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Category *
          </label>
          {categoriesLoading ? (
            <div className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white/80 text-emerald-700">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg bg-red-50/50 text-red-700">
              No categories available. Please add one first.
            </div>
          ) : (
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full text-sm h-10 border-emerald-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 relative">
                <SelectValue placeholder="Select category" />
                <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Price *
          </label>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">₹</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0"
              step="1"
              min="0"
              className="flex-1 px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-emerald-400"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter food description"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-emerald-400 resize-none"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Food Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading || loading}
          />
          {!formData.image ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
              className="w-full px-3 py-5 text-sm border-2 border-dashed border-emerald-200 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-emerald-700"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </button>
          ) : null}
          <p className="text-xs text-emerald-700 mt-1">
            {uploading ? 'Uploading image...' : 'Upload image files up to 5MB'}
          </p>
        </div>

        {formData.image && (
          <div>
            <p className="text-xs sm:text-sm font-medium text-emerald-900 mb-1">Preview</p>
            <div className="relative rounded-lg overflow-hidden border border-emerald-200">
              <img
                src={formData.image}
                alt="Preview"
                className="w-full h-40 object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={uploading || loading}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors disabled:opacity-50 shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-emerald-700 mt-1">Image uploaded successfully to Cloudinary</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-emerald-700 to-lime-500 hover:from-emerald-800 hover:to-lime-600 text-white shadow-lg rounded-xl transition-all"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Food Item'}
        </Button>
      </form>
    </Card>
  );
}
