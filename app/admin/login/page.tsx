'use client';

import { useState, useEffect } from 'react';
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
      if (typeof window === 'undefined') return;

      const token = window.localStorage.getItem('adminToken');
      if (!token) {
        if (active) setIsCheckingSession(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'verify', token }),
        });

        if (!active) return;

        if (response.ok) {
          const result: LoginResult = await response.json();
          if (result?.success) {
            router.replace('/admin/dashboard');
            return;
          }
        }
      } catch {}

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('adminToken');
        window.localStorage.removeItem('adminTokenExpiresAt');
        window.localStorage.removeItem('adminData');
      }

      if (active) setIsCheckingSession(false);
    };

    verifySession();
    return () => { active = false; };
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', email, password }),
      });

      const result: LoginResult = await response.json();

      if (!response.ok || !result?.success || !result?.data?.token || !result?.data?.admin)
        throw new Error(result?.message || 'Login failed');

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('adminToken', result.data.token);
        if (result.data.expiresAt) {
          window.localStorage.setItem('adminTokenExpiresAt', result.data.expiresAt.toString());
        }
        window.localStorage.setItem('adminData', JSON.stringify(result.data.admin));
        window.dispatchEvent(new Event('admin-login-change'));
      }

      const redirectTo = searchParams?.get('redirect') || '/admin/dashboard';
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e4f2e9] via-white to-[#d1fae5]">
        <div className="flex items-center gap-2 text-emerald-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-16 min-h-screen bg-gradient-to-br from-[#e4f2e9] via-white to-[#d1fae5]">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg border border-emerald-100 shadow-2xl rounded-3xl p-10 space-y-6 relative overflow-hidden">

        {/* Decorative Lotus Theme Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 via-transparent to-lime-100/40 pointer-events-none" />

        {/* Heading */}
        <div className="space-y-2 text-center relative">
          <h1 className="text-4xl font-extrabold text-emerald-800 tracking-tight drop-shadow-sm">
            Admin Login
          </h1>
          <p className="text-emerald-700 font-medium">Secure access to admin dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative">

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-emerald-900 font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="bg-white/70 border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Password Input + Eye Button FIXED */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-emerald-900 font-semibold">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-white/70 border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 pr-12"
              />

              {/* Eye Button - Correctly aligned */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-700 transition"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-700 hover:to-lime-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in…
              </div>
            ) : (
              'Log In'
            )}
          </Button>

          {error && (
            <p className="text-center text-sm text-red-600 mt-2">
              {error}
            </p>
          )}
        </form>

        {/* Demo Credentials */}
        <p className="text-center text-sm text-emerald-700 font-medium">
          Demo: <span className="underline">admin@foodmenu.com</span> / admin123
        </p>
      </div>
    </div>
  );
}
