'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const handleAdminClick = () => {
    // Clear admin login state to force fresh login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminData');
      window.dispatchEvent(new Event('admin-login-change'));
      window.open('/admin', '_blank', 'noopener,noreferrer');
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f4efeb] text-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
           
              <div>
                <p className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                  FoodHub
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-600">Taste The Moments</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Your favorite meals, freshly prepared and delivered with care. Discover curated menus and vibrant flavors crafted for every craving.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="rounded-full border border-orange-200 bg-white/70 text-orange-600 transition-colors hover:bg-orange-500 hover:text-white">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full border border-orange-200 bg-white/70 text-orange-600 transition-colors hover:bg-orange-500 hover:text-white">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full border border-orange-200 bg-white/70 text-orange-600 transition-colors hover:bg-orange-500 hover:text-white">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
            <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
              <Link href="/" className="rounded-lg bg-white/70 px-4 py-2 font-medium text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-orange-600">
                Home
              </Link>
              <Link href="/menu" className="rounded-lg bg-white/70 px-4 py-2 font-medium text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-orange-600">
                Menu
              </Link>
              <Link href="/about" className="rounded-lg bg-white/70 px-4 py-2 font-medium text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-orange-600">
                About Us
              </Link>
              <Link href="/contactus" className="rounded-lg bg-white/70 px-4 py-2 font-medium text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-orange-600">
                Contact Us
              </Link>
              <a
                href="/admin/login"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAdminClick}
                className="rounded-lg bg-white/70 px-4 py-2 text-left font-medium text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-orange-600"
              >
                Admin Panel
              </a>
              <a href="/waiters/login" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/70 px-4 py-2 font-medium text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-orange-600">
                Waiters Dashboard
              </a>
              
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
            <ul className="mt-5 space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3 rounded-2xl p-4">
                <MapPin className="mt-1 h-5 w-5 text-orange-600" />
                <span>123 Food Street, Culinary City, FC 12345</span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl p-4">
                <Phone className="h-5 w-5 text-orange-600" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl p-4">
                <Mail className="h-5 w-5 text-orange-600" />
                <span>support@foodhub.com</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Find Us</h3>
            <a
              href="https://www.google.com/maps?q=40.7128,-74.0060"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-3xl shadow-lg ring-1 ring-orange-200"
            >
              <iframe
                title="FoodHub location"
                src="https://www.google.com/maps?q=40.7128,-74.0060&z=15&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="pointer-events-none h-56 w-full border-0"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent transition-opacity group-hover:opacity-80" />
              <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-orange-600 shadow">
                <MapPin className="h-4 w-4" />
                View on Google Maps
              </div>
            </a>
            <p className="text-sm text-gray-600">
              Tap the map to open directions and plan your next visit to FoodHub HQ.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-orange-200 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">
            <p>© {currentYear} FoodHub. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <a href="#" className="transition hover:text-orange-600">Privacy Policy</a>
              <a href="#" className="transition hover:text-orange-600">Terms of Service</a>
              <a href="#" className="transition hover:text-orange-600">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
