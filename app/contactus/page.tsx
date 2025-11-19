'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-20 h-20 bg-orange-200 rounded-full blur-xl"></div>
          <div className="absolute top-32 right-16 w-16 h-16 bg-red-200 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-orange-300 rounded-full blur-2xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-8 shadow-lg">
            <Mail className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            We&apos;d love to hear from you! Whether you have questions about our menu, want to make a reservation, or need assistance with your order, our team is here to help.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Contact Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: MapPin,
                title: "Visit Us",
                content: ["123 Food Street", "Culinary City, FC 12345"],
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Phone,
                title: "Call Us",
                content: ["+1 (555) 123-4567"],
                color: "from-green-500 to-green-600"
              },
              {
                icon: Mail,
                title: "Email Us",
                content: ["support@foodhub.com"],
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: Clock,
                title: "Opening Hours",
                content: ["Mon-Fri: 11AM-10PM", "Sat-Sun: 12PM-11PM"],
                color: "from-orange-500 to-red-500"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-orange-100 hover:-translate-y-1">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl mb-4 shadow-lg`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                <div className="space-y-1">
                  {item.content.map((line, i) => (
                    <p key={i} className="text-gray-600 text-sm leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Map and Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Find Us</h2>
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                  <iframe
                    title="FoodHub location"
                    src="https://www.google.com/maps?q=40.7128,-74.0060&z=15&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-80 border-0"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center mt-4">
                  Click on the map to open directions in Google Maps
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose FoodHub?</h2>
                <div className="space-y-6">
                  {[
                    {
                      title: "Fresh & Quality Food",
                      description: "We use only the finest ingredients to ensure every dish meets our high standards."
                    },
                    {
                      title: "Fast & Reliable Service",
                      description: "Quick preparation and delivery with real-time order tracking."
                    },
                    {
                      title: "Diverse Menu Options",
                      description: "From classic favorites to innovative creations, there's something for everyone."
                    },
                    {
                      title: "Community Focused",
                      description: "Supporting local suppliers and giving back to our community."
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Experience FoodHub?</h3>
                <p className="mb-6 opacity-90">
                  Join thousands of satisfied customers who choose FoodHub for their dining needs.
                </p>
                <div className="flex justify-center">
                  <Link href="/" className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors shadow-lg text-center">
                    Order Online
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}