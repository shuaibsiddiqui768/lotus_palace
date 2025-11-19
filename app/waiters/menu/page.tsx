'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface FoodItem {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  preparationTime: number;
  spicy: boolean;
  vegetarian: boolean;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/food');
        const data = await response.json();

        if (data.success) {
          setMenuItems(data.data);
        } else {
          setError(data.message || 'Failed to fetch menu items');
        }
      } catch (err) {
        setError('Failed to load menu items');
        console.error('Error fetching menu items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [refreshTrigger]);

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

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(menuItems.map((item) => item.category)))];

  // Filter items based on search and category
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableItems = filteredItems.filter((item) => item.available);
  const unavailableItems = filteredItems.filter((item) => !item.available);

  const renderItemCard = (item: FoodItem) => (
    <Card
      key={item._id}
      className={`relative transition-shadow ${
        item.available
          ? 'hover:shadow-lg border border-orange-100/70 bg-white/95 backdrop-blur-sm'
          : 'border border-dashed border-gray-300 bg-gray-50 text-gray-500'
      }`}
    >
      {item.image && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={item.image}
            alt={item.name}
            className={`w-full h-full object-cover ${item.available ? '' : 'grayscale'}`}
          />
          {!item.available && (
            <div className="absolute inset-0 bg-white/50" />
          )}
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-900">{item.name}</CardTitle>
          <div className="flex gap-2">
            <Badge
              variant={item.available ? 'default' : 'secondary'}
              className={
                item.available
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }
            >
              {item.available ? 'Available' : 'Unavailable'}
            </Badge>
            {item.spicy && <Badge variant="destructive" className="bg-red-50 text-red-700 border border-red-200">Spicy</Badge>}
            {item.vegetarian && <Badge variant="outline" className="border-emerald-300 text-emerald-700">Veg</Badge>}
          </div>
        </div>
        <p className="text-sm text-gray-500">{item.category}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            ₹{item.price.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">{item.preparationTime} min</p>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
            Menu Overview
          </h1>
          <p className="text-gray-600 mt-2">Loading menu items...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border border-orange-100/70 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
            Menu Overview
          </h1>
          <p className="text-gray-600 mt-2">Error loading menu items</p>
        </div>
        <Card className="border border-orange-100/70 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
          Menu Overview
        </h1>
        <p className="text-gray-600 mt-2">View available menu items and their details</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus:border-orange-400 focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  : 'hover:border-orange-300 hover:text-orange-700'
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {availableItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Available</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{availableItems.map(renderItemCard)}</div>
        </section>
      )}

      {unavailableItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Unavailable</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{unavailableItems.map(renderItemCard)}</div>
        </section>
      )}

      {availableItems.length === 0 && unavailableItems.length === 0 && (
        <Card className="border border-orange-100/70 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No menu items found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
