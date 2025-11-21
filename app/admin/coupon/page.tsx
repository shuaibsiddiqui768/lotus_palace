'use client';

import { useState } from 'react';
import { CouponForm } from '../components/CouponForm';
import { CouponTable } from '../components/CouponTable';

export default function CouponPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCouponAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/60 to-emerald-200/40 rounded-3xl blur-3xl -z-10 opacity-70"></div>
          <div className="relative rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 backdrop-blur-sm shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 bg-clip-text text-transparent">
              Coupon Management
            </h1>
            <p className="text-emerald-900/75 mt-2 text-sm sm:text-base">
              Create and manage discount coupons for your customers
            </p>
            <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full opacity-60"></div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm shadow-lg p-4 sm:p-5">
              <div className="mb-3 pb-3 border-b border-emerald-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-lime-500 bg-clip-text text-transparent">
                  Create Coupon
                </h2>
                <p className="text-xs text-emerald-700/70">Add new coupon codes and rules</p>
              </div>
              <CouponForm onCouponAdded={handleCouponAdded} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm shadow-lg p-4 sm:p-5">
              <div className="mb-3 pb-3 border-b border-emerald-100 flex items-center justify-between">
                <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-lime-500 bg-clip-text text-transparent">
                  Coupons List
                </h2>
                <span className="text-[11px] sm:text-xs text-emerald-700/70">
                  Manage, activate, or disable coupons
                </span>
              </div>
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <CouponTable refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
