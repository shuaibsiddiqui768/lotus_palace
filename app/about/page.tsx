'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Heart, Award, Users, MapPin, Phone, CalendarHeart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-lime-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-20 -left-10 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-lime-200/50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="https://res.cloudinary.com/dsb0vh0vu/image/upload/v1763559340/ChatGPT_Image_Nov_19_2025_01_41_57_PM_m8y7tw.png"
              alt="Lotus Palace Logo"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-600 mb-4">
            About Lotus Palace
          </h1>
          <p className="text-base sm:text-lg text-emerald-900/80 max-w-3xl mx-auto leading-relaxed">
            A boutique hotel, banquet and restaurant in the heart of Gomti Nagar, where warm Lucknowi
            hospitality meets contemporary comfort and curated culinary experiences.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-emerald-900/80">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 shadow-sm border border-emerald-100">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>1/84, Viraj Khand-3, Gomti Nagar, Lucknow</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 shadow-sm border border-emerald-100">
              <Phone className="h-4 w-4 text-emerald-600" />
              <span>+91 82995 07456</span>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto space-y-16 md:space-y-20">
          {/* Our Story */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Heart className="h-7 w-7 text-emerald-700" />
                </div>
                <h2 className="text-3xl font-bold text-emerald-900">Our Story</h2>
              </div>
              <p className="text-emerald-900/80 leading-relaxed text-base sm:text-lg">
                Lotus Palace was envisioned as a calm, elegant retreat within the vibrant neighbourhood of
                Gomti Nagar – a place where families, travellers and corporate guests feel at home the
                moment they step in. Every corner is designed to reflect the grace of Lucknow with a fresh,
                modern touch.
              </p>
              <p className="text-emerald-900/80 leading-relaxed text-sm sm:text-base">
                From intimate dinners to lively celebrations and comfortable stays, the team at Lotus Palace
                focuses on thoughtful details – warm service, tasteful interiors and food that people return
                for. The goal is simple: create experiences guests fondly remember and happily recommend.
              </p>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl shadow-2xl overflow-hidden ring-1 ring-emerald-100 bg-emerald-900/10">
                <Image
                  src="https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Hotel Lotus Palace exterior and ambiance"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 via-emerald-900/10 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="font-semibold text-lg">Lotus Palace</p>
                  <p className="text-sm text-emerald-50">Gomti Nagar · Lucknow</p>
                </div>
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="bg-white/90 rounded-3xl shadow-xl border border-emerald-100 px-6 sm:px-8 md:px-12 py-10 md:py-12">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-lime-600 rounded-full mb-5 shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-900 mb-4">Stay · Dine · Celebrate</h2>
              <p className="text-emerald-900/75 text-sm sm:text-base leading-relaxed">
                Thoughtfully designed rooms, a welcoming restaurant, and flexible banquet spaces come
                together under one roof – making Lotus Palace ideal for weekend getaways, business trips,
                family functions and social events.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-emerald-900">Comfortable Stays</h3>
                <p className="text-emerald-900/75 text-sm leading-relaxed">
                  Well-appointed rooms with essential amenities, soothing colours and a calm atmosphere for
                  a restful stay after a busy day in the city.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-emerald-900">Restaurant & Dining</h3>
                <p className="text-emerald-900/75 text-sm leading-relaxed">
                  A multi-cuisine menu featuring North Indian favourites, popular comfort dishes and
                  chef-crafted specials, suitable for families and groups.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-emerald-900">Banquets & Events</h3>
                <p className="text-emerald-900/75 text-sm leading-relaxed">
                  Spaces curated for birthdays, engagements, corporate meetings and social gatherings, with
                  catering and decor support available as per requirement.
                </p>
              </div>
            </div>
          </div>

          {/* What Sets Us Apart */}
          <div className="mb-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-lime-600 rounded-full mb-5 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-900 mb-2">What Guests Love Here</h2>
              <p className="text-emerald-900/70 text-sm sm:text-base max-w-2xl mx-auto">
                Lotus Palace focuses on small, consistent comforts that make stays smooth and celebrations
                stress-free for guests and hosts alike.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {[
                {
                  title: 'Prime Gomti Nagar Location',
                  description: 'Easy to reach with good connectivity to business hubs and popular city spots.',
                  icon: '📍',
                },
                {
                  title: 'Warm, Attentive Staff',
                  description: 'Helpful team that supports you through check-in, dining and event planning.',
                  icon: '🤝',
                },
                {
                  title: 'Clean & Comfortable Rooms',
                  description: 'Neat, air-conditioned rooms designed for restful sleep and convenience.',
                  icon: '🛏️',
                },
                {
                  title: 'Banquet for Celebrations',
                  description: 'Suitable for family functions, pre-wedding events and corporate meets.',
                  icon: '🎉',
                },
                {
                  title: 'Tasty, Fresh Food',
                  description: 'Popular for homely yet flavourful preparations guests often request again.',
                  icon: '🍽️',
                },
                {
                  title: 'Value-Focused Experience',
                  description: 'A balanced blend of comfort, ambiance and pricing for short and long stays.',
                  icon: '💚',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-emerald-100/80 p-6"
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-emerald-900/75 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-600 rounded-3xl px-6 sm:px-8 md:px-12 py-10 md:py-12 text-center text-white shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
                <CalendarHeart className="h-4 w-4" />
                <span>Plan your next stay or celebration</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Experience Lotus Palace in Gomti Nagar
            </h2>
            <p className="text-sm sm:text-base md:text-lg mb-7 max-w-3xl mx-auto opacity-95 leading-relaxed">
              From relaxed stays and business trips to birthdays, anniversaries and family dinners,
              Lotus Palace is ready to host your special moments with care and attention.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link
  href="https://lotus-hotel-stay.netlify.app/"
  target="_blank"
  rel="noopener noreferrer"
  className="bg-white text-emerald-700 px-8 py-3 rounded-full font-semibold hover:bg-emerald-50 transition-colors shadow-lg text-center text-sm sm:text-base"
>
  Explore Rooms & Dining
</Link>

<Link
  href="https://lotus-hotel-stay.netlify.app/"
  target="_blank"
  rel="noopener noreferrer"
  className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-emerald-700 transition-colors text-center text-sm sm:text-base"
>
  Enquire for Events
</Link>

            </div>
          </div>
        </div>
      </main>

      {/* <Footer />/ */}
    </div>
  );
}
