import Navbar from '@/components/Navbar';
import OrdersPageClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function OrdersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <OrdersPageClient />
    </div>
  );
}
