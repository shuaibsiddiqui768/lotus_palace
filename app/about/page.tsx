'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ChefHat, Heart, Award, Users } from 'lucide-react';

export default function AboutPage() {
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
            <ChefHat className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-6">
            About FoodHub
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Where passion for exceptional cuisine meets the art of creating memorable dining experiences. We&apos;re more than just a restaurant – we&apos;re a culinary journey that brings people together through the love of great food.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Our Story Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Heart className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Founded with a vision to revolutionize the way people experience food, FoodHub was born from the belief that every meal should be an adventure. Our team of passionate chefs and food enthusiasts work tirelessly to curate a menu that celebrates diversity in flavors, ingredients, and culinary traditions from around the world.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl shadow-xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Chef preparing delicious food"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="font-semibold text-lg">Culinary Excellence</p>
                </div>
              </div>
            </div>
          </div>

          {/* Our Mission Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6 shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                At FoodHub, our mission is simple: to serve delicious, high-quality food that brings joy to every customer. We believe in using fresh, locally-sourced ingredients whenever possible, and we&apos;re committed to sustainable practices that support our community and the environment.
              </p>
            </div>
          </div>

          {/* What Sets Us Apart */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Sets Us Apart</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Fresh Ingredients",
                  description: "High-quality ingredients sourced from trusted suppliers",
                  icon: "🥬"
                },
                {
                  title: "Innovative Menu",
                  description: "Classic favorites and exciting new creations",
                  icon: "🍽️"
                },
                {
                  title: "Exceptional Service",
                  description: "Customer service with a smile",
                  icon: "😊"
                },
                {
                  title: "Food Safety",
                  description: "Commitment to hygiene and safety standards",
                  icon: "🛡️"
                },
                {
                  title: "Sustainability",
                  description: "Eco-friendly practices and community support",
                  icon: "🌱"
                },
                {
                  title: "Global Flavors",
                  description: "Diverse culinary traditions from around the world",
                  icon: "🌍"
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-orange-100">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Join Us on This Culinary Journey</h2>
            <p className="text-xl mb-8 opacity-90">
              Whether you&apos;re dining in, ordering for delivery, or exploring our catering services, we invite you to experience the FoodHub difference. Come taste the moments that make life delicious!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors shadow-lg text-center">
                Order Now
              </Link>
              <Link href="/menu" className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-orange-600 transition-colors text-center">
                View Menu
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}