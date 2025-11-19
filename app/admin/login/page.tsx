'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type LoginResult = {
  success: boolean;
  message?: string;
  data?: {
    admin?: unknown;
    token?: string;
    expiresAt?: number;
  };
};

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('admin@foodmenu.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      const token = window.localStorage.getItem('adminToken');
      if (!token) {
        if (active) {
          setIsCheckingSession(false);
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
          const result: LoginResult = await response.json();
          if (result?.success) {
            router.replace('/admin');
            return;
          }
        }
      } catch {
      }

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('adminToken');
        window.localStorage.removeItem('adminTokenExpiresAt');
        window.localStorage.removeItem('adminData');
      }

      if (active) {
        setIsCheckingSession(false);
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'login',
          email,
          password,
        }),
      });

      const result: LoginResult = await response.json();

      if (!response.ok || !result?.success || !result?.data?.token || !result?.data?.admin) {
        throw new Error(result?.message || 'Login failed');
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('adminToken', result.data.token);
        if (result.data.expiresAt) {
          window.localStorage.setItem('adminTokenExpiresAt', result.data.expiresAt.toString());
        } else {
          window.localStorage.removeItem('adminTokenExpiresAt');
        }
        window.localStorage.setItem('adminData', JSON.stringify(result.data.admin));
        window.dispatchEvent(new Event('admin-login-change'));
      }

      const redirectTo = searchParams?.get('redirect') || '/admin';
      router.replace(redirectTo);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white shadow-xl rounded-3xl border border-gray-100 p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600">Access the admin panel</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@foodmenu.com"
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in…</span>
              </div>
            ) : (
              'Log in'
            )}
          </Button>
          {error ? <p className="text-sm text-red-600 text-center">{error}</p> : null}
        </form>
        <div className="text-center text-sm text-gray-500">
          Demo credentials: admin@foodmenu.com / admin123
        </div>
      </div>
    </div>
  );
}
