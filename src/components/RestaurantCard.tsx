import React from 'react';
import { Star, Clock, MapPin, ArrowRight } from 'lucide-react';
import type { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSelect: (restaurant: Restaurant) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(restaurant)}
      className="group bg-[#151110] border border-[#2E2623] hover:border-[#CAF509] rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#CAF509]/5 hover:-translate-y-1 flex flex-col justify-between"
    >
      <div>
        {/* Cover Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-[#1E1917]">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151110] via-transparent to-transparent opacity-80" />

          {/* Delivery Time Badge */}
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#2E2623] text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
            <Clock className="w-3.5 h-3.5 text-[#CAF509]" />
            <span>{restaurant.deliveryTime}</span>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-amber-400/30 text-xs font-black text-amber-300 flex items-center gap-1 shadow-md">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{restaurant.rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400 font-normal">({restaurant.ratingCount})</span>
          </div>

          {/* Status Badge */}
          {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
              <span className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider">
                Currently Closed
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-xl font-bold text-white group-hover:text-[#CAF509] transition-colors leading-snug">
              {restaurant.name}
            </h3>
          </div>

          <p className="text-xs text-gray-400 font-medium mb-3 line-clamp-1">
            {restaurant.tagline}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {restaurant.cuisines.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-md bg-[#1F1917] border border-[#2B2320] text-[11px] font-semibold text-gray-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 pb-5 pt-3 border-t border-[#231C1A] flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-gray-500" />
          <span className="truncate max-w-[120px]">{restaurant.area}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">₹{restaurant.priceForTwo} for two</span>
          <button className="w-8 h-8 rounded-full bg-[#1F1917] group-hover:bg-[#CAF509] group-hover:text-black flex items-center justify-center transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
