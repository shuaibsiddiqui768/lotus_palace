'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const handleAdminClick = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminData');
      window.dispatchEvent(new Event('admin-login-change'));
      window.open('/admin', '_blank', 'noopener,noreferrer');
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#b7e4c7] text-emerald-900 border-t border-emerald-300/70 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-4">

          {/* Brand – logo */}
          <div className="space-y-6">
            <div className="flex items-center">
              <img
                src="https://res.cloudinary.com/dsb0vh0vu/image/upload/v1763559340/ChatGPT_Image_Nov_19_2025_01_41_57_PM_m8y7tw.png"
                alt="Lotus Palace Logo"
                className="h-20 sm:h-24 md:h-28 w-auto object-contain"
              />
            </div>
            <p className="text-sm leading-relaxed text-emerald-900/85">
              Your favorite meals, freshly prepared and served with warmth at Lotus Palace Hotel,
              Banquet & Restaurant, where every visit becomes a cherished memory.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-emerald-300 bg-white/80 text-emerald-800 transition-colors hover:bg-emerald-700 hover:text-white shadow-sm"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-emerald-300 bg-white/80 text-emerald-800 transition-colors hover:bg-emerald-700 hover:text-white shadow-sm"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-emerald-300 bg-white/80 text-emerald-800 transition-colors hover:bg-emerald-700 hover:text-white shadow-sm"
              >
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-950">Quick Links</h3>
            <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
              <Link
                href="/"
                className="rounded-lg bg-white/85 px-4 py-2 font-medium text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-emerald-800"
              >
                Home
              </Link>
              <Link
                href="/menu"
                className="rounded-lg bg-white/85 px-4 py-2 font-medium text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-emerald-800"
              >
                Menu
              </Link>
              <Link
                href="/about"
                className="rounded-lg bg-white/85 px-4 py-2 font-medium text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-emerald-800"
              >
                About Us
              </Link>
              <Link
                href="/contactus"
                className="rounded-lg bg-white/85 px-4 py-2 font-medium text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-emerald-800"
              >
                Contact Us
              </Link>
              <a
                href="/admin/login"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAdminClick}
                className="rounded-lg bg-white/85 px-4 py-2 text-left font-medium text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-emerald-800"
              >
                Admin Panel
              </a>
              <a
                href="/waiters/login"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/85 px-4 py-2 font-medium text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-emerald-800"
              >
                Waiters Dashboard
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-950">Contact</h3>
            <ul className="mt-5 space-y-4 text-sm text-emerald-900/90">
              <li className="flex items-start gap-3 rounded-2xl p-4 bg-white/80 shadow-sm">
                <MapPin className="mt-1 h-5 w-5 text-emerald-800" />
                <span>
                  1/84, Viraj Khand-3,
                  <br />
                  Gomti Nagar, Lucknow,
                  <br />
                  Uttar Pradesh 226010
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl p-4 bg-white/80 shadow-sm">
                <Phone className="h-5 w-5 text-emerald-800" />
                <span>+91 82995 07456</span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl p-4 bg-white/80 shadow-sm">
                <Mail className="h-5 w-5 text-emerald-800" />
                <span>supreet.bps@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Map */}
          <div className="space-y-4 relative z-20">
            <h3 className="text-lg font-semibold text-emerald-950">Find Us</h3>

            <a
              href="https://maps.app.goo.gl/CzTC1PfQCNGjz2aY9"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative z-20 block overflow-hidden rounded-3xl shadow-lg ring-1 ring-emerald-300/90"
            >
              <iframe
                title="Lotus Palace location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.5555669936255!2d80.99665737528274!3d26.85403217668101!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399be300504998e7%3A0x15a603a7d805b8d9!2sHotel%20Lotus%20Palace!5e0!3m2!1sen!2sin!4v1732099800000!5m2!1sen!2sin"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="pointer-events-auto h-56 w-full border-0 relative z-30"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/15 to-transparent z-10 transition-opacity group-hover:opacity-80" />

              <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-emerald-800 shadow z-40">
                <MapPin className="h-4 w-4" />
                View on Google Maps
              </div>
            </a>

            <p className="text-sm text-emerald-900/85">
              Tap the map to open directions and plan your visit to Lotus Palace in Gomti Nagar, Lucknow.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-emerald-300 pt-6">
          <div className="flex flex-col items-center justify-center gap-4 text-sm text-emerald-900/85 sm:flex-row sm:justify-between">
            <p>© {currentYear} Lotus Palace. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
