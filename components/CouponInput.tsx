'use client';

import { Gift, Tag, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface CouponOption {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discount: number;
  type: 'percentage' | 'fixed';
  minOrder?: number;
  expiryDate?: string;
  isActive?: boolean;
  usageLimit?: number;
  usedCount?: number;
}

interface CouponInputProps {
  couponCode: string;
  setCouponCode: (value: string) => void;
  appliedCoupon: CouponOption | null;
  showCouponModal: boolean;
  setShowCouponModal: (value: boolean) => void;
  couponError: string;
  handleApplyCoupon: () => void;
  handleSelectCoupon: (coupon: CouponOption) => void;
  handleRemoveCoupon: () => void;
  subtotalWithGST: number;
  availableCoupons: CouponOption[];
  isCouponLoading: boolean;
  couponFetchError: string;
  onRefreshCoupons: () => void;
}

export default function CouponInput({
  couponCode,
  setCouponCode,
  appliedCoupon,
  showCouponModal,
  setShowCouponModal,
  couponError,
  handleApplyCoupon,
  handleSelectCoupon,
  handleRemoveCoupon,
  subtotalWithGST,
  availableCoupons,
  isCouponLoading,
  couponFetchError,
  onRefreshCoupons,
}: CouponInputProps) {
  return (
    <div className="mb-6 pb-6 border-b space-y-3">
      <label className="block text-xs sm:text-sm font-medium text-gray-700">Apply Coupon</label>
      {!appliedCoupon ? (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
          <Button
            onClick={handleApplyCoupon}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Apply
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <div>
              <p className="font-medium text-sm text-gray-900">{appliedCoupon.code}</p>
              <p className="text-xs text-gray-600">{appliedCoupon.description || appliedCoupon.name || 'Coupon applied'}</p>
            </div>
          </div>

          <button
            onClick={handleRemoveCoupon}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
          
        </div>
      )}
      {couponError && <p className="text-xs text-red-500">{couponError}</p>}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
            <Gift className="h-4 w-4 mr-2" />
            View Available Coupons
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Available Coupons</DialogTitle>
            <DialogDescription>Select a coupon to apply discount to your order</DialogDescription>
          </DialogHeader>
          <div className="flex justify-between items-center mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefreshCoupons}
              disabled={isCouponLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isCouponLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {couponFetchError && <p className="text-xs text-red-500">{couponFetchError}</p>}
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {availableCoupons.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-6">
                {isCouponLoading ? 'Loading coupons...' : 'No coupons available at the moment.'}
              </div>
            ) : (
              availableCoupons.map((coupon) => {
                const minOrderValue = typeof coupon.minOrder === 'number' ? coupon.minOrder : Number(coupon.minOrder) || 0;
                const isEligible = minOrderValue <= 0 || subtotalWithGST >= minOrderValue;
                const remainingAmount = Math.max(0, minOrderValue - subtotalWithGST);
                const expiresAt = coupon.expiryDate ? new Date(coupon.expiryDate) : null;
                return (
                  <button
                    key={coupon.id}
                    onClick={() => isEligible && handleSelectCoupon(coupon)}
                    disabled={!isEligible || appliedCoupon?.code === coupon.code}
                    aria-disabled={!isEligible}
                    className={`w-full p-3 border rounded-lg text-left transition-all ${
                      appliedCoupon?.code === coupon.code
                        ? 'border-green-500 bg-green-50'
                        : isEligible
                        ? 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'
                        : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{coupon.code}</p>
                        <p className="text-xs text-gray-600 mt-1">{coupon.description || 'No description provided'}</p>
                        {minOrderValue > 0 && (
                          <p className="text-xs text-gray-500 mt-1">Min order: ₹{minOrderValue}</p>
                        )}
                        {!isEligible && minOrderValue > 0 && (
                          <p className="text-xs text-red-500 mt-1">Add ₹{Math.max(0, Math.ceil(remainingAmount))} more to unlock</p>
                        )}
                        {expiresAt && !Number.isNaN(expiresAt.getTime()) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires: {expiresAt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">
                          {coupon.type === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}
                        </p>
                        {appliedCoupon?.code === coupon.code && (
                          <p className="text-xs text-green-600 mt-1">Applied</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
