'use client';

import { useState, useMemo, useEffect } from 'react';
import { OrdersTable } from '../components/OrdersTable';
import { OrderFilters } from '../components/OrderFilters';
import { toast } from '@/hooks/use-toast';
import { IOrder } from '@/models/Order';

export default function OrdersManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [refreshKey]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch('/api/orders', {
        cache: 'no-store' as RequestCache,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (!isAutoRefresh) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load orders',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setIsAutoRefreshing(false);
    }
  };

  const handleStatusUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getDateRange = (filter: string): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return { start, end };
      case 'week':
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      default:
        return { start: new Date('2000-01-01'), end: new Date('2099-12-31') };
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusMatch =
        statusFilter === 'all' ||
        order.status.toLowerCase() === statusFilter.toLowerCase();

      const orderDate = new Date(order.createdAt);
      const { start, end } = getDateRange(dateFilter);
      const dateMatch =
        dateFilter === 'all' || (orderDate >= start && orderDate <= end);

      return statusMatch && dateMatch;
    });
  }, [orders, statusFilter, dateFilter]);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 pt-4 pr-4 pb-4 pl-0 sm:pt-6 sm:pr-6 sm:pb-6 sm:pl-0 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-0">
      <div className="space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/40 rounded-3xl blur-3xl -z-10 opacity-60"></div>
          <div className="relative rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 backdrop-blur-sm shadow-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 bg-clip-text text-transparent">
                  Orders
                </h1>
                <p className="text-emerald-900/75 mt-2 text-sm sm:text-base">
                  View and manage customer orders
                </p>
                <p className="text-xs text-emerald-900/60 mt-1">
                  Auto-refresh enabled • Updates every 30 seconds{' '}
                  {isAutoRefreshing && (
                    <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-emerald-600 to-lime-500 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                  {filteredOrders.length} shown
                </span>
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full opacity-60"></div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 backdrop-blur-sm shadow-lg p-4 sm:p-5">
          <div className="mb-3 pb-3 border-b border-emerald-100 flex items-center justify-between">
            <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-lime-500 bg-clip-text text-transparent">
              Filters
            </h2>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-emerald-700 hover:text-white hover:bg-gradient-to-r hover:from-emerald-600 hover:to-lime-500 border border-emerald-300 rounded-lg px-3 py-1 transition-all"
            >
              Clear
            </button>
          </div>
          <OrderFilters
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 sm:py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
            <p className="text-emerald-900/80 text-base sm:text-lg font-medium">
              Loading orders...
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 backdrop-blur-sm shadow-lg p-2 sm:p-4 ml-0">
            <OrdersTable orders={filteredOrders} onStatusUpdate={handleStatusUpdated} />
          </div>
        )}
      </div>
    </div>
  );
}
