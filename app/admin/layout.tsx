'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import './admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let active = true;

    const clearSession = () => {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.removeItem('adminToken');
      window.localStorage.removeItem('adminTokenExpiresAt');
      window.localStorage.removeItem('adminData');
    };

    const verify = async () => {
      if (!active || typeof window === 'undefined') {
        return;
      }

      const token = window.localStorage.getItem('adminToken');

      if (!token) {
        setIsAuthenticated(false);
        setIsChecking(false);
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
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

        if (!active) {
          return;
        }

        if (response.ok) {
          const result = await response.json();
          if (result?.success) {
            setIsAuthenticated(true);
            setIsChecking(false);
            if (pathname === '/admin/login') {
              router.replace('/admin');
            }
            return;
          }
        }
      } catch {
      }

      clearSession();
      setIsAuthenticated(false);
      setIsChecking(false);
      if (pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
    };

    verify();

    const handleAuthChange = () => {
      verify();
    };

    window.addEventListener('admin-login-change', handleAuthChange);

    return () => {
      active = false;
      window.removeEventListener('admin-login-change', handleAuthChange);
    };
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
