'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trash2, Eye, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { IOrder, IPayment } from '@/models/Order';

const ORDER_STATUS_STORAGE_KEY = 'adminOrderStatusBroadcast';
const ORDER_STATUS_EVENT = 'admin-order-status-changed';

const broadcastOrderStatus = (orderId: string, status: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  const payload = { orderId, status, updatedAt: Date.now() };
  window.localStorage.setItem(ORDER_STATUS_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(ORDER_STATUS_EVENT, { detail: payload }));
};

const PAYMENT_STATUS_OPTIONS: { value: IPayment['status']; label: string }[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Success', label: 'Complete' },
  { value: 'Failed', label: 'Failed' },
  { value: 'UPI-completed', label: 'UPI Completed' },
];

interface OrdersTableProps {
  orders: IOrder[];
  onStatusUpdate?: () => void;
}

export function OrdersTable({ orders, onStatusUpdate }: OrdersTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [itemsModalOrderId, setItemsModalOrderId] = useState<string | null>(null);
  const [estimatedTimeModalOrderId, setEstimatedTimeModalOrderId] = useState<string | null>(null);
  const [estimatedTimeInput, setEstimatedTimeInput] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(8);
  const [countdownTime, setCountdownTime] = useState<{ [orderId: string]: number }>({});

  useEffect(() => {
    setVisibleCount((prev) => {
      const minimum = Math.min(8, orders.length);
      if (orders.length === 0) {
        return 0;
      }
      if (prev === 0) {
        return minimum;
      }
      if (prev > orders.length) {
        return minimum;
      }
      return Math.max(prev, minimum);
    });
  }, [orders]);

  useEffect(() => {
    if (estimatedTimeModalOrderId) {
      const order = orders.find(o => o._id === estimatedTimeModalOrderId);
      setEstimatedTimeInput(order?.estimatedTime?.toString() || '30');
    }
  }, [estimatedTimeModalOrderId, orders]);

  // Countdown timer effect for admin table
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTime((prev) => {
        const newCountdown: { [orderId: string]: number } = {};
        orders.forEach((order) => {
          if (order.estimatedTime && order.status !== 'completed' && order.status !== 'cancelled') {
            const createdTime = new Date(order.createdAt).getTime();
            const estimatedMs = order.estimatedTime * 60 * 1000; // Convert minutes to milliseconds
            const endTime = createdTime + estimatedMs;
            const remainingMs = endTime - Date.now();
            newCountdown[order._id] = Math.max(0, Math.floor(remainingMs / 1000)); // Remaining seconds
          }
        });
        return newCountdown;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const visibleOrders = useMemo(() => orders.slice(0, visibleCount), [orders, visibleCount]);

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'upi-completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusDisplayText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'Complete';
      case 'upi-completed':
        return '✓ UPI Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'preparing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeColor = (orderType: string) => {
    switch (orderType) {
      case 'dine-in':
        return 'bg-emerald-100 text-emerald-800';
      case 'takeaway':
        return 'bg-orange-100 text-orange-800';
      case 'delivery':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeLabel = (orderType: string) => {
    return orderType
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const getOrderItemSummary = (order: IOrder) => {
    const totalItems = order.items.reduce((total, item) => total + item.quantity, 0);
    const primaryItem = order.items[0]?.name;
    const additionalItems = order.items.length > 1 ? order.items.length - 1 : 0;

    return {
      totalItems,
      description: primaryItem
        ? additionalItems > 0
          ? `${primaryItem} +${additionalItems} more`
          : primaryItem
        : 'No items listed',
    };
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });

      broadcastOrderStatus(orderId, newStatus);
      onStatusUpdate?.();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleShowDeleteConfirm = (orderId: string) => {
    setDeleteConfirmId(orderId);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingId(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete order');
      }

      toast({
        title: 'Success',
        description: 'Order deleted successfully',
      });

      onStatusUpdate?.();
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete order',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handlePaymentStatusUpdate = async (orderId: string, newStatus: IPayment['status']) => {
    try {
      setUpdatingPaymentId(orderId);
      console.log(`Updating payment for order ${orderId} status to ${newStatus}`);
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          updatePaymentStatus: true,
          paymentStatus: newStatus 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update payment status');
      }

      console.log(`Payment for order ${orderId} status updated to ${newStatus} successfully`);
      toast({
        title: 'Success',
        description: `Payment status updated to ${newStatus === 'Success' ? 'Completed' : newStatus}`,
      });

      onStatusUpdate?.();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleMarkPaymentComplete = async (orderId: string) => {
    await handlePaymentStatusUpdate(orderId, 'Success');
  };

  const handleCreatePayment = async (orderId: string, status: IPayment['status']) => {
    try {
      setUpdatingPaymentId(orderId);
      const order = orders.find(o => o._id === orderId);
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createPayment: true,
          payment: {
            method: 'Cash',
            amount: order?.total || 0,
            status
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment');
      }

      toast({
        title: 'Success',
        description: 'Payment created successfully',
      });

      onStatusUpdate?.();
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive',
      });
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleEstimatedTimeUpdate = async (orderId: string, estimatedTime: number) => {
    try {
      setUpdatingId(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estimatedTime }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update estimated time');
      }

      toast({
        title: 'Success',
        description: 'Estimated time updated successfully',
      });

      onStatusUpdate?.();
    } catch (error: any) {
      console.error('Error updating estimated time:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update estimated time',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
      setEstimatedTimeModalOrderId(null);
    }
  };

  const getDisplayInfo = (order: IOrder) => {
    switch (order.orderType) {
      case 'dine-in':
        return {
          label: `Table ${order.tableNumber}`,
          icon: '🍽️',
        };
      case 'takeaway':
        return {
          label: 'Takeaway',
          icon: '📦',
        };
      case 'delivery':
        return {
          label: order.deliveryAddress?.substring(0, 30) + '...' || 'Delivery',
          icon: '🚗',
        };
      default:
        return { label: 'Unknown', icon: '?' };
    }
  };

  if (orders.length === 0) {
    return (
      <Card className="pt-3 pr-3 pb-3 pl-0 sm:pt-6 sm:pr-6 sm:pb-6 sm:pl-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/50">
        <div className="text-center py-12">
          <p className="text-gray-500 text-base">No orders found matching your filters.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="pt-3 pr-3 pb-3 pl-0 sm:pt-6 sm:pr-6 sm:pb-6 sm:pl-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/50 ml-0">
      {/* Desktop view - traditional table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Order ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Customer</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Order Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Items</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Fulfillment</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Amount</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Payment</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Est. Time</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => {
              const displayInfo = getDisplayInfo(order);
              const itemSummary = getOrderItemSummary(order);
              const orderTypeLabel = getOrderTypeLabel(order.orderType);
              return (
                <tr key={order._id} className="border-b border-gray-100 hover:bg-orange-50/50">
                  <td className="py-3 px-4 text-gray-900 font-medium text-sm">#{order._id.slice(-6).toUpperCase()}</td>
                  <td className="py-3 px-4 text-gray-900 text-sm">
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerPhone}</p>
                      {order.customerEmail ? (
                        <p className="text-xs text-gray-400">{order.customerEmail}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getOrderTypeColor(order.orderType)}`}>
                      {orderTypeLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{itemSummary.description}</p>
                        <p className="text-xs text-gray-500">{itemSummary.totalItems} items</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setItemsModalOrderId(order._id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>{displayInfo.icon}</span>
                      <span>{displayInfo.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium text-sm">₹{order.total.toFixed(0)}</td>
                  <td className="py-3 px-4">
                    {order.payment ? (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPaymentStatusColor(order.payment.status)}`}>
                          {order.payment.method} - {getPaymentStatusDisplayText(order.payment.status)}
                        </span>
                        {order.payment.method === 'Cash' && order.payment.status === 'Pending' && (
                          <Button
                            size="sm"
                            className="w-full text-xs h-6 bg-green-600 hover:bg-green-700 text-white"
                            disabled={updatingPaymentId === order._id}
                            onClick={() => handleMarkPaymentComplete(order._id)}
                          >
                            {updatingPaymentId === order._id ? 'Completing...' : 'Mark Complete'}
                          </Button>
                        )}
                        {order.payment.method === 'Cash' && order.payment.status !== 'Pending' && (
                          <span className="text-xs text-gray-500 text-center py-1">
                            {order.payment.status === 'Success' ? 'Payment Completed' : 'Payment Failed'}
                          </span>
                        )}
                        {order.payment.method === 'UPI' && order.payment.status === 'UPI-completed' && (
                          <span className="text-xs text-green-600 text-center py-1 font-semibold">Auto-verified</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                          No Payment
                        </span>
                        <Select
                          value=""
                          onValueChange={(value) => handleCreatePayment(order._id, value as IPayment['status'])}
                          disabled={updatingPaymentId === order._id}
                        >
                          <SelectTrigger className="w-24 text-xs h-6">
                            <SelectValue placeholder="Add payment" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusUpdate(order._id, value)}
                      disabled={updatingId === order._id || deletingId === order._id}
                    >
                      <SelectTrigger className={`w-32 text-xs h-8 ${getStatusColor(order.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium text-sm">
                    {/* Desktop estimated time display */}
                    {order.estimatedTime && order.status !== 'completed' && order.status !== 'cancelled' && countdownTime[order._id] !== undefined ? (
                      <span className="text-orange-600 font-semibold">
                        {Math.floor(countdownTime[order._id] / 60)}:{(countdownTime[order._id] % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      order.estimatedTime ? `${order.estimatedTime} min` : '-'
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setEstimatedTimeModalOrderId(order._id)}
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === order._id || updatingId === order._id}
                        onClick={() => handleShowDeleteConfirm(order._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibleCount < orders.length ? (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((prev) => Math.min(prev + 8, orders.length))}
            >
              View More
            </Button>
          </div>
        ) : null}
      </div>
    </div>

      {/* Mobile view - card-based layout */}
      <div className="md:hidden space-y-3">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Orders</h2>
        {visibleOrders.map((order) => {
          const displayInfo = getDisplayInfo(order);
          const itemSummary = getOrderItemSummary(order);
          const orderTypeLabel = getOrderTypeLabel(order.orderType);
          return (
            <div key={order._id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-sm">Order #{order._id.slice(-6).toUpperCase()}</p>
                  <p className="font-medium text-sm">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.customerPhone}</p>
                  {order.customerEmail ? (
                    <p className="text-xs text-gray-400">{order.customerEmail}</p>
                  ) : null}
                  <p className="text-xs text-gray-600 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-gray-500">Order Type</p>
                  <p className={`font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${getOrderTypeColor(order.orderType)}`}>
                    {orderTypeLabel}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-medium">₹{order.total.toFixed(0)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Payment</p>
                  {order.payment ? (
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPaymentStatusColor(order.payment.status)}`}>
                        {order.payment.method} - {getPaymentStatusDisplayText(order.payment.status)}
                      </span>
                      {order.payment.method === 'Cash' && order.payment.status === 'Pending' && (
                        <Button
                          size="sm"
                          className="w-full text-xs h-6 bg-green-600 hover:bg-green-700 text-white"
                          disabled={updatingPaymentId === order._id}
                          onClick={() => handleMarkPaymentComplete(order._id)}
                        >
                          {updatingPaymentId === order._id ? 'Completing...' : 'Mark Complete'}
                        </Button>
                      )}
                      {order.payment.method === 'Cash' && order.payment.status !== 'Pending' && (
                        <span className="text-xs text-gray-500 text-center py-1">
                          {order.payment.status === 'Success' ? 'Payment Completed' : 'Payment Failed'}
                        </span>
                      )}
                      {order.payment.method === 'UPI' && order.payment.status === 'UPI-completed' && (
                        <span className="text-xs text-green-600 text-center py-1 font-semibold">Auto-verified</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                        No Payment
                      </span>
                      <Select
                        value=""
                        onValueChange={(value) => handleCreatePayment(order._id, value as IPayment['status'])}
                        disabled={updatingPaymentId === order._id}
                      >
                        <SelectTrigger className="w-24 text-xs h-6">
                          <SelectValue placeholder="Add payment" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Items</p>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{itemSummary.description}</p>
                      <p className="text-[11px] text-gray-500">{itemSummary.totalItems} items</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => setItemsModalOrderId(order._id)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Fulfillment Details</p>
                  <p className="font-medium flex items-center gap-1">
                    <span>{displayInfo.icon}</span>
                    <span>{displayInfo.label}</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Est. Time</p>
                  <p className="font-medium">
                    {order.estimatedTime && order.status !== 'completed' && order.status !== 'cancelled' && countdownTime[order._id] !== undefined ? (
                      <span className="text-orange-600 font-semibold">
                        {Math.floor(countdownTime[order._id] / 60)}:{(countdownTime[order._id] % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      order.estimatedTime ? `${order.estimatedTime} min` : '-'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setEstimatedTimeModalOrderId(order._id)}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Set Time
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={deletingId === order._id || updatingId === order._id}
                    onClick={() => handleShowDeleteConfirm(order._id)}
                  >
                    {deletingId === order._id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
                <Select
                  value={order.status}
                  onValueChange={(value) => handleStatusUpdate(order._id, value)}
                  disabled={updatingId === order._id || deletingId === order._id}
                >
                  <SelectTrigger className="w-full text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount < orders.length ? (
        <div className="mt-4 flex justify-center md:hidden">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => Math.min(prev + 8, orders.length))}
          >
            View More
          </Button>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteOrder(deleteConfirmId)}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Items Details Modal */}
      {itemsModalOrderId && (
        <Dialog open={true} onOpenChange={(open) => !open && setItemsModalOrderId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Items - #{orders.find(o => o._id === itemsModalOrderId)?._id?.slice(-6).toUpperCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {orders.find(o => o._id === itemsModalOrderId)?.items.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                          Qty: {item.quantity}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-600">Unit Price</p>
                      <p className="text-sm font-medium text-gray-900">₹{item.price?.toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total: {item.quantity} × ₹{item.price?.toFixed(0)}</span>
                      <span className="text-sm font-semibold text-gray-900">₹{(item.price! * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Estimated Time Modal */}
      {estimatedTimeModalOrderId && (
        <Dialog open={true} onOpenChange={(open) => !open && setEstimatedTimeModalOrderId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Estimated Time</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Estimated preparation time (minutes)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="240"
                  value={estimatedTimeInput}
                  onChange={(e) => setEstimatedTimeInput(e.target.value)}
                  placeholder="Enter time in minutes"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEstimatedTimeModalOrderId(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const time = parseInt(estimatedTimeInput);
                    if (time > 0 && time <= 240) {
                      handleEstimatedTimeUpdate(estimatedTimeModalOrderId, time);
                    } else {
                      toast({
                        title: 'Invalid Time',
                        description: 'Please enter a time between 1 and 240 minutes',
                        variant: 'destructive',
                      });
                    }
                  }}
                  disabled={updatingId === estimatedTimeModalOrderId}
                >
                  {updatingId === estimatedTimeModalOrderId ? 'Updating...' : 'Update Time'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
