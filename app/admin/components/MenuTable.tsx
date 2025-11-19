'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 3;

interface FoodItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export function MenuTable() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/food', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load menu');
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Unable to load menu');
        }
        setItems(result.data || []);
      } catch (err: any) {
        setError(err.message || 'Unexpected error');
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items.length]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <Card className="p-6">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Item Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Availability</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                  Loading menu...
                </td>
              </tr>
            ) : visibleItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                  No items found.
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{item.name}</td>
                  <td className="py-3 px-4 text-gray-600">{item.category}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">₹{item.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-600">{item.available ? 'Available' : 'Unavailable'}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && visibleCount < items.length && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length))}
          >
            View more
          </Button>
        </div>
      )}
    </Card>
  );
}
