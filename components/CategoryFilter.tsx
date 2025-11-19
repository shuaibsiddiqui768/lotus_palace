'use client';

import React, { useRef } from 'react';
import { Category } from '@/lib/data';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

const categoryImages: Record<string, string> = {
  all: 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=400',
  pizza: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=400',
  burgers: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400',
  pasta: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400',
  salads: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400',
  drinks: 'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg?auto=compress&cs=tinysrgb&w=400',
  desserts: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',
};

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="bg-white border-b top-16 sm:top-20 z-40">
      {/* Enhanced section with more vertical padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Centered heading */}
        <div className="flex justify-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
            Browse by Category
          </h2>
        </div>

        {/* Slider wrapper with enhanced relative positioning */}
        <div className="relative py-4">
          {/* Track with enhanced spacing - NO GRADIENT FADES */}
          <div
            ref={scrollContainerRef}
            className={cn(
              // Enhanced layout and scrolling with more gap
              'flex gap-7 sm:gap-8 overflow-x-auto scroll-smooth',
              // Enhanced vertical padding for better breathing room
              'py-6 px-2',
              // Taller lane with more height
              'min-h-[200px] sm:min-h-[220px]',
              // Hide scrollbar cross-browser
              'scrollbar-hide [scrollbar-width:none] [ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
              // Snap behavior
              'snap-x snap-mandatory'
            )}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category.slug;
              const imageUrl = categoryImages[category.slug] || categoryImages.all;

              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.slug)}
                  className={cn(
                    'flex flex-col items-center gap-4 flex-shrink-0 transition-all duration-300 group',
                    // Each item is a snap point
                    'snap-start',
                    // Enhanced padding around each category item
                    'p-3 rounded-2xl',
                    // Subtle hover background
                    isSelected 
                      ? 'bg-orange-50/50' 
                      : 'hover:bg-gray-50/80'
                  )}
                  // Wider tiles to feel fuller across the row
                  style={{ width: 'clamp(130px, 34vw, 190px)' }}
                >
                  <div
                    className={cn(
                      // Larger circular thumbnail with enhanced shadow
                      'relative h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-full overflow-hidden transition-all duration-300 flex-shrink-0',
                      isSelected
                        ? 'ring-4 ring-orange-500 shadow-2xl scale-110'
                        : 'ring-2 ring-gray-200 shadow-lg hover:ring-orange-300 hover:shadow-xl hover:scale-105'
                    )}
                  >
                    <img
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={cn(
                      'text-sm sm:text-base font-semibold text-center transition-colors duration-300 whitespace-nowrap px-2',
                      isSelected ? 'text-orange-600' : 'text-gray-700'
                    )}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
