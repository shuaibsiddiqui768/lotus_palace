'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { toast } from '@/hooks/use-toast';

export function TableForm({ onTableAdded }: { onTableAdded?: () => void }) {
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!tableNumber.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a table number',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (isNaN(parseInt(tableNumber))) {
        toast({
          title: 'Validation Error',
          description: 'Table number must be a valid number',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Table added successfully',
        });

        setTableNumber('');
        onTableAdded?.();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error adding table:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add table',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-3 sm:p-6 sticky top-0 sm:top-6 mx-auto max-w-full shadow-md">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Add New Table</h2>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Table Number *
          </label>
          <input
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g., 1, 2, 3"
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full h-9 sm:h-10 text-sm" disabled={loading}>
          {loading ? 'Adding...' : 'Add Table'}
        </Button>
      </form>
    </Card>
  );
}
