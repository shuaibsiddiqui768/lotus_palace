import type { Metadata } from 'next';
import { Sidebar } from './components/Sidebar';
import { WaitersLayoutClient } from './components/WaitersLayoutClient';

export const metadata: Metadata = {
  title: 'Waiters Dashboard - FoodHub',
  description: 'Waiters dashboard for managing tables, orders, and menu',
};

export default function WaitersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Theme wrapper adds a subtle orange gradient background behind the client layout
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
      <WaitersLayoutClient>{children}</WaitersLayoutClient>
    </div>
  );
}
