'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export type WaiterNotificationItem = {
  orderId: string;
  readyAt: number;
  read: boolean;
  tableNumber?: string;
  orderType?: string;
  customerName?: string;
  total?: number;
  createdAt?: string;
  items?: { name?: string; quantity?: number }[];
};

export type WaiterTableNotificationItem = {
  tableId: string;
  assignedAt: number;
  read: boolean;
  tableNumber?: number;
  status?: string;
  orderId?: string;
  customerName?: string;
  total?: number;
  orderUpdatedAt?: string;
};

const ORDER_STATUS_STORAGE_KEY = 'adminOrderStatusBroadcast';
const ORDER_STATUS_EVENT = 'admin-order-status-changed';
const NOTIFICATION_STORAGE_KEY = 'waiterReadyOrderNotifications';
const TABLE_NOTIFICATION_STORAGE_KEY = 'waiterTableNotifications';
const TABLE_REFRESH_EVENT = 'waiter-table-refresh';
const TABLE_POLL_INTERVAL = 5000;

export function WaitersLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/waiters/login';
  const [notifications, setNotifications] = useState<WaiterNotificationItem[]>([]);
  const [tableNotifications, setTableNotifications] = useState<WaiterTableNotificationItem[]>([]);

  const updateNotifications = useCallback((updater: (prev: WaiterNotificationItem[]) => WaiterNotificationItem[]) => {
    setNotifications((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const updateTableNotifications = useCallback(
    (updater: (prev: WaiterTableNotificationItem[]) => WaiterTableNotificationItem[]) => {
      setTableNotifications((prev) => {
        const next = updater(prev);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(TABLE_NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    []
  );

  const addNotification = useCallback(
    (notification: WaiterNotificationItem) => {
      updateNotifications((prev) => {
        const existing = prev.find((item) => item.orderId === notification.orderId);
        const merged = existing ? { ...existing, ...notification, read: false, readyAt: notification.readyAt } : notification;
        const filtered = prev.filter((item) => item.orderId !== notification.orderId);
        const next = [merged, ...filtered].sort((a, b) => b.readyAt - a.readyAt).slice(0, 20);
        return next;
      });
    },
    [updateNotifications]
  );

  const removeNotification = useCallback(
    (orderId: string) => {
      updateNotifications((prev) => prev.filter((item) => item.orderId !== orderId));
    },
    [updateNotifications]
  );

  const markAllAsRead = useCallback(() => {
    updateNotifications((prev) => prev.map((item) => (item.read ? item : { ...item, read: true })));
  }, [updateNotifications]);

  const markAllTablesAsRead = useCallback(() => {
    updateTableNotifications((prev) => prev.map((item) => (item.read ? item : { ...item, read: true })));
  }, [updateTableNotifications]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedOrders = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (storedOrders) {
      try {
        const parsed = JSON.parse(storedOrders) as WaiterNotificationItem[];
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((item) => ({
              ...item,
              readyAt: typeof item.readyAt === 'number' ? item.readyAt : Date.now(),
              read: !!item.read,
            }))
            .sort((a, b) => b.readyAt - a.readyAt)
            .slice(0, 20);
          setNotifications(normalized);
        }
      } catch {
        setNotifications([]);
      }
    }

    const storedTables = window.localStorage.getItem(TABLE_NOTIFICATION_STORAGE_KEY);
    if (storedTables) {
      try {
        const parsed = JSON.parse(storedTables) as WaiterTableNotificationItem[];
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((item) => ({
              ...item,
              assignedAt: typeof item.assignedAt === 'number' ? item.assignedAt : Date.now(),
              read: !!item.read,
            }))
            .sort((a, b) => b.assignedAt - a.assignedAt)
            .slice(0, 20);
          setTableNotifications(normalized);
        }
      } catch {
        setTableNotifications([]);
      }
    }
  }, []);

  const fetchOrderDetails = useCallback(
    async (orderId: string) => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const payload = await response.json();
        if (!payload?.success || !payload?.data) {
          throw new Error('Invalid order payload');
        }
        const order = payload.data;
        const items = Array.isArray(order?.items)
          ? order.items.map((item: any) => ({
              name: item?.name ?? '',
              quantity: typeof item?.quantity === 'number' ? item.quantity : Number(item?.quantity ?? 0),
            }))
          : [];
        addNotification({
          orderId,
          readyAt: Date.now(),
          read: false,
          tableNumber: order?.tableNumber ?? undefined,
          orderType: order?.orderType ?? undefined,
          customerName: order?.customerName ?? undefined,
          total: typeof order?.total === 'number' ? order.total : undefined,
          createdAt: order?.createdAt ?? undefined,
          items,
        });
      } catch {
        addNotification({
          orderId,
          readyAt: Date.now(),
          read: false,
        });
      }
    },
    [addNotification]
  );

  const synchronizeTableNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || isLoginPage) {
      return;
    }
    try {
      const response = await fetch('/api/tables', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      if (!payload?.success || !Array.isArray(payload?.data)) {
        return;
      }
      const activeTables = payload.data.filter((table: any) => {
        const status = table?.status?.toString().toLowerCase();
        if (status && status !== 'available') {
          return true;
        }
        return !!table?.currentOrder;
      });
      updateTableNotifications((prev) => {
        const previousMap = new Map(prev.map((item) => [item.tableId, item]));
        const next: WaiterTableNotificationItem[] = [];
        activeTables.forEach((table: any) => {
          const tableId: string | undefined = table?._id ?? table?.id;
          if (!tableId) {
            return;
          }
          const currentOrder = table?.currentOrder ?? null;
          const orderId: string | undefined = currentOrder?._id ?? currentOrder?.id ?? undefined;
          const orderUpdatedAt: string | undefined =
            currentOrder?.updatedAt ?? currentOrder?.createdAt ?? undefined;
          const status: string | undefined = typeof table?.status === 'string' ? table.status : undefined;
          const existing = previousMap.get(tableId);
          let read = existing?.read ?? false;
          let assignedAt = existing?.assignedAt ?? Date.now();
          const previousOrderId = existing?.orderId ?? undefined;
          const previousStatus = existing?.status ?? undefined;
          const previousOrderUpdatedAt = existing?.orderUpdatedAt ?? undefined;
          if (!existing) {
            read = false;
            assignedAt = Date.now();
          } else if (
            previousOrderId !== orderId ||
            previousStatus !== status ||
            previousOrderUpdatedAt !== orderUpdatedAt
          ) {
            read = false;
            assignedAt = Date.now();
          }
          next.push({
            tableId,
            assignedAt,
            read,
            tableNumber: typeof table?.tableNumber === 'number' ? table.tableNumber : undefined,
            status,
            orderId,
            customerName: currentOrder?.customerName ?? undefined,
            total: typeof currentOrder?.total === 'number' ? currentOrder.total : undefined,
            orderUpdatedAt,
          });
        });
        return next.sort((a, b) => b.assignedAt - a.assignedAt).slice(0, 50);
      });
    } catch {
      // ignore sync failures
    }
  }, [isLoginPage, updateTableNotifications]);

  const handleBroadcast = useCallback(
    (payload?: { orderId?: string; status?: string }) => {
      if (!payload?.orderId || !payload?.status) {
        return;
      }
      const normalizedStatus = payload.status.toLowerCase();
      if (normalizedStatus === 'ready') {
        fetchOrderDetails(payload.orderId);
        return;
      }
      if (normalizedStatus === 'completed') {
        removeNotification(payload.orderId);
      }
    },
    [fetchOrderDetails, removeNotification]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || isLoginPage) {
      return;
    }

    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ orderId?: string; status?: string }>).detail;
      handleBroadcast(detail);
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key !== ORDER_STATUS_STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        const detail = JSON.parse(event.newValue);
        handleBroadcast(detail);
      } catch {}
    };

    const handleTableRefresh = () => {
      synchronizeTableNotifications();
    };

    const handleTableStorage = (event: StorageEvent) => {
      if (event.key === 'adminTableAssignedCount' || event.key === 'adminTableOccupiedCount') {
        synchronizeTableNotifications();
      }
    };

    window.addEventListener(ORDER_STATUS_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener(TABLE_REFRESH_EVENT, handleTableRefresh);
    window.addEventListener('storage', handleTableStorage);

    const stored = window.localStorage.getItem(ORDER_STATUS_STORAGE_KEY);
    if (stored) {
      try {
        const detail = JSON.parse(stored);
        handleBroadcast(detail);
      } catch {}
    }

    synchronizeTableNotifications();

    const intervalId = window.setInterval(() => {
      synchronizeTableNotifications();
    }, TABLE_POLL_INTERVAL);

    return () => {
      window.removeEventListener(ORDER_STATUS_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener(TABLE_REFRESH_EVENT, handleTableRefresh);
      window.removeEventListener('storage', handleTableStorage);
      window.clearInterval(intervalId);
    };
  }, [handleBroadcast, synchronizeTableNotifications, isLoginPage]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const sortedNotifications = useMemo(
    () => notifications.slice().sort((a, b) => b.readyAt - a.readyAt),
    [notifications]
  );
  const tablesUnreadCount = useMemo(
    () => tableNotifications.filter((item) => !item.read).length,
    [tableNotifications]
  );

  return (
    <div
      className={`h-screen ${isLoginPage ? '' : 'flex flex-col md:flex-row'} bg-gradient-to-b from-orange-50 via-white to-orange-50`}
    >
      {!isLoginPage && (
        <Sidebar
          readyCount={unreadCount}
          tableCount={tablesUnreadCount}
          onOrdersViewed={markAllAsRead}
          onTablesViewed={markAllTablesAsRead}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {!isLoginPage && (
          <Navbar
            notifications={sortedNotifications}
            unreadCount={unreadCount}
            markAllAsRead={markAllAsRead}
            removeNotification={removeNotification}
          />
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
