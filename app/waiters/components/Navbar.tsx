'use client';

import { Bell, User, LogOut, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WaiterNotificationItem } from './WaitersLayoutClient';

interface NavbarProps {
  notifications: WaiterNotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  removeNotification: (orderId: string) => void;
}

export function Navbar({ notifications, unreadCount, markAllAsRead, removeNotification }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('foodhubWaiter');
      window.dispatchEvent(new Event('waiter-login-change'));
    }
    router.push('/waiters/login');
  };

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const formatOrderLabel = (notification: WaiterNotificationItem) => {
    if (notification.tableNumber) {
      return `Table ${notification.tableNumber}`;
    }
    if (notification.orderType) {
      return notification.orderType
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return 'Order ready';
  };

  const formatItemSummary = (items?: { name?: string; quantity?: number }[]) => {
    if (!items || items.length === 0) {
      return undefined;
    }
    const first = items[0];
    const additionalCount = Math.max(items.length - 1, 0);
    const quantity = typeof first?.quantity === 'number' ? first.quantity : Number(first?.quantity ?? 0);
    const name = first?.name || 'Item';
    if (additionalCount === 0) {
      return `${quantity}× ${name}`;
    }
    return `${quantity}× ${name} +${additionalCount} more`;
  };

  const formatReadyTime = (readyAt: number) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(readyAt));
    } catch {
      return '';
    }
  };

  return (
    <nav className="bg-orange-50 backdrop-blur-md border-b border-orange-200 p-3 sm:p-4 flex justify-end items-center gap-2 sm:gap-3 md:gap-4 z-30 sticky top-0">
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-10 w-10 rounded-full hover:bg-orange-100 text-gray-700 hover:text-orange-600 transition-colors ${
              unreadCount > 0 ? 'text-orange-600' : ''
            }`}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 rounded-xl border border-orange-100/70 bg-white/95 backdrop-blur-md shadow-xl overflow-hidden"
        >
          <DropdownMenuLabel className="flex items-center justify-between text-gray-900">
            <span className="font-semibold">Ready orders</span>
            {notifications.length > 0 ? (
              <span className="text-xs font-medium text-gray-500">{notifications.length}</span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-orange-100/70" />
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-sm text-gray-500">No ready orders</div>
            ) : (
              notifications.map((notification) => {
                const summary = formatItemSummary(notification.items);
                return (
                  <div
                    key={notification.orderId}
                    className="px-3 py-2 rounded-md hover:bg-orange-50/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            Order #{notification.orderId.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">{formatReadyTime(notification.readyAt)}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatOrderLabel(notification)}
                          {notification.customerName ? ` • ${notification.customerName}` : ''}
                        </div>
                        {summary ? <div className="text-xs text-gray-500">{summary}</div> : null}
                        {typeof notification.total === 'number' ? (
                          <div className="text-xs font-semibold text-gray-900">₹{notification.total.toFixed(2)}</div>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          removeNotification(notification.orderId);
                        }}
                        aria-label="Dismiss notification"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DropdownMenuSeparator className="bg-orange-100/70" />
          <DropdownMenuItem
            className="cursor-pointer text-gray-700 hover:text-orange-700 focus:text-orange-700 focus:bg-orange-50"
            onSelect={(event) => {
              event.preventDefault();
              router.push('/waiters/orders');
            }}
          >
            Go to orders
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full hover:bg-orange-100 text-gray-700 hover:text-orange-600 transition-colors"
        aria-label="Profile"
      >
        <User size={20} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors"
        onClick={handleLogout}
        aria-label="Log out"
      >
        <LogOut size={20} />
      </Button>
    </nav>
  );
}
