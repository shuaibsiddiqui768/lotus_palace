'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, X, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface OrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface PaymentInfo {
  method: string;
  status: string;
  amount: number;
  transactionId?: string;
}

interface Order {
  _id: string;
  orderNumber?: string;
  status: 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  createdAt: string;
  total: number;
  subtotal: number;
  gst: number;
  discountAmount: number;
  estimatedTime?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  payment?: PaymentInfo;
}

interface TrackOrderProps {
  userId: string;
  initialPhone?: string;
  onBack: () => void;
}

const VALID_STATUSES: Array<Order['status']> = [
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const normalizeOrderStatus = (status?: string): Order['status'] => {
  const normalizedInput = (status ?? '').toLowerCase().trim();
  const matchedStatus = VALID_STATUSES.find(
    (validStatus) => validStatus === normalizedInput
  );
  if (matchedStatus) {
    return matchedStatus;
  }

  if (normalizedInput.includes('complete')) {
    return 'completed';
  }

  if (normalizedInput.includes('cancel')) {
    return 'cancelled';
  }

  return 'confirmed';
};

export default function TrackOrder({ userId, initialPhone, onBack }: TrackOrderProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>(
    'active'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [customerPhone, setCustomerPhone] = useState(initialPhone ?? '');
  const [userSelectedFilter, setUserSelectedFilter] = useState(false);
  const [countdownTime, setCountdownTime] = useState<{ [orderId: string]: number }>({});

  useEffect(() => {
    if (initialPhone) {
      setCustomerPhone(initialPhone);
    }
  }, [initialPhone]);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `/api/orders?userId=${encodeURIComponent(userId)}&ts=${Date.now()}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store',
            Pragma: 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const ordersData = result.data as Order[];
        const normalizedOrders = ordersData.map((order): Order => {
          const normalizedStatus = normalizeOrderStatus(order.status);
          const isCompletionDetected =
            normalizedStatus === 'completed' || order.payment?.status === 'Success';

          if (isCompletionDetected) {
            return {
              ...order,
              status: 'completed',
            };
          }

          return {
            ...order,
            status: normalizedStatus,
          };
        });
        setOrders(normalizedOrders);
        const firstOrderPhone = normalizedOrders[0]?.customerPhone;
        if (firstOrderPhone) {
          setCustomerPhone(firstOrderPhone);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch orders');
      }
    } catch (err: unknown) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isActive = true;

    const loadUser = async () => {
      try {
        const response = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store',
          },
        });
        if (!response.ok) {
          return;
        }
        const result = await response.json();
        if (!result.success) {
          return;
        }
        const userData = Array.isArray(result.data) ? result.data[0] : result.data;
        const phoneFromUser = userData?.phone;
        if (phoneFromUser && isActive) {
          setCustomerPhone(phoneFromUser);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    loadUser();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const toggleOrderExpansion = useCallback((orderId: string) => {
    setExpandedOrders((previous) => ({
      ...previous,
      [orderId]: !previous[orderId],
    }));
  }, []);

  const hasReadyOrders = orders.some((order) => order.status === 'ready');

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const scheduleRefresh = () => {
      if (!isMounted) {
        return;
      }
      setIsRefreshing(true);
      fetchOrders().finally(() => {
        if (isMounted) {
          setIsRefreshing(false);
        }
      });
    };

    scheduleRefresh();
    const refreshInterval = hasReadyOrders ? 2000 : 10000;
    const interval = setInterval(scheduleRefresh, refreshInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchOrders, userId, hasReadyOrders]);

  const mapStatusToFilter = (status: string): 'active' | 'completed' | 'cancelled' => {
    const normalizedStatus = normalizeOrderStatus(status);
    if (normalizedStatus === 'completed') return 'completed';
    if (normalizedStatus === 'cancelled') return 'cancelled';
    return 'active';
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') {
      return true;
    }
    return mapStatusToFilter(order.status) === activeFilter;
  });

  const primaryOrder = orders[0];
  const activeCount = orders.filter(
    (order) => mapStatusToFilter(order.status) === 'active'
  ).length;
  const completedCount = orders.filter(
    (order) => mapStatusToFilter(order.status) === 'completed'
  ).length;
  const cancelledCount = orders.filter(
    (order) => mapStatusToFilter(order.status) === 'cancelled'
  ).length;

  const statusSteps: Array<Exclude<Order['status'], 'cancelled'>> = [
    'confirmed',
    'preparing',
    'ready',
    'completed',
  ];
  const statusLabels: Record<Order['status'], string> = {
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  const statusDescriptions: Record<Order['status'], string> = {
    confirmed: 'Your order has been confirmed and will be prepared soon.',
    preparing: 'The kitchen is preparing your delicious meal.',
    ready: 'Your order is ready for pickup or dispatch.',
    completed: 'Order completed. Enjoy your meal!',
    cancelled: 'This order was cancelled.',
  };

  const getStatusIndex = (status: Order['status']) => {
    if (status === 'cancelled') return -1;
    return statusSteps.indexOf(status);
  };

  const getProgressValue = (status: Order['status']) => {
    const index = getStatusIndex(status);
    if (index < 0) return 0;
    const maxIndex = statusSteps.length - 1;
    if (maxIndex <= 0) return 0;
    return (index / maxIndex) * 100;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const handleDownloadBill = (order: Order) => {
    try {
      const element = document.createElement('div');
      element.innerHTML = `
        <html>
          <head>
            <title>Order Bill - ${order._id?.slice(-6).toUpperCase()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .bill-header { text-align: center; margin-bottom: 20px; }
              .bill-header h2 { margin: 0; font-size: 20px; }
              .section { margin-bottom: 20px; }
              .section h3 { margin: 10px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              .details-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
              .label { font-weight: bold; }
              .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; border-top: 2px solid #000; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="bill-header">
              <h2>Order Bill</h2>
              <p>Order #${order._id?.slice(-6).toUpperCase()}</p>
            </div>
            <div class="section">
              <h3>Customer Details</h3>
              <div class="details-row"><span class="label">Name:</span><span>${order.customerName}</span></div>
              <div class="details-row"><span class="label">Phone:</span><span>${order.customerPhone}</span></div>
              ${
                order.customerEmail
                  ? `<div class="details-row"><span class="label">Email:</span><span>${order.customerEmail}</span></div>`
                  : ''
              }
              <div class="details-row"><span class="label">Date:</span><span>${new Date(
                order.createdAt
              ).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</span></div>
              <div class="details-row"><span class="label">Type:</span><span>${
                order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)
              }</span></div>
              <div class="details-row"><span class="label">Payment:</span><span>${
                order.payment?.method || 'N/A'
              } (${order.payment?.status || 'N/A'})</span></div>
              ${
                order.orderType === 'dine-in'
                  ? `<div class="details-row"><span class="label">Table:</span><span>${order.tableNumber}</span></div>`
                  : ''
              }
              ${
                order.orderType === 'delivery'
                  ? `<div class="details-row"><span class="label">Address:</span><span>${order.deliveryAddress}</span></div>`
                  : ''
              }
            </div>
            <div class="section">
              <h3>Items</h3>
              ${order.items
                .map(
                  (item) =>
                    `<div class="details-row"><span>${item.name} (₹${item.price} x ${
                      item.quantity
                    })</span><span>₹${(item.price * item.quantity).toFixed(0)}</span></div>`
                )
                .join('')}
            </div>
            <div class="section">
              <h3>Bill Summary</h3>
              <div class="details-row"><span>Subtotal</span><span>₹${order.subtotal.toFixed(
                0
              )}</span></div>
              <div class="details-row"><span>GST (5%)</span><span>₹${order.gst.toFixed(
                0
              )}</span></div>
              ${
                order.discountAmount > 0
                  ? `<div class="details-row" style="color: green;"><span>Discount</span><span style="color: green;">-₹${order.discountAmount.toFixed(
                      0
                    )}</span></div>`
                  : ''
              }
              <div class="total-row"><span>Total</span><span>₹${order.total.toFixed(
                0
              )}</span></div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(element.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error printing bill:', error);
    }
  };

  useEffect(() => {
    if (
      !isLoading &&
      orders.length > 0 &&
      orders.every((order) => order.status === 'completed') &&
      activeFilter !== 'completed' &&
      !userSelectedFilter
    ) {
      setActiveFilter('completed');
    }
  }, [activeFilter, orders, isLoading, userSelectedFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTime((prev) => {
        const newCountdown: { [orderId: string]: number } = {};
        orders.forEach((order) => {
          if (
            order.estimatedTime &&
            order.status !== 'completed' &&
            order.status !== 'cancelled'
          ) {
            const createdTime = new Date(order.createdAt).getTime();
            const estimatedMs = order.estimatedTime * 60 * 1000;
            const endTime = createdTime + estimatedMs;
            const remainingMs = endTime - Date.now();
            newCountdown[order._id] = Math.max(
              0,
              Math.floor(remainingMs / 1000)
            );
          }
        });
        return newCountdown;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50/80 border-emerald-200';
      case 'cancelled':
        return 'bg-red-50/80 border-red-200';
      default:
        return 'bg-amber-50/70 border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' => {
    if (status === 'cancelled') return 'destructive';
    if (status === 'completed') return 'secondary';
    return 'default';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="bg-white/95 rounded-3xl shadow-xl border border-emerald-100 p-4 sm:p-6 mb-5 sm:mb-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-900 tracking-tight">
                My Orders
              </h1>
              <p className="text-xs sm:text-sm text-emerald-900/70 mt-1">
                Track the status of your recent orders at Lotus Palace.
              </p>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </div>
          </div>

          <div className="border-t border-emerald-100 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
            <div>
              <p className="text-xs sm:text-sm text-emerald-900/70 mb-1">
                Registered phone
              </p>
              <p className="text-base sm:text-lg font-semibold text-emerald-900 break-all">
                {customerPhone}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-900/60 mt-2">
                These orders are linked to your registered mobile number. Tap an
                order to see full details.
              </p>
            </div>

            {primaryOrder && (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 sm:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Guest
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-emerald-900 mt-1 truncate">
                    {primaryOrder.customerName}
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-900/75 truncate">
                    {primaryOrder.customerPhone}
                  </p>
                  {primaryOrder.customerEmail && (
                    <p className="text-[11px] text-emerald-900/70 truncate">
                      {primaryOrder.customerEmail}
                    </p>
                  )}
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 sm:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Order type
                  </p>
                  <p className="text-sm text-emerald-900 mt-1 capitalize">
                    {primaryOrder.orderType}
                  </p>
                  {primaryOrder.orderType === 'dine-in' &&
                    primaryOrder.tableNumber && (
                      <p className="text-xs sm:text-sm text-emerald-900/75">
                        Table {primaryOrder.tableNumber}
                      </p>
                    )}
                  {primaryOrder.orderType === 'delivery' &&
                    primaryOrder.deliveryAddress && (
                      <p className="text-[11px] text-emerald-900/70 line-clamp-2">
                        {primaryOrder.deliveryAddress}
                      </p>
                    )}
                  {primaryOrder.deliveryNotes && (
                    <p className="text-[11px] text-emerald-900/60 mt-1 line-clamp-2">
                      {primaryOrder.deliveryNotes}
                    </p>
                  )}
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 sm:p-4 sm:col-span-2 md:col-span-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Overview
                  </p>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-emerald-900/90">
                      {orders.length} total orders
                    </p>
                    <p className="text-[11px] text-emerald-900/70 leading-relaxed">
                      {activeCount} active • {completedCount} completed •{' '}
                      {cancelledCount} cancelled
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2">
          <Button
            onClick={() => {
              setActiveFilter('all');
              setUserSelectedFilter(true);
            }}
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={`whitespace-nowrap text-xs sm:text-sm px-3 py-1.5 rounded-full ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-lime-600 text-white border-none'
                : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            All ({orders.length})
          </Button>
          <Button
            onClick={() => {
              setActiveFilter('active');
              setUserSelectedFilter(true);
            }}
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            className={`whitespace-nowrap text-xs sm:text-sm px-3 py-1.5 rounded-full ${
              activeFilter === 'active'
                ? 'bg-gradient-to-r from-emerald-600 to-lime-600 text-white border-none'
                : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Active ({activeCount})
          </Button>
          <Button
            onClick={() => {
              setActiveFilter('completed');
              setUserSelectedFilter(true);
            }}
            variant={activeFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            className={`whitespace-nowrap text-xs sm:text-sm px-3 py-1.5 rounded-full ${
              activeFilter === 'completed'
                ? 'bg-gradient-to-r from-emerald-600 to-lime-600 text-white border-none'
                : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Completed ({completedCount})
          </Button>
          <Button
            onClick={() => {
              setActiveFilter('cancelled');
              setUserSelectedFilter(true);
            }}
            variant={activeFilter === 'cancelled' ? 'default' : 'outline'}
            size="sm"
            className={`whitespace-nowrap text-xs sm:text-sm px-3 py-1.5 rounded-full ${
              activeFilter === 'cancelled'
                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-none'
                : 'border-red-200 text-red-700 hover:bg-red-50'
            }`}
          >
            Cancelled ({cancelledCount})
          </Button>
        </div>

        {isLoading ? (
          <div className="bg-white/95 rounded-3xl shadow-md border border-emerald-100 p-10 text-center">
            <p className="text-emerald-800 text-sm sm:text-base">
              Loading your orders...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white/95 rounded-3xl shadow-md border border-red-100 p-8 text-center">
            <p className="text-red-600 text-base sm:text-lg mb-2">
              Error loading orders
            </p>
            <p className="text-emerald-900/70 text-xs sm:text-sm mb-4">
              {error}
            </p>
            <Button
              onClick={handleRefresh}
              className="bg-gradient-to-r from-emerald-600 to-lime-600 text-white rounded-full px-6"
            >
              Try again
            </Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white/95 rounded-3xl shadow-md border border-emerald-100 p-10 text-center">
            <p className="text-emerald-900 text-base sm:text-lg mb-2">
              No orders found
            </p>
            <p className="text-emerald-900/60 text-xs sm:text-sm">
              {activeFilter === 'all'
                ? "You don't have any orders yet."
                : activeFilter === 'active'
                ? "You don't have any active orders."
                : activeFilter === 'completed'
                ? "You don't have any completed orders."
                : "You don't have any cancelled orders."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const currentIndex = getStatusIndex(order.status);
              const isCancelled = order.status === 'cancelled';

              return (
                <div
                  key={order._id}
                  className={`border rounded-3xl p-3 sm:p-4 md:p-5 shadow-sm ${getStatusColor(
                    order.status
                  )}`}
                >
                  <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 shadow-sm">
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-emerald-950 text-sm sm:text-base truncate">
                            Order #{order._id?.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-[11px] sm:text-xs text-emerald-900/60">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={getStatusBadgeVariant(order.status)}
                          className="capitalize text-[11px] sm:text-xs px-2 py-0.5"
                        >
                          {statusLabels[order.status]}
                        </Badge>
                        {order.status === 'completed' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleOrderExpansion(order._id)}
                            className="flex items-center gap-1 text-[11px] sm:text-xs border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                          >
                            {expandedOrders[order._id] ? 'Hide' : 'View'} details
                            {expandedOrders[order._id] ? (
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {(order.status !== 'completed' || expandedOrders[order._id]) &&
                      (isCancelled ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs sm:text-sm text-red-700">
                          {statusDescriptions[order.status]}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
                          {/* Mobile: Vertical progress */}
                          <div className="block sm:hidden">
                            <div className="flex flex-col items-center space-y-2">
                              {statusSteps.map((step, index) => {
                                const reached = currentIndex >= index;
                                const isLast = index === statusSteps.length - 1;
                                return (
                                  <div key={step} className="flex flex-col items-center">
                                    <div
                                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
                                        reached
                                          ? 'border-amber-500 bg-amber-500 text-white'
                                          : 'border-amber-200 bg-white text-amber-200'
                                      }`}
                                    >
                                      {index + 1}
                                    </div>
                                    <div className="text-center mt-1 mb-2">
                                      <p
                                        className={`text-[11px] font-semibold uppercase tracking-wide leading-tight max-w-20 ${
                                          reached
                                            ? 'text-amber-700'
                                            : 'text-amber-300'
                                        }`}
                                      >
                                        {statusLabels[step]}
                                      </p>
                                    </div>
                                    {!isLast && (
                                      <div
                                        className={`w-0.5 h-6 rounded-full ${
                                          currentIndex > index
                                            ? 'bg-amber-400'
                                            : 'bg-amber-100'
                                        }`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Desktop: Horizontal progress */}
                          <div className="hidden sm:block">
                            <div className="flex items-center">
                              {statusSteps.map((step, index) => {
                                const reached = currentIndex >= index;
                                return (
                                  <React.Fragment key={step}>
                                    <div className="flex flex-col items-center">
                                      <div
                                        className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border text-xs font-semibold ${
                                          reached
                                            ? 'border-amber-500 bg-amber-500 text-white'
                                            : 'border-amber-200 bg-white text-amber-200'
                                        }`}
                                      >
                                        {index + 1}
                                      </div>
                                      <span
                                        className={`text-center leading-tight mt-1 text-[11px] ${
                                          reached
                                            ? 'text-amber-700'
                                            : 'text-amber-300'
                                        }`}
                                      >
                                        {statusLabels[step]}
                                      </span>
                                    </div>
                                    {index < statusSteps.length - 1 && (
                                      <div
                                        className={`flex-1 h-1 rounded-full ${
                                          currentIndex > index
                                            ? 'bg-amber-400'
                                            : 'bg-amber-100'
                                        }`}
                                      />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>

                          <Progress
                            value={getProgressValue(order.status)}
                            className="h-2 bg-orange-100 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500"
                          />
                          <p className="text-[11px] sm:text-sm text-amber-800 leading-relaxed">
                            {statusDescriptions[order.status]}
                          </p>
                        </div>
                      ))}
                  </div>

                  {(order.status !== 'completed' || expandedOrders[order._id]) && (
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-3 sm:mb-4">
                      <div className="bg-white/90 border border-emerald-50 rounded-2xl p-3 sm:p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          Customer
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-emerald-900 mt-1 truncate">
                          {order.customerName}
                        </p>
                        <p className="text-[11px] text-emerald-900/70 truncate">
                          {order.customerPhone}
                        </p>
                        {order.customerEmail && (
                          <p className="text-[11px] text-emerald-900/70 truncate">
                            {order.customerEmail}
                          </p>
                        )}
                      </div>
                      <div className="bg-white/90 border border-emerald-50 rounded-2xl p-3 sm:p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          Order details
                        </p>
                        <p className="text-sm text-emerald-900 mt-1 capitalize">
                          {order.orderType}
                        </p>
                        {order.orderType === 'dine-in' && order.tableNumber && (
                          <p className="text-[11px] text-emerald-900/80">
                            Table {order.tableNumber}
                          </p>
                        )}
                        {order.orderType !== 'dine-in' && order.deliveryAddress && (
                          <p className="text-[11px] text-emerald-900/70 line-clamp-2">
                            {order.deliveryAddress}
                          </p>
                        )}
                        {order.deliveryNotes && (
                          <p className="text-[11px] text-emerald-900/60 mt-1 line-clamp-2">
                            {order.deliveryNotes}
                          </p>
                        )}
                      </div>
                      {order.payment && (
                        <div className="bg-white/90 border border-emerald-50 rounded-2xl p-3 sm:p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                            Payment
                          </p>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm sm:text-base font-semibold text-emerald-900">
                              {order.payment.method}
                            </p>
                            <p className="text-[11px] text-emerald-900/70">
                              Status: {order.payment.status}
                            </p>
                            <p className="text-[11px] text-emerald-900/70">
                              Amount: ₹{order.payment.amount.toFixed(0)}
                            </p>
                            {order.payment.transactionId && (
                              <p className="text-[11px] text-emerald-900/60">
                                Txn ID: {order.payment.transactionId}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(order.status !== 'completed' || expandedOrders[order._id]) && (
                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                      {order.items.map((item) => (
                        <div
                          key={`${order._id}-${item.foodId}`}
                          className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-emerald-50 bg-white px-2 sm:px-3 py-2 sm:py-3"
                        >
                          {item.image_url ? (
                            <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 overflow-hidden rounded-lg bg-emerald-50 border border-emerald-100">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-base sm:text-lg font-semibold text-emerald-700 border border-emerald-100">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-emerald-950 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-emerald-900/60">
                              Qty {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm sm:text-base font-semibold text-emerald-900 flex-shrink-0">
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          Subtotal
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-emerald-950">
                          ₹{order.subtotal.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          GST
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-emerald-950">
                          ₹{order.gst.toFixed(0)}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          Discount
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-emerald-950">
                          ₹{order.discountAmount.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-left sm:text-right">
                      <div>
                        <p className="text-xs sm:text-sm text-emerald-900/70">
                          Total amount
                        </p>
                        <p className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                          ₹{order.total.toFixed(0)}
                        </p>
                      </div>
                      {order.estimatedTime && (
                        <div>
                          <p className="text-xs sm:text-sm text-emerald-900/70">
                            Est. time
                          </p>
                          <p className="text-lg sm:text-xl font-semibold text-emerald-700">
                            {order.status !== 'completed' &&
                            order.status !== 'cancelled' &&
                            countdownTime[order._id] !== undefined
                              ? `${Math.floor(countdownTime[order._id] / 60)}:${(
                                  countdownTime[order._id] % 60
                                )
                                  .toString()
                                  .padStart(2, '0')}`
                              : `${order.estimatedTime} min`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {order.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-emerald-100">
                      <Button
                        onClick={() => handleDownloadBill(order)}
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download bill
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
