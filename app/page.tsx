'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Banner from '@/components/Banner';
import CategoryFilter from '@/components/CategoryFilter';
import FoodMenu from '@/components/FoodMenu';
import Footer from '@/components/Footer';
import { Category, FoodItem, categories as staticCategories, mongoFoodToFoodItem, MongoFoodItem, mongoCategoriesToFrontendCategories, setCategoryMap, MongoCategoryItem } from '@/lib/data';

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
    fetchCategories();
    fetchFoodItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();

      if (data.success && data.data) {
        const mongoCategories: MongoCategoryItem[] = data.data;
        const frontendCategories = mongoCategoriesToFrontendCategories(mongoCategories);
        setCategoryMap(mongoCategories);
        setCategories(frontendCategories);
      } else {
        setCategories(staticCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(staticCategories);
    }
  };

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
  }, [selectedCategory, searchQuery, foodItems, categories]);

  const filterItems = () => {
    let filtered = [...foodItems];

    if (selectedCategory !== 'all') {
      const category = categories.find((cat) => cat.slug === selectedCategory);
      if (category) {
        // Filter by category name directly
        filtered = filtered.filter((item) =>
          item.category?.toLowerCase() === category.name.toLowerCase()
        );
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
    console.log('Category selected:', slug);
    setSelectedCategory(slug);
  };

  const handleViewMenu = () => {
    const menuSection = document.querySelector('[data-section="menu"]');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      <Navbar />
      <Banner onOrderClick={() => setShowOrderForm(true)} onViewMenuClick={handleViewMenu} />
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 px-4">
          <div className="text-center">
            <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
            <button
              onClick={fetchFoodItems}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div data-section="menu" className="max-w-7xl mx-auto p-4">
          <FoodMenu items={filteredItems} />
        </div>
      )}
      <Footer />
    </div>
  );
}
