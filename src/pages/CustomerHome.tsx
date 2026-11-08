import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { FoodCategories } from '../components/FoodCategories';
import { OffersSection } from '../components/OffersSection';
import { RestaurantCard } from '../components/RestaurantCard';
import { api } from '../api/client';
import type { Restaurant } from '../types';
import { Sparkles, Utensils, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';

interface CustomerHomeProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenAiConcierge: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onSelectRestaurant,
  onOpenAiConcierge,
  searchQuery,
  setSearchQuery,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const res = await api.restaurants.getAll({
          cuisine: selectedCategory,
          search: searchQuery,
          sortBy,
        });
        setRestaurants(res.restaurants);
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <HeroSection
        onSearch={(term) => setSearchQuery(term)}
        onOpenAiConcierge={onOpenAiConcierge}
      />

      {/* Food Categories */}
      <FoodCategories
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Special Offers Section */}
      <OffersSection />

      {/* Restaurant Discovery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {selectedCategory !== 'All' ? `${selectedCategory} Restaurants` : 'Popular Restaurants'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1F1917] border border-[#2E2623] text-xs font-bold text-gray-400">
                {restaurants.length} places
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Top-rated cloud kitchens, dining spots & dessert parlours
            </p>
          </div>

          {/* Sorting controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#181311] border border-[#2E2623] text-xs font-bold text-white focus:outline-none focus:border-[#CAF509]"
            >
              <option value="featured">Featured First</option>
              <option value="rating">Highest Rated</option>
              <option value="deliveryTime">Fastest Delivery</option>
              <option value="priceAsc">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Restaurant Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 rounded-3xl bg-[#161210] animate-pulse border border-[#261E1C]" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16 bg-[#151110] rounded-3xl border border-[#2E2623]">
            <Utensils className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No restaurants match your filter</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
              Try choosing a different cuisine or resetting your search keyword.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-xl bg-[#CAF509] text-black font-extrabold text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {restaurants.map((res) => (
              <RestaurantCard
                key={res.id}
                restaurant={res}
                onSelect={(r) => onSelectRestaurant(r)}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it Works Section (preserving original choose.jpeg, add.jpeg, fast.jpeg) */}
      <section className="bg-[#120E0D] border-y border-[#261E1C] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#CAF509] uppercase tracking-wider block mb-1">
              Seamless Ordering
            </span>
            <h2 className="text-3xl font-black text-white">How FoodRush X Works</h2>
            <p className="text-xs text-gray-400 mt-2">
              From craving to fresh steaming doorstep delivery in three effortless steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#181311] border border-[#2B221F] rounded-3xl p-6 text-center group hover:border-[#CAF509]/50 transition-all">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-5 border-2 border-[#2E2623] group-hover:scale-105 transition-transform">
                <img src="/assets/choose.jpeg" alt="Choose Restaurant" className="w-full h-full object-cover" />
              </div>
              <span className="w-7 h-7 rounded-full bg-[#CAF509] text-black font-black text-xs inline-flex items-center justify-center mb-3">1</span>
              <h3 className="text-lg font-bold text-white mb-2">1. Choose Restaurant</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Browse our curated selection of multi-cuisine restaurants, authentic biryani houses, and dessert parlours.
              </p>
            </div>

            <div className="bg-[#181311] border border-[#2B221F] rounded-3xl p-6 text-center group hover:border-[#CAF509]/50 transition-all">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-5 border-2 border-[#2E2623] group-hover:scale-105 transition-transform">
                <img src="/assets/add.jpeg" alt="Add to Cart" className="w-full h-full object-cover" />
              </div>
              <span className="w-7 h-7 rounded-full bg-[#CAF509] text-black font-black text-xs inline-flex items-center justify-center mb-3">2</span>
              <h3 className="text-lg font-bold text-white mb-2">2. Add to Cart & Customize</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Select your portion sizes, add extra toppings, apply promo coupons, and pay securely via UPI, Card, or COD.
              </p>
            </div>

            <div className="bg-[#181311] border border-[#2B221F] rounded-3xl p-6 text-center group hover:border-[#CAF509]/50 transition-all">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-5 border-2 border-[#2E2623] group-hover:scale-105 transition-transform">
                <img src="/assets/fast.jpeg" alt="Fast Delivery" className="w-full h-full object-cover" />
              </div>
              <span className="w-7 h-7 rounded-full bg-[#CAF509] text-black font-black text-xs inline-flex items-center justify-center mb-3">3</span>
              <h3 className="text-lg font-bold text-white mb-2">3. Fast Hyperlocal Delivery</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Watch live kitchen updates and dispatch tracking as our dedicated delivery partner brings your meal hot and fresh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download App Section (preserving original banner & buttons) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#181311] via-[#211814] to-[#181311] border border-[#2E2623] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl">
            <span className="px-3 py-1 rounded-full bg-[#CAF509]/20 text-[#CAF509] text-xs font-bold uppercase tracking-wider mb-3 inline-block">
              Mobile App Experience
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Download Our FoodRush X App <br />
              <span className="text-gray-400 font-medium text-2xl sm:text-3xl">for Easy & Fast Food Delivery</span>
            </h2>
            <p className="text-sm text-gray-300 mb-8 leading-relaxed">
              Get exclusive promo codes, real-time push notifications, and priority dispatch directly on your iOS or Android smartphone.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="px-5 py-3 rounded-2xl bg-[#0D0B0A] border border-[#3D332F] hover:border-[#CAF509] cursor-pointer transition-all flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-[#CAF509]" />
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Get it on</p>
                  <p className="text-sm font-extrabold text-white">Google Play</p>
                </div>
              </div>

              <div className="px-5 py-3 rounded-2xl bg-[#0D0B0A] border border-[#3D332F] hover:border-[#CAF509] cursor-pointer transition-all flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-white" />
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Download on the</p>
                  <p className="text-sm font-extrabold text-white">App Store</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-48 h-48 rounded-full bg-[#CAF509]/10 border border-[#CAF509]/30 flex items-center justify-center p-4">
            <img src="/assets/foodrush-cart-icon.jpg" alt="FoodRush X" className="w-28 h-28 object-contain rounded-2xl shadow-xl" />
          </div>
        </div>
      </section>

      {/* FAQ & Testimonials Section from original */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-black text-white mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#151110] border border-[#2E2623]">
            <h3 className="text-base font-bold text-white mb-2">How does FoodRush X work?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Search nearby restaurants or use our AI Food Genie to pick dishes matching your diet and budget. The kitchen prepares your order and our verified courier delivers it safely.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#151110] border border-[#2E2623]">
            <h3 className="text-base font-bold text-white mb-2">Is there a delivery fee?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Delivery fees range from ₹25-₹35 depending on distance, but you can enjoy FREE delivery on all orders above ₹199 using coupon code <strong className="text-[#CAF509]">CHICKEN453</strong>.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#151110] border border-[#2E2623]">
            <h3 className="text-base font-bold text-white mb-2">Can I schedule an order in advance?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Yes, you can schedule deliveries during restaurant operational hours or choose instant express dispatch with live courier GPS simulation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
