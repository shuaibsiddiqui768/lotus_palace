'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import FoodMenu from '@/components/FoodMenu';
import Footer from '@/components/Footer';
import { FoodItem, mongoFoodToFoodItem, MongoFoodItem } from '@/lib/data';

export default function MenuPage() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('search')?.trim() ?? '';

  const fetchFoodItems = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const queryString = query ? `?search=${encodeURIComponent(query)}` : '';
      const response = await fetch(`/api/food${queryString}`);
      const data = await response.json();

      if (data.success && data.data) {
        const transformedItems = data.data.map((mongoFood: MongoFoodItem) =>
          mongoFoodToFoodItem(mongoFood)
        );
        const availableItems = transformedItems.filter(
          (item: FoodItem) => item.is_available
        );
        setFoodItems(availableItems);
      } else {
        setError('Failed to load menu items. Please try again later.');
      }
    } catch (error) {
      setError('Failed to load menu items. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoodItems(searchQuery);
  }, [fetchFoodItems, searchQuery, refreshTrigger]);

  // Listen for real-time updates from admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bc = new BroadcastChannel('food-menu-updates');
      bc.onmessage = (event) => {
        if (event.data.type === 'refresh') {
          setRefreshTrigger((prev) => prev + 1);
        }
      };
      return () => bc.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="mb-6 md:mb-8 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="hidden sm:flex flex-col items-end text-right">
            {/* <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500">
              Lotus Palace
            </p>
            <p className="text-base md:text-lg font-semibold text-emerald-900">
              Explore the full menu
            </p> */}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="text-center bg-white/80 rounded-2xl shadow-md border border-red-100 px-6 py-8 max-w-md">
              <p className="text-red-600 text-lg font-semibold mb-3">{error}</p>
              <p className="text-sm text-emerald-900/70 mb-5">
                Please check your connection and try reloading the menu.
              </p>
              <button
                onClick={() => fetchFoodItems(searchQuery)}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-lime-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:from-emerald-700 hover:to-lime-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <FoodMenu items={foodItems} />
        )}
      </main>

      {/* <Footer /> */}
    </div>
  );
}
