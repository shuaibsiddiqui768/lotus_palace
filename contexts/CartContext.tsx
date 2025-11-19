'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CartItem, FoodItem } from '@/lib/data';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const USER_STORAGE_PREFIX = 'cart_user_';
const GUEST_STORAGE_PREFIX = 'cart_guest_';
const GUEST_CART_ID_KEY = 'guestCartId';
const USER_STORAGE_KEY = 'foodhubUser';

function createGuestCartId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function ensureGuestCartId() {
  if (typeof window === 'undefined') return '';
  let guestId = window.localStorage.getItem(GUEST_CART_ID_KEY);
  if (!guestId) {
    guestId = createGuestCartId();
    window.localStorage.setItem(GUEST_CART_ID_KEY, guestId);
  }
  return guestId;
}

function getStorageKey(id: string, isUserCart: boolean) {
  return `${isUserCart ? USER_STORAGE_PREFIX : GUEST_STORAGE_PREFIX}${id}`;
}

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(typeof window === 'undefined' ? false : true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserRef = useRef<any>(null);

  const syncUser = useCallback(() => {
    if (typeof window === 'undefined') return;
    const storedUser = getStoredUser();
    currentUserRef.current = storedUser;
    if (!storedUser) {
      setUserId(null);
      return;
    }
    const id = storedUser._id ?? storedUser.id ?? null;
    setUserId(id);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    syncUser();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
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

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const syncCartToBackend = useCallback((cartData: CartItem[], id: string, isUserCart: boolean, activeUserId?: string | null) => {
    if (!id) return;
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (!isUserCart || !activeUserId) {
        return;
      }

      try {
        const response = await fetch('/api/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: activeUserId,
            items: cartData,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && typeof window !== 'undefined') {
            window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.data));
          }
        }
      } catch (error) {
        console.error('Failed to sync cart to backend:', error);
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isActive = true;

    const loadCart = async () => {
      setIsLoading(true);

      const isUserCart = Boolean(userId);
      const nextCartId = isUserCart ? userId! : ensureGuestCartId();
      setCartId(nextCartId);
      const storageKey = getStorageKey(nextCartId, isUserCart);

      try {
        if (isUserCart) {
          const response = await fetch(`/api/users?id=${encodeURIComponent(nextCartId)}`);
          const result = await response.json();

          if (!isActive) return;

          if (response.ok && result.success) {
            const userData = Array.isArray(result.data) ? result.data[0] : result.data;
            const itemsFromServer = Array.isArray(userData?.cart?.items) ? userData.cart.items : [];
            setCart(itemsFromServer);
            window.localStorage.setItem(storageKey, JSON.stringify(itemsFromServer));
            if (userData) {
              window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
            }
          } else {
            const fallback = window.localStorage.getItem(storageKey);
            if (fallback) {
              setCart(JSON.parse(fallback));
            } else {
              setCart([]);
            }
          }
        } else {
          const fallback = window.localStorage.getItem(storageKey);
          if (fallback) {
            setCart(JSON.parse(fallback));
          } else {
            setCart([]);
          }
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
        const fallback = window.localStorage.getItem(storageKey);
        if (fallback) {
          setCart(JSON.parse(fallback));
        } else {
          setCart([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!cartId || isLoading) return;

    const isUserCart = Boolean(userId);
    const storageKey = getStorageKey(cartId, isUserCart);
    window.localStorage.setItem(storageKey, JSON.stringify(cart));
    if (!isUserCart) {
      window.localStorage.setItem(GUEST_CART_ID_KEY, cartId);
    }
    syncCartToBackend(cart, cartId, isUserCart, userId);
  }, [cart, cartId, isLoading, userId, syncCartToBackend]);

  const addToCart = useCallback((item: FoodItem) => {
    const itemToAdd = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      category_id: item.category_id,
      is_available: item.is_available,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...itemToAdd, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== itemId);
      // Ensure localStorage is updated immediately
      if (typeof window !== 'undefined' && cartId && !isLoading) {
        const isUserCart = Boolean(userId);
        const storageKey = getStorageKey(cartId, isUserCart);
        window.localStorage.setItem(storageKey, JSON.stringify(newCart));
        if (!isUserCart) {
          window.localStorage.setItem(GUEST_CART_ID_KEY, cartId);
        }
        syncCartToBackend(newCart, cartId, isUserCart, userId);
      }
      return newCart;
    });
  }, [cartId, isLoading, userId, syncCartToBackend]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prevCart) => {
        const newCart = prevCart.filter((item) => item.id !== itemId);
        // Ensure localStorage is updated immediately
        if (typeof window !== 'undefined' && cartId && !isLoading) {
          const isUserCart = Boolean(userId);
          const storageKey = getStorageKey(cartId, isUserCart);
          window.localStorage.setItem(storageKey, JSON.stringify(newCart));
          if (!isUserCart) {
            window.localStorage.setItem(GUEST_CART_ID_KEY, cartId);
          }
          syncCartToBackend(newCart, cartId, isUserCart, userId);
        }
        return newCart;
      });
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              image_url: item.image_url,
              category_id: item.category_id,
              is_available: item.is_available,
              created_at: item.created_at,
              updated_at: item.updated_at,
            }
          : item
      )
    );
  }, [cartId, isLoading, userId, syncCartToBackend]);

  const clearCart = useCallback(() => {
    setCart((prevCart) => {
      const newCart: CartItem[] = [];
      // Ensure localStorage is updated immediately
      if (typeof window !== 'undefined' && cartId && !isLoading) {
        const isUserCart = Boolean(userId);
        const storageKey = getStorageKey(cartId, isUserCart);
        window.localStorage.setItem(storageKey, JSON.stringify(newCart));
        if (!isUserCart) {
          window.localStorage.setItem(GUEST_CART_ID_KEY, cartId);
        }
        syncCartToBackend(newCart, cartId, isUserCart, userId);
      }
      return newCart;
    });
  }, [cartId, isLoading, userId, syncCartToBackend]);

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const contextValue = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isLoading,
    }),
    [cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice, isLoading]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
