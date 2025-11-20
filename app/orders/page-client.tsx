'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import TrackOrder from '@/components/TrackOrder';

export default function OrdersPageClient() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [provider, setProvider] = useState('local');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const syncAuth = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedUser = window.localStorage.getItem('foodhubUser');
    if (!storedUser) {
      setUserId('');
      setCustomerPhone('');
      setIsAuthorized(false);
      router.replace('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const idFromUser = parsedUser?._id ?? parsedUser?.id ?? '';
      const phoneFromUser = parsedUser?.phone ?? '';
      const userProvider = parsedUser?.provider ?? 'local';

      if (!idFromUser) {
        setUserId('');
        setCustomerPhone('');
        setProvider('local');
        setIsAuthorized(false);
        router.replace('/login');
        return;
      }

      setUserId(idFromUser);
      setCustomerPhone(phoneFromUser ?? '');
      setProvider(userProvider);
      setIsAuthorized(true);
    } catch {
      setUserId('');
      setCustomerPhone('');
      setProvider('local');
      setIsAuthorized(false);
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    syncAuth();

    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'foodhubUser') {
        syncAuth();
      }
    };

    const handleAuthChange = () => {
      syncAuth();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('foodhub-auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('foodhub-auth-change', handleAuthChange);
    };
  }, [syncAuth]);

  if (!isAuthorized) {
    return null;
  }

  if (!userId) {
    router.replace('/login');
    return null;
  }

  if (!customerPhone && provider !== 'google') {
    return (
      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
        <div className="bg-white/95 rounded-3xl shadow-xl border border-emerald-100 p-6 space-y-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">Track Order</h1>
          <p className="text-sm text-emerald-900/75">
            We couldn&apos;t find contact details associated with your account. Please update your profile information and try again.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white"
          >
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <TrackOrder
        userId={userId}
        initialPhone={customerPhone}
        onBack={() => router.push('/')}
      />
    </div>
  );
}
