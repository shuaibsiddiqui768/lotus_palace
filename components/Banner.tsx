'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface BannerProps {
  onOrderClick: () => void;
  onViewMenuClick: () => void;
}

const Banner = ({ onOrderClick, onViewMenuClick }: BannerProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Fresh & Delicious',
      subtitle: 'Authentic Cuisine',
      accent: 'Crafted with Love'
    },
    {
      image: 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Taste the Excellence',
      subtitle: 'Premium Quality',
      accent: 'Delivered Fast'
    },
    {
      image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Exquisite Flavors',
      subtitle: 'Culinary Masterpiece',
      accent: 'Order Your Favorite'
    },
    {
      image: 'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Fresh Ingredients',
      subtitle: 'Healthy & Tasty',
      accent: 'From Our Kitchen'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative min-h-[60vh] sm:min-h-screen flex items-center justify-start overflow-hidden w-full shadow-lg">
      {/* Slideshow Background */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Neutral dark overlay for text readability - no green tint */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Content */}
      <div className="relative w-full px-6 sm:px-12 md:px-16 lg:px-24 z-10">
        <div className="max-w-2xl space-y-6 text-left">
          {/* Animated slide content */}
          <div
            key={currentSlide}
            className="animate-fade-in-up"
          >
            <div className="inline-block mb-3 px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-300/30">
              <p className="text-sm sm:text-base font-medium text-white/95">
                {slides[currentSlide].accent}
              </p>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
              {slides[currentSlide].title}
              <span className="block mt-2 text-emerald-300 bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                {slides[currentSlide].subtitle}
              </span>
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl text-white/95 drop-shadow-md max-w-lg leading-relaxed">
            Order your favorite meals from the best restaurants in town, delivered fresh to your doorstep
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
            <Button
              size="lg"
              className="gap-2 shadow-xl bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg transition-all duration-300 hover:scale-105 border border-white/20"
              onClick={onViewMenuClick}
            >
              Order Now
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Link href="/menu">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/15 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/25 hover:border-white/50 font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg transition-all duration-300 hover:scale-105 shadow-lg"
              >
                View Menu
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2 sm:gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 sm:w-10 bg-gradient-to-r from-emerald-400 to-lime-400 shadow-lg'
                : 'w-2 sm:w-2.5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Decorative lotus-inspired bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-lime-500 to-emerald-600 opacity-80" />
    </section>
  );
};

export default Banner;
