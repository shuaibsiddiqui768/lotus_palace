import Navbar from '@/components/Navbar';
import OrdersPageClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function OrdersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <OrdersPageClient />
      </main>
    </div>
  );
}
