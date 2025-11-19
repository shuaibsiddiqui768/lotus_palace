'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Table2, UtensilsCrossed, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  readyCount: number;
  tableCount: number;
  onOrdersViewed: () => void;
  onTablesViewed: () => void;
}

export function Sidebar({ readyCount, tableCount, onOrdersViewed, onTablesViewed }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/waiters/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/waiters/tables', label: 'Tables', icon: Table2 },
    { href: '/waiters/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/waiters/menu', label: 'Menu', icon: UtensilsCrossed },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (href: string) => {
    if (href === '/waiters/orders') {
      onOrdersViewed();
    }
    if (href === '/waiters/tables') {
      onTablesViewed();
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const ordersBadgeValue = readyCount > 9 ? '9+' : readyCount.toString();
  const tablesBadgeValue = tableCount > 9 ? '9+' : tableCount.toString();

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden hover:bg-orange-50 text-gray-700 hover:text-orange-600"
      >
        <Menu size={24} />
      </Button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar with orange background */}
      <aside
        className={cn(
          'bg-orange-50 border-r border-orange-200 p-4 sm:p-6 z-50 transition-all duration-300 ease-in-out shadow-lg md:shadow-none',
          'fixed md:static h-full',
          isOpen ? 'left-0' : '-left-full md:left-0',
          'w-64 md:w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Waiters Hub
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden hover:bg-orange-100 text-gray-700 hover:text-orange-600"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => handleLinkClick(href)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm group',
                pathname === href
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-md'
                  : 'text-gray-700 hover:bg-orange-100 hover:text-orange-600'
              )}
            >
              <Icon size={18} className={cn(
                pathname === href ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'
              )} />
              <span className="flex-1">{label}</span>
              {href === '/waiters/tables' && tableCount > 0 ? (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-semibold text-white shadow-sm">
                  {tablesBadgeValue}
                </span>
              ) : null}
              {href === '/waiters/orders' && readyCount > 0 ? (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white shadow-sm">
                  {ordersBadgeValue}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
