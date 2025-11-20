'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const initialVariant = useMemo(
    () => (searchParams.get('mode') === 'signup' ? 'signup' : 'login'),
    [searchParams]
  );
  const [variant, setVariant] = useState<'login' | 'signup'>(initialVariant);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email')?.toString().trim();
      const password = formData.get('password')?.toString();
      const payload: Record<string, unknown> = {
        mode: variant,
        email,
        password,
      };

      let phone: string | undefined;
      if (variant === 'signup') {
        const name = formData.get('name')?.toString().trim();
        phone = formData.get('phone')?.toString().trim();
        payload.name = name;
        payload.phone = phone;
      }

      if (variant === 'signup') {
        const search = new URLSearchParams();
        if (phone) {
          search.set('phone', phone);
        }
        if (email) {
          search.set('email', email);
        }
        const query = search.toString();
        if (query) {
          const existingResponse = await fetch(`/api/users?${query}`);
          const existingData = await existingResponse.json();
          if (existingResponse.ok && existingData.success && existingData.count > 0) {
            setError('Account already exists. Please log in.');
            setVariant('login');
            setLoading(false);
            return;
          }
        }
      }

      // Check for stored table number from QR scan
      const storedTableNumber = localStorage.getItem('selectedTableNumber');
      if (storedTableNumber) {
        const parsedTableNumber = parseInt(storedTableNumber, 10);
        if (!Number.isNaN(parsedTableNumber) && parsedTableNumber > 0) {
          payload.tableNumber = parsedTableNumber;
        } else {
          payload.tableNumber = null;
        }
      } else {
        payload.tableNumber = null;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to authenticate');
      }

      if (typeof window !== 'undefined' && data.data) {
        const userData = { ...data.data };
        if (storedTableNumber) {
          const parsedTableNumber = parseInt(storedTableNumber, 10);
          if (!Number.isNaN(parsedTableNumber) && parsedTableNumber > 0) {
            userData.tableNumber = parsedTableNumber;
          } else {
            userData.tableNumber = null;
          }
        } else {
          userData.tableNumber = null;
        }
        localStorage.setItem('foodhubUser', JSON.stringify(userData));
        window.dispatchEvent(new Event('foodhub-auth-change'));
      }

      router.push('/');
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const userData = {
        _id: (session.user as any).id,
        name: session.user?.name,
        email: session.user?.email,
        tableNumber: (session.user as any)?.tableNumber,
        provider: 'google',
      };
      localStorage.setItem('foodhubUser', JSON.stringify(userData));
      window.dispatchEvent(new Event('foodhub-auth-change'));
      router.push('/');
    }
  }, [session, status, router]);

  const heading = variant === 'signup' ? 'Create account' : 'Log in';
  const description =
    variant === 'signup'
      ? 'Join Lotus Palace to book stays, banquets, and enjoy fine dining.'
      : 'Access your Lotus Palace account to manage bookings and dining orders.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-100 flex items-center justify-center px-4 py-16">
      {/* Decorative background circles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <img
            src="https://res.cloudinary.com/dsb0vh0vu/image/upload/v1763559340/ChatGPT_Image_Nov_19_2025_01_41_57_PM_m8y7tw.png"
            alt="Lotus Palace Logo"
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>

        <div className="w-full bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-emerald-100 p-8 space-y-6">
          {/* Brand / Heading */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-600 bg-clip-text text-transparent">
              {heading}
            </h1>
            <p className="text-emerald-900/70 text-sm sm:text-base">{description}</p>
          </div>

          {/* Prominent Google CTA */}
          <Button
            type="button"
            variant="default"
            className="w-full h-11 rounded-xl bg-white text-emerald-900 border border-emerald-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all"
            onClick={() => signIn('google')}
            disabled={loading}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  d="M21.35 11.1h-9.18v2.97h5.3c-.23 1.5-1.8 4.41-5.3 4.41-3.19 0-5.8-2.64-5.8-5.88s2.61-5.88 5.8-5.88c1.81 0 3.02.77 3.72 1.43l2.53-2.44C16.86 3.93 15.03 3 12.17 3 6.98 3 2.8 7.03 2.8 12s4.18 9 9.37 9c5.41 0 8.97-3.8 8.97-9.15 0-.61-.07-1.03-.2-1.75z"
                  fill="#4285F4"
                />
              </svg>
            </div>
            <span className="font-semibold text-sm sm:text-base">
              {variant === 'signup' ? 'Continue with Google' : 'Sign in with Google'}
            </span>
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-emerald-900/50">
            <div className="flex-1 h-px bg-emerald-100" />
            <span>Email</span>
            <div className="flex-1 h-px bg-emerald-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {variant === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-emerald-900">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                  className="h-11 rounded-xl border-emerald-100 bg-white/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            )}
            {variant === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-emerald-900">
                  Phone number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="9876543210"
                  required
                  disabled={loading}
                  className="h-11 rounded-xl border-emerald-100 bg-white/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-emerald-900">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
                className="h-11 rounded-xl border-emerald-100 bg-white/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-900">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="h-11 pr-12 rounded-xl border-emerald-100 bg-white/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 hover:text-emerald-700"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Primary submit CTA */}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              disabled={loading}
            >
              {loading
                ? variant === 'signup'
                  ? 'Creating account…'
                  : 'Signing in…'
                : variant === 'signup'
                ? 'Sign up'
                : 'Log in'}
            </Button>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </form>

          {/* Footer links */}
          <div className="text-center text-sm text-emerald-900/80">
            {variant === 'signup' ? (
              <>
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setVariant('login');
                    setError(null);
                    router.replace('/login');
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  disabled={loading}
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                <span>New to Lotus Palace? </span>
                <button
                  type="button"
                  onClick={() => {
                    setVariant('signup');
                    setError(null);
                    router.replace('/login?mode=signup');
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  disabled={loading}
                >
                  Create an account
                </button>
              </>
            )}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              asChild
              disabled={loading}
              className="hover:border-emerald-300 hover:text-emerald-800"
            >
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
