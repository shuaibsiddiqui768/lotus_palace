'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Trash2, Edit, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  expiryDate: string;
  description?: string;
  isActive: boolean;
  usageLimit?: number;
  minimumOrderAmount?: number;
  usedCount: number;
  createdAt: string;
}

interface EditFormData {
  code: string;
  discountType: string;
  value: string;
  expiryDate: string;
  description: string;
  usageLimit: string;
  minimumOrderAmount: string;
  isActive: boolean;
}

const defaultEditForm: EditFormData = {
  code: '',
  discountType: '',
  value: '',
  expiryDate: '',
  description: '',
  usageLimit: '',
  minimumOrderAmount: '',
  isActive: true,
};

const formatDateTimeLocalInput = (value: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

interface CouponTableProps {
  refreshTrigger?: number;
}

export function CouponTable({ refreshTrigger }: CouponTableProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({ ...defaultEditForm });
  const [editLoading, setEditLoading] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coupons');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch coupons');
      }

      setCoupons(data.coupons);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch coupons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [refreshTrigger]);

  const handleEditDialogChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) {
      setEditingCoupon(null);
      setEditFormData({ ...defaultEditForm });
    }
  };

  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));
  };

  const handleEditCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleEditDiscountTypeChange = (value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      discountType: value,
    }));
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCoupon) {
      return;
    }

    setEditLoading(true);

    try {
      if (!editFormData.code || !editFormData.discountType || !editFormData.value || !editFormData.expiryDate) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setEditLoading(false);
        return;
      }

      const parsedValue = parseFloat(editFormData.value);
      if (Number.isNaN(parsedValue) || parsedValue <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Value must be a valid positive number',
          variant: 'destructive',
        });
        setEditLoading(false);
        return;
      }

      if (editFormData.discountType === 'percentage' && parsedValue > 100) {
        toast({
          title: 'Validation Error',
          description: 'Percentage discount cannot exceed 100%',
          variant: 'destructive',
        });
        setEditLoading(false);
        return;
      }

      const expiry = new Date(editFormData.expiryDate);
      if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) {
        toast({
          title: 'Validation Error',
          description: 'Expiry date must be a future date',
          variant: 'destructive',
        });
        setEditLoading(false);
        return;
      }

      let usageLimitValue: number | undefined;
      if (editFormData.usageLimit) {
        const parsedUsageLimit = parseInt(editFormData.usageLimit, 10);
        if (Number.isNaN(parsedUsageLimit) || parsedUsageLimit <= 0) {
          toast({
            title: 'Validation Error',
            description: 'Usage limit must be a valid positive number',
            variant: 'destructive',
          });
          setEditLoading(false);
          return;
        }
        usageLimitValue = parsedUsageLimit;
      }

      let minimumOrderAmountValue: number | undefined;
      if (editFormData.minimumOrderAmount) {
        const parsedMinimum = parseFloat(editFormData.minimumOrderAmount);
        if (Number.isNaN(parsedMinimum) || parsedMinimum < 0) {
          toast({
            title: 'Validation Error',
            description: 'Minimum order amount must be a valid non-negative number',
            variant: 'destructive',
          });
          setEditLoading(false);
          return;
        }
        minimumOrderAmountValue = parsedMinimum;
      }

      const payload = {
        code: editFormData.code.trim().toUpperCase(),
        discountType: editFormData.discountType,
        value: parsedValue,
        expiryDate: editFormData.expiryDate,
        description: editFormData.description.trim(),
        usageLimit: editFormData.usageLimit ? usageLimitValue : null,
        minimumOrderAmount: editFormData.minimumOrderAmount ? minimumOrderAmountValue : null,
        isActive: editFormData.isActive,
      };

      const response = await fetch(`/api/coupons/${editingCoupon._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update coupon');
      }

      toast({
        title: 'Success',
        description: 'Coupon updated successfully',
      });

      setCoupons((prev) => prev.map((item) => (item._id === editingCoupon._id ? data.coupon : item)));

      handleEditDialogChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update coupon',
        variant: 'destructive',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value.toString(),
      expiryDate: formatDateTimeLocalInput(coupon.expiryDate),
      description: coupon.description || '',
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
      minimumOrderAmount:
        typeof coupon.minimumOrderAmount === 'number' ? coupon.minimumOrderAmount.toString() : '',
      isActive: coupon.isActive,
    });
    setEditOpen(true);
  };

  const handleDelete = async (couponId: string) => {
    setDeletingId(couponId);
    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete coupon');
      }

      toast({
        title: 'Success',
        description: 'Coupon deleted successfully',
      });

      // Refresh the list
      fetchCoupons();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete coupon',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: `Coupon code "${code}" copied to clipboard`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const expiry = new Date(coupon.expiryDate);

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Badge className="bg-rose-600 text-white border border-rose-300">Used Up</Badge>;
    }

    if (!coupon.isActive) {
      return <Badge className="bg-gray-200 text-gray-800 border border-gray-300">Inactive</Badge>;
    }

    if (expiry <= now) {
      return <Badge className="bg-rose-600 text-white border border-rose-300">Expired</Badge>;
    }

    return <Badge className="bg-emerald-600 text-white border border-emerald-300">Active</Badge>;
  };

  return (
    <>
      {/* Edit Dialog - glassmorphic theme */}
      <Dialog open={editOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="max-w-2xl rounded-2xl border-2 border-orange-200/60 bg-white/70 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Edit Coupon
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                name="code"
                value={editFormData.code}
                onChange={handleEditInputChange}
                placeholder="Enter coupon code"
                className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase placeholder:text-gray-400"
                disabled={editLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
              <Select value={editFormData.discountType} onValueChange={handleEditDiscountTypeChange} disabled={editLoading}>
                <SelectTrigger className="w-full text-sm h-10 border-orange-200 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-orange-500">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{editFormData.discountType === 'percentage' ? '%' : '₹'}</span>
                <input
                  type="number"
                  name="value"
                  value={editFormData.value}
                  onChange={handleEditInputChange}
                  placeholder="0"
                  step={editFormData.discountType === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={editFormData.discountType === 'percentage' ? '100' : undefined}
                  className="flex-1 px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
                  disabled={editLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input
                type="datetime-local"
                name="expiryDate"
                value={editFormData.expiryDate}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
                disabled={editLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditInputChange}
                placeholder="Enter coupon description"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400 resize-none"
                disabled={editLoading}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (optional)</label>
                <input
                  type="number"
                  name="minimumOrderAmount"
                  value={editFormData.minimumOrderAmount}
                  onChange={handleEditInputChange}
                  placeholder="No minimum"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (optional)</label>
                <input
                  type="number"
                  name="usageLimit"
                  value={editFormData.usageLimit}
                  onChange={handleEditInputChange}
                  placeholder="Unlimited"
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
                  disabled={editLoading}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={editFormData.isActive}
                onChange={handleEditCheckboxChange}
                disabled={editLoading}
                className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleEditDialogChange(false)} disabled={editLoading} className="w-full sm:w-auto border-orange-300">
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading} className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Listing Card */}
      <Card className="p-4 sm:p-6 shadow-xl rounded-2xl border-2 border-orange-200/50 bg-white/70 backdrop-blur-md">
        <h2 className="text-lg font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
          
        </h2>

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
            <p className="text-gray-600 text-base sm:text-lg font-medium">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-gray-600">No coupons created yet</p>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div
                key={coupon._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border-2 border-orange-200/50 bg-gradient-to-br from-white to-orange-50/20 backdrop-blur-sm hover:shadow-md transition-all gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="bg-orange-50 text-orange-800 px-2 py-1 rounded border border-orange-200 text-sm font-mono">
                      {coupon.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="h-6 w-6 p-0 text-orange-700 hover:text-white hover:bg-orange-600"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {getStatusBadge(coupon)}
                  </div>

                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-900">Discount:</span>{' '}
                      {coupon.discountType === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Expires:</span> {formatDate(coupon.expiryDate)}
                    </p>
                    {typeof coupon.minimumOrderAmount === 'number' && coupon.minimumOrderAmount > 0 && (
                      <p>
                        <span className="font-semibold text-gray-900">Minimum Order:</span> ₹{coupon.minimumOrderAmount.toFixed(0)}
                      </p>
                    )}
                    {coupon.usageLimit ? (
                      <p>
                        <span className="font-semibold text-gray-900">Usage:</span> {coupon.usedCount} / {coupon.usageLimit}
                      </p>
                    ) : (
                      <p>
                        <span className="font-semibold text-gray-900">Used:</span> {coupon.usedCount}
                      </p>
                    )}
                    {coupon.description && (
                      <p>
                        <span className="font-semibold text-gray-900">Description:</span> {coupon.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                    className="border-blue-300 text-blue-700 hover:text-white hover:bg-blue-600"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === coupon._id}
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingId === coupon._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-2 border-red-200 bg-white/80 backdrop-blur-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold text-gray-900">Delete Coupon</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-700">
                          Are you sure you want to delete the coupon <span className="font-semibold">{coupon.code}</span>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(coupon._id)}
                          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
