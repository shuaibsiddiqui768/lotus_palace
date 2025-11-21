'use client';

import { Bell, LogOut, User, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type OrderNotification = {
  id: string;
  customerName: string;
  orderType: string;
  total: number;
  createdAt: string;
};

export function Header() {
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const previousIdsRef = useRef<string[]>([]);
  const dismissedNotificationsRef = useRef(new Set<string>());
  const initializedRef = useRef(false);
  const isMountedRef = useRef(false);
  const router = useRouter();
  const DISMISSED_STORAGE_KEY = 'adminDismissedNotificationIds';
  const ORDER_UNREAD_COUNT_STORAGE_KEY = 'adminOrderUnreadCount';

  const persistDismissedNotifications = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(
      DISMISSED_STORAGE_KEY,
      JSON.stringify(Array.from(dismissedNotificationsRef.current))
    );
  }, []);

  const broadcastUnreadCount = useCallback((count: number) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(ORDER_UNREAD_COUNT_STORAGE_KEY, count.toString());
    window.dispatchEvent(
      new CustomEvent('admin-order-unread-count', { detail: count })
    );
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/orders?status=pending', {
        cache: 'no-store' as RequestCache,
      });
      if (!response.ok || !isMountedRef.current) {
        return;
      }
      const result = await response.json();
      if (!isMountedRef.current) {
        return;
      }
      if (result.success && Array.isArray(result.data)) {
        const pending = result.data.slice(0, 10);
        const mapped: OrderNotification[] = pending.map((order: any) => ({
          id: order._id,
          customerName: order.customerName ?? 'Guest',
          orderType: order.orderType ?? '',
          total: Number(order.total ?? 0),
          createdAt: order.createdAt ?? new Date().toISOString(),
        }));
        const allIdsSet = new Set(mapped.map((item) => item.id));
        dismissedNotificationsRef.current = new Set(
          Array.from(dismissedNotificationsRef.current).filter((id) =>
            allIdsSet.has(id)
          )
        );
        persistDismissedNotifications();
        const unread = mapped.filter(
          (item) => !dismissedNotificationsRef.current.has(item.id)
        );
        const unreadIds = unread.map((item) => item.id);
        if (initializedRef.current) {
          const hasNew = unreadIds.some(
            (id) => !previousIdsRef.current.includes(id)
          );
          if (hasNew) {
            setHasNewNotification(true);
          } else if (unreadIds.length === 0) {
            setHasNewNotification(false);
          }
        } else {
          initializedRef.current = true;
        }
        previousIdsRef.current = unreadIds;
        if (unreadIds.length === 0) {
          setHasNewNotification(false);
        }
        setNotifications(unread);
        broadcastUnreadCount(unread.length);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error loading notifications', error);
      }
    }
  }, [persistDismissedNotifications, broadcastUnreadCount]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        dismissedNotificationsRef.current = new Set(parsed);
      }
    } catch {
      dismissedNotificationsRef.current = new Set();
      persistDismissedNotifications();
    }
  }, [persistDismissedNotifications]);

  useEffect(() => {
    isMountedRef.current = true;
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 5000);
    return () => {
      isMountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [loadNotifications]);

  const formatOrderType = (value: string) => {
    if (!value) {
      return 'Order';
    }
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const formatTime = (value: string) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return '--:--';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const notificationBadgeValue =
    notifications.length > 9 ? '9+' : notifications.length.toString();

  const handleMarkAllAsRead = useCallback(() => {
    if (notifications.length === 0) {
      return;
    }
    notifications.forEach((notification) => {
      dismissedNotificationsRef.current.add(notification.id);
    });
    setNotifications([]);
    setHasNewNotification(false);
    previousIdsRef.current = [];
    broadcastUnreadCount(0);
    persistDismissedNotifications();
  }, [notifications, persistDismissedNotifications, broadcastUnreadCount]);

  const handleDismissNotification = useCallback(
    (id: string) => {
      dismissedNotificationsRef.current.add(id);
      setNotifications((previous) => {
        const next = previous.filter((notification) => notification.id !== id);
        previousIdsRef.current = previousIdsRef.current.filter(
          (previousId) => previousId !== id
        );
        if (next.length === 0) {
          setHasNewNotification(false);
        }
        broadcastUnreadCount(next.length);
        return next;
      });
      persistDismissedNotifications();
    },
    [persistDismissedNotifications, broadcastUnreadCount]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleOrdersOpened = () => {
      handleMarkAllAsRead();
    };
    window.addEventListener('admin-orders-opened', handleOrdersOpened);
    return () => {
      window.removeEventListener('admin-orders-opened', handleOrdersOpened);
    };
  }, [handleMarkAllAsRead]);

  return (
    <header className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Mobile: Search icon, Desktop: Search input */}
        <div className="flex items-center gap-2 md:gap-4 ml-10 md:ml-0">
          {showSearch ? (
            <div className="absolute inset-0 bg-emerald-50 z-20 flex items-center px-4 py-3">
              <input
                type="search"
                placeholder="Search..."
                autoFocus
                className="flex-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => setShowSearch(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-emerald-700"
                onClick={() => setShowSearch(true)}
              >
                <Search size={18} />
              </Button>
              <input
                type="search"
                placeholder="Search..."
                className="hidden md:block w-48 lg:w-64 px-3 py-1.5 text-sm bg-emerald-50 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <DropdownMenu
            open={notificationMenuOpen}
            onOpenChange={(open) => {
              setNotificationMenuOpen(open);
              if (open) {
                setHasNewNotification(false);
                loadNotifications();
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative h-8 w-8 ${
                  hasNewNotification ? 'text-emerald-700' : ''
                }`}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <Badge
                    className={`absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center bg-emerald-500 px-1 text-xs text-white ${
                      hasNewNotification ? 'animate-pulse' : ''
                    }`}
                  >
                    {notificationBadgeValue}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {notifications.length > 0 ? (
                  <span className="text-xs font-medium text-emerald-700">
                    {notifications.length}
                  </span>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-emerald-700">
                    No new orders
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-3 py-2 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-900">
                              Order #{notification.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-xs text-emerald-800/70">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <div className="text-xs text-emerald-800/80">
                            {notification.customerName} •{' '}
                            {formatOrderType(notification.orderType)}
                          </div>
                          <div className="text-xs text-emerald-900 font-medium">
                            ₹{notification.total.toFixed(0)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-emerald-400 hover:text-emerald-700"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleDismissNotification(notification.id);
                          }}
                          aria-label="Dismiss notification"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    handleMarkAllAsRead();
                  }}
                >
                  Mark all as read
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  router.push('/admin/orders');
                }}
              >
                View all orders
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-700 hover:bg-emerald-50"
          >
            <User size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-700 hover:bg-emerald-50"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminTokenExpiresAt');
                localStorage.removeItem('adminData');
                localStorage.removeItem('adminLoggedIn');
                window.dispatchEvent(new Event('admin-login-change'));
                router.replace('/admin/login');
              }
            }}
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
