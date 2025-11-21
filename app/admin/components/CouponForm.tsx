'use client';

import { useState, useRef } from 'react';
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
import { Shuffle } from 'lucide-react';

export function CouponForm({ onCouponAdded }: { onCouponAdded?: () => void }) {
  const [formData, setFormData] = useState({
    code: '',
    discountType: '',
    value: '',
    expiryDate: '',
    description: '',
    usageLimit: '',
    minimumOrderAmount: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDiscountTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      discountType: value,
    }));
  };

  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData((prev) => ({
      ...prev,
      code: result,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.code || !formData.discountType || !formData.value || !formData.expiryDate) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const value = parseFloat(formData.value);
      if (isNaN(value) || value <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Value must be a valid positive number',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (formData.discountType === 'percentage' && value > 100) {
        toast({
          title: 'Validation Error',
          description: 'Percentage discount cannot exceed 100%',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const expiryDate = new Date(formData.expiryDate);
      if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        toast({
          title: 'Validation Error',
          description: 'Expiry date must be a future date',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      let usageLimit;
      if (formData.usageLimit) {
        usageLimit = parseInt(formData.usageLimit);
        if (isNaN(usageLimit) || usageLimit <= 0) {
          toast({
            title: 'Validation Error',
            description: 'Usage limit must be a valid positive number',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      let minimumOrderAmountValue;
      if (formData.minimumOrderAmount) {
        const parsedMinimum = parseFloat(formData.minimumOrderAmount);
        if (isNaN(parsedMinimum) || parsedMinimum < 0) {
          toast({
            title: 'Validation Error',
            description: 'Minimum order amount must be a valid non-negative number',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        minimumOrderAmountValue = parsedMinimum;
      }

      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        value,
        expiryDate: formData.expiryDate,
        description: formData.description.trim(),
        usageLimit,
        minimumOrderAmount: minimumOrderAmountValue,
      };

      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create coupon');
      }

      toast({
        title: 'Success',
        description: 'Coupon created successfully',
      });

      setFormData({
        code: '',
        discountType: '',
        value: '',
        expiryDate: '',
        description: '',
        usageLimit: '',
        minimumOrderAmount: '',
      });

      onCouponAdded?.();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create coupon',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6 sticky top-0 sm:top-6 mx-auto max-w-full shadow-xl rounded-2xl border border-emerald-300/40 bg-emerald-100/50 backdrop-blur-sm">
      <h2 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-emerald-500 to-lime-400 bg-clip-text text-transparent mb-3 sm:mb-4">
        Create New Coupon
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Coupon Code *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter coupon code"
              className="flex-1 px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase placeholder:text-emerald-500"
              disabled={loading}
            />
            <Button
              type="button"
              onClick={generateCouponCode}
              variant="outline"
              size="sm"
              disabled={loading}
              className="px-3 border-emerald-400 text-emerald-600 hover:text-white hover:bg-gradient-to-r hover:from-emerald-500 hover:to-lime-400"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-emerald-700 mt-1">
            Click the shuffle icon to generate a random code
          </p>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Discount Type *
          </label>
          <Select
            value={formData.discountType}
            onValueChange={handleDiscountTypeChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full text-sm h-10 border-emerald-300 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-400">
              <SelectValue placeholder="Select discount type" />
            </SelectTrigger>
            <SelectContent className="rounded-lg shadow-lg">
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Value *
          </label>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">
              {formData.discountType === 'percentage' ? '%' : '₹'}
            </span>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleChange}
              placeholder="0"
              step={formData.discountType === 'percentage' ? '1' : '0.01'}
              min="0"
              max={formData.discountType === 'percentage' ? '100' : undefined}
              className="flex-1 px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-500"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Expiry Date *
          </label>
          <input
            type="datetime-local"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter coupon description"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-500 resize-none"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Minimum Order Amount (optional)
          </label>
          <input
            type="number"
            name="minimumOrderAmount"
            value={formData.minimumOrderAmount}
            onChange={handleChange}
            placeholder="No minimum"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-500"
            disabled={loading}
          />
          <p className="text-xs text-emerald-700 mt-1">
            Leave empty if no minimum order amount is required
          </p>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-emerald-900 mb-1">
            Usage Limit (optional)
          </label>
          <input
            type="number"
            name="usageLimit"
            value={formData.usageLimit}
            onChange={handleChange}
            placeholder="Unlimited"
            min="1"
            className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-500"
            disabled={loading}
          />
          <p className="text-xs text-emerald-700 mt-1">Leave empty for unlimited usage</p>
        </div>

        <Button
          type="submit"
          className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-lime-400 hover:from-emerald-600 hover:to-lime-500 text-white shadow-lg rounded-lg transition-all"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Coupon'}
        </Button>
      </form>
    </Card>
  );
}
