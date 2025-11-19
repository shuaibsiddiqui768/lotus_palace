'use client';

import { Card } from '@/components/ui/card';
import { ShoppingCart, Users, TrendingUp, DollarSign } from 'lucide-react';

export function DashboardStats() {
  const stats = [
    { label: 'Total Orders', value: '1,234', icon: ShoppingCart, color: 'from-blue-500 to-sky-500' },
    { label: 'Active Users', value: '567', icon: Users, color: 'from-emerald-500 to-green-500' },
    { label: 'Total Revenue', value: '₹12,345', icon: DollarSign, color: 'from-orange-500 to-amber-500' },
    { label: 'Growth', value: '+12.5%', icon: TrendingUp, color: 'from-purple-500 to-violet-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="p-4 sm:p-6 shadow-xl rounded-2xl border-2 border-orange-200/50 bg-white/70 backdrop-blur-md hover:shadow-2xl transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">{stat.label}</p>
                <p className="text-lg sm:text-xl md:text-2xl font-extrabold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent mt-1 sm:mt-2">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md ring-1 ring-white/30`}
              >
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
              </div>
            </div>

            <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-r from-transparent via-orange-400/60 to-transparent"></div>
          </Card>
        );
      })}
    </div>
  );
}
