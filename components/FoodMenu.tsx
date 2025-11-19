'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FoodItem } from '@/lib/data';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Star, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface FoodMenuProps {
  items: FoodItem[];
}

const ITEMS_PER_PAGE = 12;

export default function FoodMenu({ items }: FoodMenuProps) {
  const { addToCart, cart, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(Math.min(items.length, ITEMS_PER_PAGE));
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    setVisibleCount(Math.min(items.length, ITEMS_PER_PAGE));
  }, [items, updateTrigger]);

  // Listen for real-time updates from admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bc = new BroadcastChannel('food-menu-updates');
      bc.onmessage = (event) => {
        if (event.data.type === 'refresh') {
          setUpdateTrigger(prev => prev + 1);
        }
      };
      return () => bc.close();
    }
  }, []);

  const handleViewMore = () => {
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, items.length));
  };

  const ensureAuthenticated = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const stored = window.localStorage.getItem('foodhubUser');
    if (!stored) {
      toast({
        title: 'Login required',
        description: 'Please log in to add items to your cart.',
        duration: 2000,
      });
      router.push('/login');
      return false;
    }
    return true;
  }, [router, toast]);

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (item: FoodItem) => {
    if (!ensureAuthenticated()) {
      return;
    }
    addToCart(item);
    toast({
      title: 'Added to cart',
      description: `${item.name} has been added to your cart`,
      duration: 2000,
    });
  };

  const handleIncreaseQuantity = (item: FoodItem) => {
    const currentQuantity = getItemQuantity(item.id);
    if (currentQuantity === 0) {
      handleAddToCart(item);
      return;
    }
    updateQuantity(item.id, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (item: FoodItem) => {
    const currentQuantity = getItemQuantity(item.id);
    if (currentQuantity <= 0) {
      return;
    }
    if (currentQuantity === 1) {
      removeFromCart(item.id);
      toast({
        title: 'Removed from cart',
        description: `${item.name} has been removed`,
        duration: 2000,
      });
      return;
    }
    updateQuantity(item.id, currentQuantity - 1);
  };

  const visibleItems = items.slice(0, visibleCount);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20">
        <div className="text-gray-400 text-center">
          <div className="text-5xl sm:text-6xl mb-4">🍽️</div>
          <p className="text-lg sm:text-xl font-semibold mb-2">No items found</p>
          <p className="text-sm sm:text-base">Try searching for something else</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 gap-3">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
          Our Menu
        </h2>
        <Badge variant="secondary" className="text-sm sm:text-base px-3 py-1">
          {items.length} items
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {visibleItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => setSelectedItem(item)}>
            <div className="relative overflow-hidden h-48 sm:h-56">
              <img
                src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  console.log('Food menu image failed to load:', item.name, item.image_url);
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2232%22%20y%3D%2232%22%20dy%3D%22.3em%22%20fill%3D%22%23AAAAAA%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                }}
              />
              <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 sm:px-3 sm:py-1 flex items-center space-x-1 shadow-lg">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs sm:text-sm font-semibold">4.5</span>
              </div>
              {!item.is_available && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <Badge variant="destructive" className="text-sm sm:text-base">Out of Stock</Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4 sm:p-5">
              <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-1">{item.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 h-8 sm:h-10">
                {item.description || 'Delicious food item prepared with fresh ingredients'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold text-orange-600">
                  ₹{item.price.toFixed(0)}
                </span>
                {/* <Badge variant="outline" className="text-xs">⚡ 30 min</Badge> */}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 sm:p-5 sm:pt-0">
              {item.is_available ? (
                getItemQuantity(item.id) === 0 ? (
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                ) : (
                  <div className="flex items-center justify-between w-full bg-orange-50 rounded-lg px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDecreaseQuantity(item);
                      }}
                      className="text-orange-600 hover:bg-orange-200"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-orange-600">{getItemQuantity(item.id)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleIncreaseQuantity(item);
                      }}
                      className="text-orange-600 hover:bg-orange-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )
              ) : (
                <Button disabled className="w-full" onClick={(event) => event.stopPropagation()}>
                  Out of Stock
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {visibleCount < items.length && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={handleViewMore}>
            View more
          </Button>
        </div>
      )}

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedItem.name}</DialogTitle>

                {/* ✅ FIX ADDED HERE */}
                <DialogDescription>
                  View the full food details and manage quantity before adding to your cart.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <img
                  src={selectedItem.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={selectedItem.name}
                  className="w-full h-64 sm:h-80 object-cover rounded-lg"
                  onError={(e) => {
                    console.log('Food detail image failed to load:', selectedItem.name, selectedItem.image_url);
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22400%22%20viewBox%3D%220%200%20800%20400%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22800%22%20height%3D%22400%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Ctext%20x%3D%22400%22%20y%3D%22200%22%20dy%3D%22.3em%22%20fill%3D%22%23AAAAAA%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%3ENo%20Image%20Available%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />

                <div className="space-y-2">
                  <p className="text-gray-600">{selectedItem.description || 'Delicious food item prepared with fresh ingredients'}</p>
                </div>

                <div className="flex items-center justify-between border-t border-b py-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.5 Rating</span>
                  </div>
                  <Badge variant="secondary">⚡ 30 min delivery</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Price:</span>
                    <span className="text-3xl font-bold text-orange-600">₹{selectedItem.price.toFixed(0)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {getItemQuantity(selectedItem.id) === 0 ? (
                    <Button
                      onClick={() => {
                        handleAddToCart(selectedItem);
                      }}
                      disabled={!selectedItem.is_available}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add to Cart
                    </Button>
                  ) : (
                    <div className="flex-1 flex items-center gap-3 bg-orange-50 rounded-lg p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const qty = getItemQuantity(selectedItem.id);
                          if (qty === 1) {
                            removeFromCart(selectedItem.id);
                            toast({
                              title: 'Removed from cart',
                              description: `${selectedItem.name} has been removed`,
                              duration: 2000,
                            });
                          } else {
                            updateQuantity(selectedItem.id, qty - 1);
                          }
                        }}
                        className="text-orange-600 hover:bg-orange-200"
                      >
                        −
                      </Button>
                      <span className="flex-1 text-center font-bold text-orange-600 text-lg">{getItemQuantity(selectedItem.id)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const qty = getItemQuantity(selectedItem.id);
                          updateQuantity(selectedItem.id, qty + 1);
                        }}
                        className="text-orange-600 hover:bg-orange-200"
                      >
                        +
                      </Button>
                    </div>
                  )}
                  <Button
                    onClick={() => setSelectedItem(null)}
                    variant="outline"
                    className="flex-1 py-3"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
