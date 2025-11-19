'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, ArrowRight } from 'lucide-react';

export default function OrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateUserTableNumber = async (tableNum: number) => {
      try {
        // Check if user is logged in
        const storedUser = localStorage.getItem('foodhubUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          // Update user's table number using PATCH endpoint
          const response = await fetch('/api/users', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              phone: user.phone,
              tableNumber: tableNum,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Update localStorage with new user data
              localStorage.setItem('foodhubUser', JSON.stringify(data.data));
              window.dispatchEvent(new Event('foodhub-auth-change'));
            }
          }
        }
      } catch (error) {
        console.error('Failed to update user table number:', error);
      }
    };

    const tableParam = searchParams.get('table');

    if (tableParam) {
      const tableNum = parseInt(tableParam);
      if (!isNaN(tableNum) && tableNum > 0) {
        setTableNumber(tableNum);
        // Store table number in localStorage for later use
        localStorage.setItem('selectedTableNumber', tableNum.toString());
        // Update user's table number if logged in
        updateUserTableNumber(tableNum);
        setLoading(false);
      } else {
        // Invalid table number
        setLoading(false);
      }
    } else {
      // No table parameter, check if we have one stored
      const storedTable = localStorage.getItem('selectedTableNumber');
      if (storedTable) {
        setTableNumber(parseInt(storedTable));
      }
      setLoading(false);
    }
  }, [searchParams]);

  const handleContinueToMenu = () => {
    router.push('/menu');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <QrCode size={48} className="text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Table {tableNumber}</CardTitle>
          <CardDescription>
            {tableNumber
              ? `You've been assigned to Table ${tableNumber}. Ready to start ordering?`
              : 'No table selected. Please scan a QR code from your table.'
            }
          </CardDescription>
          <div className="mt-4 text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tableNumber ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800">
                  <strong>Table {tableNumber}</strong> has been assigned to your session.
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={handleContinueToMenu} className="w-full gap-2">
                  <ArrowRight size={16} />
                  Continue to Menu
                </Button>

                <Button onClick={handleLogin} variant="outline" className="w-full">
                  Login to Your Account
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Please scan a QR code from your table to continue.
                </p>
              </div>

              <Button onClick={() => router.push('/')} variant="outline">
                Go Back Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}