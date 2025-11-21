'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('adminToken') : null;
      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mode: 'verify', token }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success) {
            router.replace('/admin/dashboard');
            return;
          }
        }
      } catch {
      }

      router.replace('/admin/login');
    };

    verifySession();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Redirecting...</span>
      </div>
    </div>
  );
}
