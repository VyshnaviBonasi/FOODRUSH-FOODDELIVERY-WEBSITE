import React, { useState, useEffect } from 'react';
import { Search, Filter, Utensils, Star, Clock } from 'lucide-react';
import { RestaurantCard } from '../components/RestaurantCard';
import { api } from '../api/client';
import type { Restaurant } from '../types';

interface RestaurantListPageProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const RestaurantListPage: React.FC<RestaurantListPageProps> = ({
  onSelectRestaurant,
  searchQuery,
  setSearchQuery,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [loading, setLoading] = useState<boolean>(true);

  const cuisines = [
    'All',
    'Biryani',
    'Hyderabadi',
    'Mughlai',
    'North Indian',
    'Fast Food',
    'Burgers',
    'Pizza',
    'Chinese',
    'South Indian',
    'Desserts',
    'Bakery',
  ];

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const res = await api.restaurants.getAll({
          cuisine: selectedCuisine,
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
  }, [selectedCuisine, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Explore Restaurants in Chennai
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Find your favourite cuisines, popular chains and trending local food spots
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[#151110] border border-[#261E1C] mb-8">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurant or cuisine..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#1C1715] border border-[#2E2623] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509]"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-xs text-gray-400 font-bold">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-[#1C1715] border border-[#2E2623] text-xs font-bold text-white focus:outline-none focus:border-[#CAF509]"
          >
            <option value="featured">Featured First</option>
            <option value="rating">Top Rated (4.5+)</option>
            <option value="deliveryTime">Fastest Delivery</option>
            <option value="priceAsc">Price: Budget Friendly</option>
          </select>
        </div>
      </div>

      {/* Cuisine Pills (preserving original restaurants.html nav) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        {cuisines.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCuisine(c)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCuisine === c
                ? 'bg-[#CAF509] text-black shadow-md shadow-[#CAF509]/20'
                : 'bg-[#151110] border border-[#261E1C] text-gray-300 hover:text-white hover:border-gray-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Restaurants Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 rounded-3xl bg-[#151110] animate-pulse border border-[#261E1C]" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20 bg-[#151110] rounded-3xl border border-[#261E1C]">
          <Utensils className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No restaurants found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
            Try adjusting your search query or selecting a different cuisine pill.
          </p>
          <button
            onClick={() => {
              setSelectedCuisine('All');
              setSearchQuery('');
            }}
            className="px-5 py-2 rounded-xl bg-[#CAF509] text-black font-extrabold text-xs"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {restaurants.map((res) => (
            <RestaurantCard
              key={res.id}
              restaurant={res}
              onSelect={onSelectRestaurant}
            />
          ))}
        </div>
      )}
    </div>
  );
};
