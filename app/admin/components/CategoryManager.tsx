'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Trash2, Plus, Edit2, X, Upload } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export function CategoryManager({ onCategoryChange }: { onCategoryChange?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Category name is required',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          image: formData.image.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create category');
      }

      toast({
        title: 'Success',
        description: 'Category created successfully',
      });

      setFormData({ name: '', description: '', image: '' });
      setImagePreview('');
      setIsAddingNew(false);
      fetchCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? All food items in this category will also be deleted.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/categories/${slug}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category');
      }

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });

      fetchCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6 shadow-xl rounded-2xl border border-emerald-200/50 bg-emerald-50/70 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100">
        <h2 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-emerald-700 to-lime-500 bg-clip-text text-transparent">
          Manage Categories
        </h2>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            Add Category
          </button>
        )}
      </div>

      {isAddingNew && (
        <form onSubmit={handleAddCategory} className="mb-4 p-3 bg-white/60 rounded-lg border border-emerald-100">
          <div className="space-y-2">
            <div>
              <input
                type="text"
                placeholder="Category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-2 py-2 text-sm border border-emerald-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              />
            </div>
            <div>
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-2 py-2 text-sm border border-emerald-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                disabled={loading}
              />
            </div>
            <div>
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
                  className="w-full px-2 py-2 text-xs border-2 border-dashed border-emerald-200 rounded-lg bg-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-emerald-700"
                >
                  <Upload className="h-3 w-3" />
                  {uploading ? 'Uploading...' : 'Upload image'}
                </button>
              ) : null}
              {formData.image && (
                <div className="relative rounded-lg overflow-hidden border border-emerald-200 mt-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploading || loading}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setFormData({ name: '', description: '', image: '' });
                  setImagePreview('');
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {categories.length === 0 ? (
          <p className="text-sm text-emerald-700/70 text-center py-4">No categories yet. Add one to get started!</p>
        ) : (
          categories.map((category) => (
            <div
              key={category._id}
              className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-emerald-100 hover:border-emerald-200 transition-colors"
            >
              {category.image && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-200 flex-shrink-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-900 truncate">{category.name}</p>
                {category.description && (
                  <p className="text-xs text-emerald-700/70 truncate">{category.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteCategory(category.slug, category.name)}
                disabled={loading}
                className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                title="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
