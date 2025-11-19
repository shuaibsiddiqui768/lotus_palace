'use client';

import { Card } from '@/components/ui/card';

export function RecentOrders() {
  const orders = [
    { id: 'ORD001', customer: 'John Doe', amount: '$45.99', status: 'Delivered' },
    { id: 'ORD002', customer: 'Jane Smith', amount: '$67.50', status: 'Processing' },
    { id: 'ORD003', customer: 'Bob Johnson', amount: '$32.00', status: 'Pending' },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="border-b border-gray-200 pb-3 last:border-0">
            <p className="text-sm font-medium text-gray-900">{order.customer}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-600">{order.id}</span>
              <span className="text-xs font-medium text-orange-600">{order.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
