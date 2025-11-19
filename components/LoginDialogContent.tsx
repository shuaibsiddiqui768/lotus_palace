'use client';

import { FormEvent } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginDialogContentProps {
  variant?: 'login' | 'signup';
  onSubmit?: () => void;
  onToggleVariant?: (variant: 'login' | 'signup') => void;
}

export function LoginDialogContent({ variant = 'login', onSubmit, onToggleVariant }: LoginDialogContentProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  const isSignup = variant === 'signup';

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isSignup ? 'Create account' : 'Log in'}</DialogTitle>
        <DialogDescription>
          {isSignup
            ? 'Join FoodHub to start ordering your favorites and manage your account.'
            : 'Access your FoodHub account to manage orders and track your favorites.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" placeholder="John Doe" required />
          </div>
        )}
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" type="tel" placeholder="9876543210" required />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full">{isSignup ? 'Sign up' : 'Log in'}</Button>
      </form>
      <button
        type="button"
        onClick={() => onToggleVariant?.(isSignup ? 'login' : 'signup')}
        className="w-full text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
      >
        {isSignup ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </>
  );
}
