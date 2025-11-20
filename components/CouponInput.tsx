'use client';

import { Gift, Tag, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
    <div className="mb-6 pb-6 border-b border-emerald-100 space-y-3">
      <label className="block text-xs sm:text-sm font-semibold text-emerald-900">
        Apply Coupon
      </label>

      {!appliedCoupon ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
              className="w-full px-3 py-2 rounded-full border border-emerald-200 bg-white/90 text-sm text-emerald-900 placeholder:text-emerald-700/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-sm"
            />
          </div>
          <Button
            onClick={handleApplyCoupon}
            size="sm"
            className="rounded-full bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white px-4 text-xs sm:text-sm shadow-md"
          >
            Apply
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-emerald-50/90 p-3 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Tag className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-900">
                {appliedCoupon.code}
              </p>
              <p className="text-xs text-emerald-900/70">
                {appliedCoupon.description ||
                  appliedCoupon.name ||
                  'Coupon applied to this order'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-emerald-500 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {couponError && (
        <p className="text-xs text-red-500 mt-1">{couponError}</p>
      )}

      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs sm:text-sm rounded-full border-emerald-200 text-emerald-800 hover:bg-emerald-50 flex items-center justify-center gap-2"
          >
            <Gift className="h-4 w-4" />
            View Available Coupons
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md border-emerald-100">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">
              Available Coupons
            </DialogTitle>
            <DialogDescription className="text-emerald-900/70">
              Select a coupon to apply discount to your order at Lotus Palace.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center mb-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefreshCoupons}
              disabled={isCouponLoading}
              className="flex items-center gap-2 text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isCouponLoading ? 'animate-spin' : ''
                }`}
              />
              <span className="text-xs sm:text-sm">Refresh</span>
            </Button>
            {couponFetchError && (
              <p className="text-xs text-red-500 text-right">
                {couponFetchError}
              </p>
            )}
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {availableCoupons.length === 0 ? (
              <div className="text-sm text-emerald-900/60 text-center py-6 bg-emerald-50/60 rounded-2xl border border-dashed border-emerald-200">
                {isCouponLoading
                  ? 'Loading coupons...'
                  : 'No coupons available at the moment.'}
              </div>
            ) : (
              availableCoupons.map((coupon) => {
                const minOrderValue =
                  typeof coupon.minOrder === 'number'
                    ? coupon.minOrder
                    : Number(coupon.minOrder) || 0;
                const isEligible =
                  minOrderValue <= 0 || subtotalWithGST >= minOrderValue;
                const remainingAmount = Math.max(
                  0,
                  minOrderValue - subtotalWithGST
                );
                const expiresAt = coupon.expiryDate
                  ? new Date(coupon.expiryDate)
                  : null;

                const isApplied = appliedCoupon?.code === coupon.code;

                return (
                  <button
                    key={coupon.id}
                    type="button"
                    onClick={() => isEligible && handleSelectCoupon(coupon)}
                    disabled={!isEligible || isApplied}
                    aria-disabled={!isEligible}
                    className={`w-full p-3 rounded-2xl text-left transition-all border ${
                      isApplied
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : isEligible
                        ? 'border-emerald-100 bg-white hover:border-emerald-300 hover:bg-emerald-50/60 shadow-sm hover:shadow-md'
                        : 'border-emerald-50 bg-emerald-50/70 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-emerald-900">
                          {coupon.code}
                        </p>
                        <p className="text-xs text-emerald-900/70 mt-1">
                          {coupon.description || 'No description provided'}
                        </p>
                        {minOrderValue > 0 && (
                          <p className="text-xs text-emerald-900/60 mt-1">
                            Min order: ₹{minOrderValue}
                          </p>
                        )}
                        {!isEligible && minOrderValue > 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            Add ₹{Math.max(
                              0,
                              Math.ceil(remainingAmount)
                            )}{' '}
                            more to unlock
                          </p>
                        )}
                        {expiresAt &&
                          !Number.isNaN(expiresAt.getTime()) && (
                            <p className="text-xs text-emerald-900/60 mt-1">
                              Expires:{' '}
                              {expiresAt.toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700 text-sm">
                          {coupon.type === 'percentage'
                            ? `${coupon.discount}%`
                            : `₹${coupon.discount}`}
                        </p>
                        {isApplied && (
                          <p className="text-xs text-emerald-600 mt-1 font-medium">
                            Applied
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
