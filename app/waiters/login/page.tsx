'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function WaitersLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('waiter@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/waiters/auth', {
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      if (typeof window !== 'undefined' && data.data) {
        localStorage.setItem('foodhubWaiter', JSON.stringify(data.data));
        window.dispatchEvent(new Event('waiter-login-change'));
      }

      router.push('/waiters/dashboard');
    } catch (error: any) {
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="w-full max-w-md">

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
            FoodHub Staff
          </h1>
          <p className="mt-1 text-sm text-gray-600">Waiters Login</p>
        </div>

        <div className="rounded-2xl border-none bg-white/80 backdrop-blur-md shadow-xl">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-800">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  disabled={loading}
                  className="h-11 rounded-lg border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300 transition-shadow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-800">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    disabled={loading}
                    className="h-11 pr-10 rounded-lg border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-600"
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Log In'}
              </Button>

              {error && (
                <p className="text-sm text-red-600 text-center bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                Dummy credentials: <span className="font-medium text-gray-700">waiter@example.com</span> / <span className="font-medium text-gray-700">password123</span>
              </p>
            </div>
          </div>

          <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 rounded-b-2xl" />
        </div>

      </div>
    </div>
  );
}
