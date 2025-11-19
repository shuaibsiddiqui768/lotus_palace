import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/contexts/CartContext';
import { OrdersProvider } from '@/contexts/OrdersContext';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodHub - Order Delicious Food Online',
  description: 'Order your favorite meals from the best restaurants. Fast delivery, fresh food.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <OrdersProvider>
              {children}
              <Toaster />
            </OrdersProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
