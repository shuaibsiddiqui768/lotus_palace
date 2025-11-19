'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ShoppingCart, ClipboardList, UtensilsCrossed, LogIn, User, LogOut, Search } from 'lucide-react';
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
    if (typeof window === 'undefined') {
      return;
    }
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
      if (mode === 'signup') {
        setVariant('signup');
      } else {
        setVariant('login');
      }
    } else {
      setVariant('login');
    }
  }, [loginOpen, searchParams]);

  useEffect(() => {
    const currentSearch = searchParams.get('search') ?? '';
    setSearchValue(currentSearch);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    syncUser();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'foodhubUser') {
        syncUser();
      }
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

  const renderSearchForm = (formClassName: string) => (
    <form onSubmit={handleSearchSubmit} className={`${formClassName} items-center`}>
      <div className="relative w-full max-w-sm sm:max-w-md">
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search menu..."
          className="h-10 w-full rounded-full border border-input bg-white pl-4 pr-12 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label="Search menu"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
          aria-label="Submit search"
        >
          <Search className="h-4 w-4" />
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
    if (typeof window === 'undefined') {
      return;
    }
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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:gap-4 py-2 sm:py-3">
          <div className="flex w-full items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              {/* <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg"> */}
                {/* <span className="text-white font-bold text-lg sm:text-xl"></span> */}
              {/* </div> */}
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                FoodHub
              </span>
            </Link>

            {renderSearchForm('hidden sm:flex flex-1 justify-center')}

            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <Link href="/menu">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span className="hidden sm:inline">Menu</span>
                </Button>
              </Link>

              <Link href="/cart">
                <Button variant="outline" size="sm" className="relative flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Cart</span>
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline max-w-[8rem] truncate text-left">{displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="max-w-full truncate">{displayName}</DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        router.push('/orders');
                      }}
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
                  className="flex items-center space-x-2"
                  onClick={() => handleOpen('login')}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              )}
            </div>
          </div>

          <div className="sm:hidden">
            {renderSearchForm('flex w-full')}
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
        <DialogContent className="sm:max-w-md">
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
    </nav>
  );
}
