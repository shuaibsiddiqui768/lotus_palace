'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Table2,
  QrCode,
  Settings,
  CreditCard,
  UtensilsCrossed,
  Menu,
  X,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ORDER_UNREAD_COUNT_STORAGE_KEY = 'adminOrderUnreadCount';
const ROOM_OCCUPIED_COUNT_STORAGE_KEY = 'adminRoomOccupiedCount';
const ROOM_ASSIGNED_COUNT_STORAGE_KEY = 'adminRoomAssignedCount';

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [orderUnreadCount, setOrderUnreadCount] = useState(0);
  const [roomOccupiedCount, setRoomOccupiedCount] = useState(0);
  const [roomAssignedCount, setRoomAssignedCount] = useState(0);

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'All Orders', icon: ShoppingCart },
    { href: '/admin/manage-room', label: 'Manage Room', icon: Table2 },
    { href: '/admin/manage-food', label: 'Manage Food', icon: UtensilsCrossed },
    { href: '/admin/coupon', label: 'Coupons', icon: Ticket },
    { href: '/admin/qr', label: 'QR Code for Rooms', icon: QrCode },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    // { href: '/admin/payment-settings', label: 'Payment Settings', icon: CreditCard },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedOrders = window.localStorage.getItem(ORDER_UNREAD_COUNT_STORAGE_KEY);
    if (storedOrders !== null) {
      const parsed = Number.parseInt(storedOrders, 10);
      setOrderUnreadCount(Number.isNaN(parsed) ? 0 : parsed);
    }
    const storedRooms = window.localStorage.getItem(ROOM_OCCUPIED_COUNT_STORAGE_KEY);
    if (storedRooms !== null) {
      const parsed = Number.parseInt(storedRooms, 10);
      setRoomOccupiedCount(Number.isNaN(parsed) ? 0 : parsed);
    }
    const storedAssigned = window.localStorage.getItem(ROOM_ASSIGNED_COUNT_STORAGE_KEY);
    if (storedAssigned !== null) {
      const parsed = Number.parseInt(storedAssigned, 10);
      setRoomAssignedCount(Number.isNaN(parsed) ? 0 : parsed);
    }
    const handleUnreadUpdate = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === 'number') {
        setOrderUnreadCount(detail);
      }
    };
    const handleRoomOccupiedUpdate = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === 'number') {
        setRoomOccupiedCount(detail);
      }
    };
    const handleRoomAssignedUpdate = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === 'number') {
        setRoomAssignedCount(detail);
      }
    };
    window.addEventListener('admin-order-unread-count', handleUnreadUpdate);
    window.addEventListener('admin-room-occupied-count', handleRoomOccupiedUpdate);
    window.addEventListener('admin-room-assigned-count', handleRoomAssignedUpdate);
    return () => {
      window.removeEventListener('admin-order-unread-count', handleUnreadUpdate);
      window.removeEventListener('admin-room-occupied-count', handleRoomOccupiedUpdate);
      window.removeEventListener('admin-room-assigned-count', handleRoomAssignedUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    let active = true;
    const loadRoomCounts = async () => {
      try {
        const response = await fetch('/api/rooms', { cache: 'no-store' });
        if (!response.ok || !active) {
          return;
        }
        const result = await response.json();
        if (!active || !result.success || !Array.isArray(result.data)) {
          return;
        }
        const items = result.data as Array<{ status?: string; assignedUser?: unknown }>;
        const occupied = items.filter((item) => item?.status === 'occupied').length;
        const assigned = items.filter((item) => item?.assignedUser).length;
        const badgeCount = Math.max(occupied, assigned);
        const isOnManageRoomPage = window.location.pathname === '/admin/manage-room';
        const nextAssigned = isOnManageRoomPage ? 0 : badgeCount;
        const nextOccupied = isOnManageRoomPage ? 0 : occupied;
        setRoomAssignedCount(nextAssigned);
        setRoomOccupiedCount(nextOccupied);
        window.localStorage.setItem(
          ROOM_ASSIGNED_COUNT_STORAGE_KEY,
          nextAssigned.toString()
        );
        window.localStorage.setItem(
          ROOM_OCCUPIED_COUNT_STORAGE_KEY,
          nextOccupied.toString()
        );
        window.dispatchEvent(
          new CustomEvent('admin-room-assigned-count', { detail: nextAssigned })
        );
        window.dispatchEvent(
          new CustomEvent('admin-room-occupied-count', { detail: nextOccupied })
        );
      } catch (error) {
        console.error('Error loading room counts', error);
      }
    };
    loadRoomCounts();
    const intervalId = window.setInterval(loadRoomCounts, 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Close sidebar when a link is clicked on mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const resetOrderBadge = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ORDER_UNREAD_COUNT_STORAGE_KEY, '0');
      window.dispatchEvent(new CustomEvent('admin-order-unread-count', { detail: 0 }));
      window.dispatchEvent(new Event('admin-orders-opened'));
    }
    setOrderUnreadCount(0);
  }, []);

  const resetRoomBadge = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROOM_OCCUPIED_COUNT_STORAGE_KEY, '0');
      window.localStorage.setItem(ROOM_ASSIGNED_COUNT_STORAGE_KEY, '0');
      window.dispatchEvent(
        new CustomEvent('admin-room-occupied-count', { detail: 0 })
      );
      window.dispatchEvent(
        new CustomEvent('admin-room-assigned-count', { detail: 0 })
      );
    }
    setRoomOccupiedCount(0);
    setRoomAssignedCount(0);
  }, []);

  useEffect(() => {
    if (pathname === '/admin/orders') {
      resetOrderBadge();
    }
    if (pathname === '/admin/manage-room') {
      resetRoomBadge();
    }
  }, [pathname, resetOrderBadge, resetRoomBadge]);

  const handleOrdersLinkClick = () => {
    resetOrderBadge();
    handleLinkClick();
  };

  const handleManageRoomLinkClick = () => {
    resetRoomBadge();
    handleLinkClick();
  };

  return (
    <>
      {/* Mobile menu button - visible only on small screens */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden text-emerald-700 bg-white/90 border border-emerald-100 shadow-sm hover:bg-emerald-50"
      >
        <Menu size={24} />
      </Button>

      {/* Overlay for mobile - only visible when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-gradient-to-b from-emerald-50 via-white to-emerald-50 border-r border-emerald-100/80 p-4 sm:p-6 z-50 shadow-sm transition-all duration-300 ease-in-out',
          'fixed md:static h-full',
          isOpen ? 'left-0' : '-left-full md:left-0',
          'w-64',
          isCollapsed ? 'md:w-20 md:p-4' : 'md:w-64'
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 text-emerald-700 hover:opacity-80 transition-opacity',
              isCollapsed ? 'md:justify-center md:gap-0' : ''
            )}
          >
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium uppercase text-emerald-600">
                  Admin
                </span>
                <span className="text-xl font-bold text-emerald-700">Lotus Palace</span>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="hidden md:flex text-emerald-700 hover:bg-emerald-50"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden text-emerald-700 hover:bg-emerald-50"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const isOrdersLink = href === '/admin/orders';
            const isManageRoomLink = href === '/admin/manage-room';
            const orderBadgeValue =
              orderUnreadCount > 9 ? '9+' : orderUnreadCount.toString();
            const roomBadgeCount =
              roomAssignedCount > 0 ? roomAssignedCount : roomOccupiedCount;
            const roomBadgeValue =
              roomBadgeCount > 9 ? '9+' : roomBadgeCount.toString();
            const showOrderBadge = isOrdersLink && orderUnreadCount > 0;
            const showRoomBadge = isManageRoomLink && roomBadgeCount > 0;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  if (isOrdersLink) {
                    handleOrdersLinkClick();
                  } else if (isManageRoomLink) {
                    handleManageRoomLinkClick();
                  } else {
                    handleLinkClick();
                  }
                }}
                className={cn(
                  'relative flex items-center rounded-xl transition-all duration-200 text-sm',
                  isCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                )}
              >
                <div className="relative flex items-center justify-center">
                  <Icon size={18} />
                  {isCollapsed && showOrderBadge ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                      {orderBadgeValue}
                    </span>
                  ) : null}
                  {isCollapsed && showRoomBadge ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-medium text-white">
                      {roomBadgeValue}
                    </span>
                  ) : null}
                </div>
                {!isCollapsed && (
                  <span className="flex w-full items-center justify-between">
                    <span>{label}</span>
                    {showOrderBadge ? (
                      <span className="ml-3 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-medium text-white">
                        {orderBadgeValue}
                      </span>
                    ) : null}
                    {showRoomBadge ? (
                      <span className="ml-3 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-medium text-white">
                        {roomBadgeValue}
                      </span>
                    ) : null}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
