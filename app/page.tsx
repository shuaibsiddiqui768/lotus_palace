'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Banner from '@/components/Banner';
import CategoryFilter from '@/components/CategoryFilter';
import FoodMenu from '@/components/FoodMenu';
import Footer from '@/components/Footer';
import { Category, FoodItem, categories as staticCategories, mongoFoodToFoodItem, MongoFoodItem } from '@/lib/data';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    setCategories(staticCategories);
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      setError(null);
      const response = await fetch('/api/food');
      const data = await response.json();

      if (data.success && data.data) {
        const transformedItems = data.data.map((mongoFood: MongoFoodItem) =>
          mongoFoodToFoodItem(mongoFood)
        );
        const availableItems = transformedItems.filter((item: FoodItem) => item.is_available);
        setFoodItems(availableItems);
        setFilteredItems(availableItems);
      } else {
        setError('Failed to load menu items. Please try again later.');
      }
    } catch (error) {
      setError('Failed to load menu items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterItems();
  }, [selectedCategory, searchQuery, foodItems]);

  const filterItems = () => {
    let filtered = [...foodItems];

    if (selectedCategory !== 'all') {
      const category = categories.find((cat) => cat.slug === selectedCategory);
      if (category) {
        filtered = filtered.filter((item) => item.category_id === category.id);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
  };

  const handleViewMenu = () => {
    const menuSection = document.querySelector('[data-section="menu"]');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <Banner onOrderClick={() => setShowOrderForm(true)} onViewMenuClick={handleViewMenu} />
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 px-4">
          <div className="text-center">
            <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
            <button
              onClick={fetchFoodItems}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div data-section="menu">
          <FoodMenu items={filteredItems} />
        </div>
      )}
      <Footer />
    </div>
  );
}
