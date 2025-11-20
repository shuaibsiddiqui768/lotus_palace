'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ShoppingCart,
  ClipboardList,
  UtensilsCrossed,
  LogIn,
  User,
  LogOut,
  Search,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginDialogContent } from '@/components/LoginDialogContent';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { getTotalItems } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const loginOpen = pathname === '/login';
  const [variant, setVariant] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');

  const syncUser = useCallback(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem('foodhubUser');
    if (!stored) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (loginOpen) {
      const mode = searchParams.get('mode');
      setVariant(mode === 'signup' ? 'signup' : 'login');
    } else {
      setVariant('login');
    }
  }, [loginOpen, searchParams]);

  useEffect(() => {
    const currentSearch = searchParams.get('search') ?? '';
    setSearchValue(currentSearch);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    syncUser();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'foodhubUser') syncUser();
    };

    const handleAuthChange = () => {
      syncUser();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('foodhub-auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('foodhub-auth-change', handleAuthChange);
    };
  }, [syncUser]);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = searchValue.trim();

      if (trimmed) {
        router.push(`/menu?search=${encodeURIComponent(trimmed)}`);
        return;
      }

      router.push('/menu');
    },
    [router, searchValue]
  );

  const renderSearchForm = (formClassName: string, inputSize: string = 'h-11') => (
    <form onSubmit={handleSearchSubmit} className={`${formClassName} items-center`}>
      <div className="relative w-full">
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search menu..."
          className={`${inputSize} w-full rounded-full border border-emerald-200 bg-white/95 pl-3.5 pr-11 text-xs sm:text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 placeholder:text-emerald-700/50 transition-all`}
          aria-label="Search menu"
        />
        <Button
          type="submit"
          size="icon"
          className={`absolute right-1 top-1/2 -translate-y-1/2 ${
            inputSize === 'h-8' ? 'h-6 w-6' : inputSize === 'h-9' ? 'h-7 w-7' : 'h-9 w-9'
          } rounded-full bg-gradient-to-r from-emerald-600 to-lime-600 text-white shadow hover:from-emerald-700 hover:to-lime-700 transition-all`}
          aria-label="Submit search"
        >
          <Search
            className={
              inputSize === 'h-8'
                ? 'h-3 w-3'
                : inputSize === 'h-9'
                ? 'h-3.5 w-3.5'
                : 'h-4 w-4'
            }
          />
        </Button>
      </div>
    </form>
  );

  const handleOpen = (mode: 'login' | 'signup') => {
    const query = mode === 'signup' ? '?mode=signup' : '';
    router.push(`/login${query}`);
    setVariant(mode);
  };

  const handleLogout = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem('foodhubUser');

    const guestCartKey = window.localStorage.getItem('guestCartId');
    if (guestCartKey) {
      window.localStorage.removeItem(`cart_guest_${guestCartKey}`);
    }

    const storedUser = user?._id ?? user?.id ?? null;
    if (storedUser) {
      window.localStorage.removeItem(`cart_user_${storedUser}`);
    }

    window.dispatchEvent(new Event('foodhub-auth-change'));
    setUser(null);

    if (session) {
      signOut({ callbackUrl: '/' });
    } else {
      router.push('/');
    }
  }, [router, user, session]);

  const displayName = user?.name ?? user?.email ?? 'Account';

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md shadow-[0_1px_0_rgba(16,78,50,0.08)] border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Single row layout for all screen sizes */}
        <div className="flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 lg:gap-5 py-2 sm:py-2.5 md:py-3">
          {/* Logo - responsive sizing */}
          <Link href="/" className="flex-shrink-0 transition-opacity hover:opacity-90">
            <img
              src="https://res.cloudinary.com/dsb0vh0vu/image/upload/v1763559340/ChatGPT_Image_Nov_19_2025_01_41_57_PM_m8y7tw.png"
              alt="FoodHub Logo"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </Link>

          {/* Search bar - smaller height but slightly wider on mobile */}
          <div className="flex-1 max-w-[180px] xs:max-w-[210px] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl mx-1.5 sm:mx-4">
            {renderSearchForm('flex', 'h-8 sm:h-9 md:h-11')}
          </div>

          {/* Action buttons - responsive sizing */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            <Link href="/menu">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 md:h-10 md:px-4 p-0 sm:p-2 flex items-center justify-center sm:space-x-2 border-emerald-200 text-emerald-900 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                <UtensilsCrossed className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs md:text-sm">Menu</span>
              </Button>
            </Link>

            <Link href="/cart">
              <Button
                variant="outline"
                size="sm"
                className="relative h-8 w-8 sm:h-9 sm:w-auto sm:px-3 md:h-10 md:px-4 p-0 sm:p-2 flex items-center justify-center sm:space-x-2 border-emerald-200 text-emerald-900 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs md:text-sm">Cart</span>
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-emerald-600 text-white text-[10px] sm:text-xs flex items-center justify-center shadow ring-1 sm:ring-2 ring-white">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 md:h-10 md:px-4 p-0 sm:p-2 flex items-center justify-center sm:space-x-2 border-emerald-200 text-emerald-900 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline max-w-[6rem] md:max-w-[8rem] truncate text-xs md:text-sm">
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-44 sm:w-48 md:w-52 border-emerald-100 shadow-lg"
                >
                  <DropdownMenuLabel className="text-emerald-900 text-sm">
                    {displayName}
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      router.push('/orders');
                    }}
                    className="focus:bg-emerald-50 focus:text-emerald-900 text-sm"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Track orders
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleLogout();
                    }}
                    className="text-red-600 focus:bg-red-50 focus:text-red-700 text-sm"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpen('login')}
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 md:h-10 md:px-4 p-0 sm:p-2 flex items-center justify-center sm:space-x-2 border-emerald-200 text-emerald-900 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs md:text-sm">Login</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={loginOpen}
        onOpenChange={(open) => {
          if (open) {
            const query = variant === 'signup' ? '?mode=signup' : '';
            router.push(`/login${query}`);
          } else {
            router.push('/');
          }
        }}
      >
        <DialogContent className="sm:max-w-md border-emerald-100">
          <LoginDialogContent
            variant={variant}
            onSubmit={() => router.push('/')}
            onToggleVariant={(nextVariant) => {
              setVariant(nextVariant);
              const query = nextVariant === 'signup' ? '?mode=signup' : '';
              router.replace(`/login${query}`);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Subtle bottom gradient accent inspired by the lotus theme */}
      <div className="pointer-events-none h-0.5 w-full bg-gradient-to-r from-emerald-600 via-lime-600 to-emerald-600" />
    </nav>
  );
}
