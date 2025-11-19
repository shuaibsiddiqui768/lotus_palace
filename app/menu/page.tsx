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
        const availableItems = transformedItems.filter((item: FoodItem) => item.is_available);
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
          setRefreshTrigger(prev => prev + 1);
        }
      };
      return () => bc.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Link href="/" className="flex items-center text-orange-600 hover:text-orange-700 mb-6 font-semibold">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Link>

        {/* <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Our Menu</h1> */}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="text-center">
              <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
              <button
                onClick={() => fetchFoodItems(searchQuery)}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <FoodMenu items={foodItems} />
        )}
      </div>

      <Footer />
    </div>
  );
}
