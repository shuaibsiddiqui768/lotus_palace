'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Table2, QrCode, Settings, CreditCard, UtensilsCrossed, Menu, X, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ORDER_UNREAD_COUNT_STORAGE_KEY = 'adminOrderUnreadCount';
const TABLE_OCCUPIED_COUNT_STORAGE_KEY = 'adminTableOccupiedCount';
const TABLE_ASSIGNED_COUNT_STORAGE_KEY = 'adminTableAssignedCount';

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [orderUnreadCount, setOrderUnreadCount] = useState(0);
  const [tableOccupiedCount, setTableOccupiedCount] = useState(0);
  const [tableAssignedCount, setTableAssignedCount] = useState(0);

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'All Orders', icon: ShoppingCart },
    { href: '/admin/manage-table', label: 'Manage Table', icon: Table2 },
    { href: '/admin/manage-food', label: 'Manage Food', icon: UtensilsCrossed },
    { href: '/admin/coupon', label: 'Coupons', icon: Ticket },
    { href: '/admin/qr', label: 'QR Code for Tables', icon: QrCode },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/payment-settings', label: 'Payment Settings', icon: CreditCard },
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
    const storedTables = window.localStorage.getItem(TABLE_OCCUPIED_COUNT_STORAGE_KEY);
    if (storedTables !== null) {
      const parsed = Number.parseInt(storedTables, 10);
      setTableOccupiedCount(Number.isNaN(parsed) ? 0 : parsed);
    }
    const storedAssigned = window.localStorage.getItem(TABLE_ASSIGNED_COUNT_STORAGE_KEY);
    if (storedAssigned !== null) {
      const parsed = Number.parseInt(storedAssigned, 10);
      setTableAssignedCount(Number.isNaN(parsed) ? 0 : parsed);
    }
    const handleUnreadUpdate = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === 'number') {
        setOrderUnreadCount(detail);
      }
    };
    const handleTableOccupiedUpdate = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === 'number') {
        setTableOccupiedCount(detail);
      }
    };
    const handleTableAssignedUpdate = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === 'number') {
        setTableAssignedCount(detail);
      }
    };
    window.addEventListener('admin-order-unread-count', handleUnreadUpdate);
    window.addEventListener('admin-table-occupied-count', handleTableOccupiedUpdate);
    window.addEventListener('admin-table-assigned-count', handleTableAssignedUpdate);
    return () => {
      window.removeEventListener('admin-order-unread-count', handleUnreadUpdate);
      window.removeEventListener('admin-table-occupied-count', handleTableOccupiedUpdate);
      window.removeEventListener('admin-table-assigned-count', handleTableAssignedUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    let active = true;
    const loadTableCounts = async () => {
      try {
        const response = await fetch('/api/tables', { cache: 'no-store' });
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
        const isOnManageTablePage = window.location.pathname === '/admin/manage-table';
        const nextAssigned = isOnManageTablePage ? 0 : badgeCount;
        const nextOccupied = isOnManageTablePage ? 0 : occupied;
        setTableAssignedCount(nextAssigned);
        setTableOccupiedCount(nextOccupied);
        window.localStorage.setItem(TABLE_ASSIGNED_COUNT_STORAGE_KEY, nextAssigned.toString());
        window.localStorage.setItem(TABLE_OCCUPIED_COUNT_STORAGE_KEY, nextOccupied.toString());
        window.dispatchEvent(new CustomEvent('admin-table-assigned-count', { detail: nextAssigned }));
        window.dispatchEvent(new CustomEvent('admin-table-occupied-count', { detail: nextOccupied }));
      } catch (error) {
        console.error('Error loading table counts', error);
      }
    };
    loadTableCounts();
    const intervalId = window.setInterval(loadTableCounts, 5000);
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

  const resetTableBadge = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TABLE_OCCUPIED_COUNT_STORAGE_KEY, '0');
      window.localStorage.setItem(TABLE_ASSIGNED_COUNT_STORAGE_KEY, '0');
      window.dispatchEvent(new CustomEvent('admin-table-occupied-count', { detail: 0 }));
      window.dispatchEvent(new CustomEvent('admin-table-assigned-count', { detail: 0 }));
    }
    setTableOccupiedCount(0);
    setTableAssignedCount(0);
  }, []);

  useEffect(() => {
    if (pathname === '/admin/orders') {
      resetOrderBadge();
    }
    if (pathname === '/admin/manage-table') {
      resetTableBadge();
    }
  }, [pathname, resetOrderBadge, resetTableBadge]);

  const handleOrdersLinkClick = () => {
    resetOrderBadge();
    handleLinkClick();
  };

  const handleManageTableLinkClick = () => {
    resetTableBadge();
    handleLinkClick();
  };

  return (
    <>
      {/* Mobile menu button - visible only on small screens */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden text-orange-600 bg-white/90 border border-orange-100 shadow-sm hover:bg-orange-50"
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
          "bg-gradient-to-b from-orange-50 via-white to-white border-r border-orange-100/80 p-4 sm:p-6 z-50 shadow-sm transition-all duration-300 ease-in-out",
          "fixed md:static h-full",
          isOpen ? "left-0" : "-left-full md:left-0",
          "w-64",
          isCollapsed ? "md:w-20 md:p-4" : "md:w-64"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 text-orange-600 hover:opacity-80 transition-opacity",
              isCollapsed ? "md:justify-center md:gap-0" : ""
            )}
          >
            {/* <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
              <span className="text-white text-lg font-bold">🍕</span>
            </div> */}
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium uppercase text-orange-600">Admin</span>
                <span className="text-xl font-bold text-orange-600">FoodHub</span>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="hidden md:flex text-orange-600 hover:bg-orange-50"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden text-orange-600 hover:bg-orange-50"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const isOrdersLink = href === '/admin/orders';
            const isManageTableLink = href === '/admin/manage-table';
            const orderBadgeValue = orderUnreadCount > 9 ? '9+' : orderUnreadCount.toString();
            const tableBadgeCount = tableAssignedCount > 0 ? tableAssignedCount : tableOccupiedCount;
            const tableBadgeValue = tableBadgeCount > 9 ? '9+' : tableBadgeCount.toString();
            const showOrderBadge = isOrdersLink && orderUnreadCount > 0;
            const showTableBadge = isManageTableLink && tableBadgeCount > 0;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  if (isOrdersLink) {
                    handleOrdersLinkClick();
                  } else if (isManageTableLink) {
                    handleManageTableLinkClick();
                  } else {
                    handleLinkClick();
                  }
                }}
                className={cn(
                  'relative flex items-center rounded-xl transition-all duration-200 text-sm',
                  isCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-orange-500/15 text-orange-600 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                <div className="relative flex items-center justify-center">
                  <Icon size={18} />
                  {isCollapsed && showOrderBadge ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                      {orderBadgeValue}
                    </span>
                  ) : null}
                  {isCollapsed && showTableBadge ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-medium text-white">
                      {tableBadgeValue}
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
                    {showTableBadge ? (
                      <span className="ml-3 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-medium text-white">
                        {tableBadgeValue}
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