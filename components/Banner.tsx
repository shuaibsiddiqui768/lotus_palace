// 'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface BannerProps {
  onOrderClick: () => void;
  onViewMenuClick: () => void;
}

const Banner = ({ onOrderClick, onViewMenuClick }: BannerProps) => {
  return (
    <section
      className="
        relative 
        min-h-[60vh]
        sm:min-h-screen
        flex items-center justify-start 
        overflow-hidden w-full shadow-soft bg-cover bg-center rounded-none
      "
      style={{
        backgroundImage:
          'url(https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=1200)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-orange-900/40 via-orange-900/50 to-transparent" />

      <div className="relative w-full px-6 sm:px-12 md:px-16 lg:px-24">
        <div className="max-w-xl space-y-6 text-left">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight">
            Delicious Food,
            <span className="block text-orange-500">Delivered Fast</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/90">
            Order your favorite meals from the best restaurants in town
          </p>

          <div className="flex flex-wrap gap-4">
            

            <Button
              size="lg"
              className="gap-2 shadow-hover bg-orange-500 hover:bg-orange-600 text-white"
              onClick={onViewMenuClick}
            >
              Order Now
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Link href="/menu">
              <Button
                size="lg"
                variant="outline"
                className="bg-background/20 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground hover:bg-background/30"
              >
                View Menu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
