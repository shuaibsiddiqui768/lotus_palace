'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactUsPage() {
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
          <div className="mb-4 flex justify-center">
            <img
              src="https://res.cloudinary.com/dsb0vh0vu/image/upload/v1763559340/ChatGPT_Image_Nov_19_2025_01_41_57_PM_m8y7tw.png"
              alt="Lotus Palace Logo"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-600 mb-4">
            Contact Lotus Palace
          </h1>
          <p className="text-base sm:text-lg text-emerald-900/80 max-w-3xl mx-auto leading-relaxed">
            Get in touch with the team at Lotus Palace, Gomti Nagar for room bookings, banquets,
            dining enquiries or any assistance during your stay.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Contact Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: MapPin,
                title: 'Address',
                content: [
                  'Hotel Lotus Palace',
                  '1/84, Viraj Khand-3',
                  'Gomti Nagar, Lucknow',
                  'Uttar Pradesh 226010',
                ],
                color: 'from-emerald-500 to-emerald-600',
              },
              {
                icon: Phone,
                title: 'Call Us',
                content: ['+91 82995 07456'],
                color: 'from-lime-500 to-lime-600',
              },
              {
                icon: Mail,
                title: 'Email',
                content: ['supreet.bps@gmail.com'],
                color: 'from-emerald-500 to-lime-500',
              },
              {
                icon: Clock,
                title: 'Business Hours',
                content: ['Open 24 hours', 'All 7 days'],
                color: 'from-emerald-600 to-emerald-700',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-emerald-100 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl mb-3 shadow-lg m-5`}
                >
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div className="px-5 pb-5">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                    {item.title}
                  </h3>
                  <div className="space-y-1">
                    {item.content.map((line, i) => (
                      <p key={i} className="text-emerald-900/75 text-sm leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map and Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Map */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-emerald-900 mb-4">Find Us</h2>
                <p className="text-sm sm:text-base text-emerald-900/75 mb-4">
                  Lotus Palace is located in Viraj Khand-3, Gomti Nagar – easily accessible from key
                  business districts and landmarks in Lucknow.
                </p>
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100">
                  <iframe
                    title="Lotus Palace location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.5555669936255!2d80.99665737528274!3d26.85403217668101!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399be300504998e7%3A0x15a603a7d805b8d9!2sHotel%20Lotus%20Palace!5e0!3m2!1sen!2sin!4v1732099800000!5m2!1sen!2sin"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-80 border-0"
                  />
                </div>
                <p className="text-sm text-emerald-900/70 text-center mt-3">
                  Tap the map to open directions to Lotus Palace in Google Maps.
                </p>
              </div>
            </div>

            {/* Why Choose & CTA */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-emerald-900 mb-4">
                  Why Choose Lotus Palace?
                </h2>
                <div className="space-y-5">
                  {[
                    {
                      title: 'Ideal for Stays & Events',
                      description:
                        'Comfortable rooms and banquet options for weddings, family functions and corporate meets in Gomti Nagar.',
                    },
                    {
                      title: 'Convenient Location',
                      description:
                        'Situated in Viraj Khand-3 with good connectivity to major roads, offices and shopping areas.',
                    },
                    {
                      title: 'Warm Hospitality',
                      description:
                        'Attentive staff focused on making your stay, dining or event experience smooth and memorable.',
                    },
                    {
                      title: 'Balanced Value',
                      description:
                        'A practical mix of comfort, food quality and pricing suitable for frequent travellers and families.',
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-600 to-lime-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-900 mb-1 text-sm sm:text-base">
                          {item.title}
                        </h3>
                        <p className="text-emerald-900/75 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-600 rounded-2xl p-7 text-white shadow-xl">
                <h3 className="text-2xl font-bold mb-3">Plan Your Visit or Event</h3>
                <p className="mb-6 text-sm sm:text-base opacity-95">
                  Reach out to check room availability, discuss banquet requirements or plan a
                  family dinner at Lotus Palace in Gomti Nagar.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="tel:+918299507456"
                    className="bg-white text-emerald-700 px-7 py-2.5 rounded-full font-semibold hover:bg-emerald-50 transition-colors shadow-lg text-center text-sm sm:text-base"
                  >
                    Call Now
                  </a>
                  <Link
                    href="/about"
                    className="border-2 border-white text-white px-7 py-2.5 rounded-full font-semibold hover:bg-white hover:text-emerald-700 transition-colors text-center text-sm sm:text-base"
                  >
                    Know More About Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
