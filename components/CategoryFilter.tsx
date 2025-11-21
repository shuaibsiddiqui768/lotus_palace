'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

const DEFAULT_IMAGE = 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=400';

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="border-b border-emerald-100/60 top-16 sm:top-20 z-40">
      {/* Section with lotus-themed spacing */}
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-8 sm:py-10 lg:py-12">
        {/* Centered heading in emerald theme */}
        <div className="flex justify-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-600 bg-clip-text text-transparent drop-shadow-sm">
            Browse by Category
          </h2>
        </div>

        {/* Slider wrapper */}
        <div className="relative py-2">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-md ring-1 ring-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-md ring-1 ring-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scrollContainerRef}
            className={cn(
              'flex gap-6 sm:gap-7 md:gap-8 lg:gap-10 overflow-x-auto scroll-smooth',
              'py-4 px-2 sm:px-10',
              'min-h-[200px] sm:min-h-[220px]',
              'scrollbar-hide [scrollbar-width:none] [ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
              'snap-x snap-mandatory'
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center w-full">
                <p className="text-emerald-700">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex items-center justify-center w-full">
                <p className="text-emerald-700">No categories available</p>
              </div>
            ) : (
              categories.map((category) => {
                const isSelected = selectedCategory === category.slug;
                const imageUrl = category.image || DEFAULT_IMAGE;

                return (
                  <button
                    key={category._id}
                    onClick={() => onSelectCategory(category.slug)}
                    className={cn(
                      'flex flex-col items-center gap-3 flex-shrink-0 transition-all duration-300 group',
                      'snap-start',
                      'p-3 sm:p-4 rounded-2xl',
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-50 to-lime-50 shadow-md'
                        : 'hover:bg-emerald-50/60 hover:shadow-sm'
                    )}
                    style={{ width: 'clamp(130px, 30vw, 190px)' }}
                  >
                    <div
                      className={cn(
                        'relative h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-full overflow-hidden transition-all duration-300 flex-shrink-0',
                        isSelected
                          ? 'ring-4 ring-emerald-600 shadow-2xl shadow-emerald-200/60 scale-110'
                          : 'ring-2 ring-emerald-200 shadow-lg hover:ring-emerald-400 hover:shadow-xl hover:scale-105'
                      )}
                    >
                      <img
                        src={imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div
                        className={cn(
                          'absolute inset-0 transition-opacity duration-300',
                          isSelected ? 'bg-emerald-600/10' : 'group-hover:bg-emerald-500/5'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm sm:text-base font-semibold text-center transition-colors duration-300 whitespace-nowrap px-2',
                        isSelected ? 'text-emerald-700' : 'text-slate-700 group-hover:text-emerald-600'
                      )}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
