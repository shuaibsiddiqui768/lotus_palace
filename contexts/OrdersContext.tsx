'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '@/lib/data';

interface OrderData {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderType: 'Rooms';
  roomNumber: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  discountAmount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
  timestamp: string;
  estimatedTime: number;
}

interface OrdersContextType {
  currentOrder: OrderData | null;
  savedOrders: OrderData[];
  setCurrentOrder: (order: OrderData) => void;
  saveOrder: (order: Omit<OrderData, 'id' | 'status' | 'estimatedTime'>) => void;
  clearCurrentOrder: () => void;
  loadOrdersByPhone: (phone: string) => Promise<void>;
  isLoading: boolean;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);
  const [savedOrders, setSavedOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('orders');
    if (saved) {
      setSavedOrders(JSON.parse(saved));
    }
    const current = localStorage.getItem('currentOrder');
    if (current) {
      setCurrentOrder(JSON.parse(current));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('orders', JSON.stringify(savedOrders));
  }, [savedOrders]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentOrder) {
      localStorage.setItem('currentOrder', JSON.stringify(currentOrder));
    }
  }, [currentOrder]);

  const loadOrdersByPhone = async (phone: string) => {
    try {
      setIsLoading(true);
      console.log('Loading orders for phone:', phone);
      const response = await fetch(`/api/users/${phone}`);
      const result = await response.json();

      if (result.success && result.data && result.data.orderHistory) {
        const orders = result.data.orderHistory.map((order: any) => ({
          id: order._id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail || '',
          orderType: order.orderType,
          roomNumber: order.roomNumber,
          deliveryAddress: order.deliveryAddress,
          deliveryNotes: order.deliveryNotes,
          items: order.items,
          subtotal: order.subtotal,
          gst: order.gst,
          discountAmount: order.discountAmount,
          total: order.total,
          status: order.status,
          timestamp: order.createdAt,
          estimatedTime: order.estimatedTime,
        }));
        setSavedOrders(orders);
        console.log('Loaded', orders.length, 'orders from database');
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrder = (order: Omit<OrderData, 'id' | 'status' | 'estimatedTime'>) => {
    const newOrder: OrderData = {
      ...order,
      id: Date.now().toString(),
      status: 'pending',
      estimatedTime: 30,
    };
    setCurrentOrder(newOrder);
    setSavedOrders((prev) => [newOrder, ...prev]);
  };

  const clearCurrentOrder = () => {
    setCurrentOrder(null);
    localStorage.removeItem('currentOrder');
  };

  return (
    <OrdersContext.Provider
      value={{
        currentOrder,
        savedOrders,
        setCurrentOrder,
        saveOrder,
        clearCurrentOrder,
        loadOrdersByPhone,
        isLoading,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
