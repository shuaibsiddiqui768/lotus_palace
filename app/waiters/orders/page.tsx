'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTransition } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ORDER_STATUS_STORAGE_KEY = 'adminOrderStatusBroadcast';
const ORDER_STATUS_EVENT = 'admin-order-status-changed';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface OrderRecord {
  _id: string;
  tableNumber?: string;
  status: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  gst: number;
  discountAmount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  deliveryNotes?: string;
  createdAt?: string;
  estimatedTime?: number;
}

const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'completed'] as const;

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'destructive',
  confirmed: 'outline',
  preparing: 'outline',
  ready: 'default',
  completed: 'secondary',
};

const statusFlow: Record<string, string | null> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
  completed: null,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dine-in' | 'takeaway' | 'delivery'>('all');
  const [statusFilter, setStatusFilter] = useState<'ready' | 'completed'>('ready');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const fetchOrders = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setIsLoading(true);
      }
      setError('');
      const response = await fetch('/api/orders?status=pending&status=confirmed&status=preparing&status=ready&status=completed', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message ?? 'Unable to load orders');
      }
      setOrders(result.data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Unexpected error');
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  }, []);

  const broadcastOrderStatus = useCallback((orderId: string, status: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    const payload = { orderId, status, updatedAt: Date.now() };
    window.localStorage.setItem(ORDER_STATUS_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(ORDER_STATUS_EVENT, { detail: payload }));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBroadcast = (status: string | undefined) => {
      if (!status) {
        return;
      }
      const normalized = status.toLowerCase();
      if (normalized === 'ready') {
        fetchOrders(true);
        return;
      }
      if (normalized === 'completed' && statusFilter === 'completed') {
        fetchOrders(true);
      }
    };

    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: string }>).detail;
      handleBroadcast(detail?.status);
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key !== ORDER_STATUS_STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        const payload = JSON.parse(event.newValue);
        handleBroadcast(payload?.status);
      } catch {
        // ignore malformed payload
      }
    };

    window.addEventListener(ORDER_STATUS_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    const stored = window.localStorage.getItem(ORDER_STATUS_STORAGE_KEY);
    if (stored) {
      try {
        const payload = JSON.parse(stored);
        handleBroadcast(payload?.status);
      } catch {
        // ignore malformed payload
      }
    }

    return () => {
      window.removeEventListener(ORDER_STATUS_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [fetchOrders, statusFilter]);

  const filteredOrders = useMemo(() => {
    const normalizedStatusFilter = statusFilter.toLowerCase();
    let filtered = orders.filter((order) => order.status?.toLowerCase() === normalizedStatusFilter);

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((order) => order.orderType === categoryFilter);
    }

    return filtered;
  }, [orders, categoryFilter, statusFilter]);

  const handleStatusChange = useCallback(
    async (orderId: string, status: string) => {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
          });

          if (!response.ok) {
            throw new Error('Failed to update status');
          }

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.message ?? 'Unable to update order');
          }

          setOrders((prev) => prev.map((order) => (order._id === orderId ? result.data : order)));
          if (status.toLowerCase() === 'completed' || status.toLowerCase() === 'ready') {
            broadcastOrderStatus(orderId, status);
          }
        } catch (err: any) {
          setError(err.message ?? 'Unexpected error');
        }
      });
    },
    [broadcastOrderStatus]
  );

  const toggleOrderExpansion = useCallback((orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  const renderOrderCard = (order: OrderRecord) => {
    const normalizedStatus = order.status?.toLowerCase() ?? '';
    const readableStatus = statusLabels[normalizedStatus] ?? order.status;
    const badgeVariant = statusVariant[normalizedStatus] ?? 'secondary';

    // themed subtle background for card surface + border
    return (
      <Card
        key={order._id}
        className={cn(
          'transition-shadow border border-orange-100/70 bg-white/95 backdrop-blur-sm hover:shadow-lg',
          isPending && 'opacity-90'
        )}
      >
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg text-gray-900">
                Order #{order._id.slice(-6).toUpperCase()} •{' '}
                {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}
              </CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                {order.customerName && <span>{order.customerName}</span>}
                {order.customerPhone && <span>• {order.customerPhone}</span>}
                {order.customerEmail && <span>• {order.customerEmail}</span>}
                <span>• {order.orderType.replace(/-/g, ' ')}</span>
                {order.estimatedTime && <span>• ETA {order.estimatedTime} min</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={badgeVariant}
                className={
                  normalizedStatus === 'ready'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : normalizedStatus === 'pending'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : normalizedStatus === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'border'
                }
              >
                {readableStatus}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-1 h-8 w-8"
                onClick={() => toggleOrderExpansion(order._id)}
              >
                {expandedOrders.has(order._id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-4", !expandedOrders.has(order._id) && "hidden md:block")}>
          {/* Delivery Information */}
          {order.orderType === 'delivery' && (order.deliveryAddress || order.deliveryNotes) && (
            <div>
              <h4 className="font-medium text-gray-900">Delivery Details</h4>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                {order.deliveryAddress && (
                  <p>
                    <strong>Address:</strong> {order.deliveryAddress}
                  </p>
                )}
                {order.deliveryNotes && (
                  <p>
                    <strong>Notes:</strong> {order.deliveryNotes}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-900">Items</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {order.items.map((item, index) => (
                <li key={`${order._id}-item-${index}`} className="flex items-center justify-between">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cost Breakdown */}
          <div className="border-t pt-3">
            <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST:</span>
                <span>₹{order.gst?.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{order.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 border-t pt-1">
                <span>Total:</span>
                <span>₹{order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
            <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</span>
            <span className="text-base font-semibold text-gray-900">Total ₹{order.total?.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Status:</span>
              <Badge
                variant={badgeVariant}
                className={
                  normalizedStatus === 'ready'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : normalizedStatus === 'pending'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : normalizedStatus === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'border'
                }
              >
                {readableStatus}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilter === 'ready' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(order._id, 'completed')}
                  disabled={isPending}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                >
                  Mark as Completed
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchOrders()}
                disabled={isPending || isLoading}
                className="hover:border-orange-300 hover:text-orange-700"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
            {statusFilter === 'ready' ? 'Ready Orders' : 'Completed Orders'}
          </h1>
          <p className="text-gray-600 mt-2">
            {statusFilter === 'ready'
              ? 'View orders ready for pickup/delivery and mark as completed'
              : 'View all completed orders'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Updates when new ready orders arrive</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-40 text-left capitalize hover:border-orange-300">
              <SelectValue placeholder="View orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ready">Ready Orders</SelectItem>
              <SelectItem value="completed">Completed Orders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as typeof categoryFilter)}>
            <SelectTrigger className="w-48 text-left capitalize hover:border-orange-300">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="dine-in">Dine-in</SelectItem>
              <SelectItem value="takeaway">Takeaway</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => fetchOrders()}
            disabled={isLoading || isPending}
            className="hover:border-orange-300 hover:text-orange-700"
          >
            Refresh orders
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border border-orange-100/70 bg-white/95 backdrop-blur-sm">
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-md border border-orange-100 bg-white/95 backdrop-blur-sm p-8 text-center text-sm text-gray-600">
          No {statusFilter} orders found.
        </div>
      ) : (
        <div className="space-y-4">{filteredOrders.map((order) => renderOrderCard(order))}</div>
      )}
    </div>
  );
}
