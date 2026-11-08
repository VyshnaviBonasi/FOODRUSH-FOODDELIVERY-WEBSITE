import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Leaf, 
  Drumstick, 
  Plus, 
  Flame,
  Search,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import type { Restaurant, MenuItem } from '../types';
import { DishCustomizationModal } from '../components/DishCustomizationModal';
import { useCart } from '../context/CartContext';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
}

export const RestaurantDetail: React.FC<RestaurantDetailProps> = ({ restaurant, onBack }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchItem, setSearchItem] = useState<string>('');
  const [activeDishForCustomization, setActiveDishForCustomization] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { items: cartItems, addItem } = useCart();

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const res = await api.restaurants.getById(restaurant.id);
        setMenuItems(res.menuItems);
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurant.id]);

  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category)))];

  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      !searchItem ||
      item.name.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.description.toLowerCase().includes(searchItem.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDishClick = (dish: MenuItem) => {
    if (!dish.inStock) return;
    if ((dish.variants && dish.variants.length > 0) || (dish.addons && dish.addons.length > 0)) {
      setActiveDishForCustomization(dish);
    } else {
      addItem(dish, restaurant);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Restaurant Header Banner */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-[#151110]">
        <img
          src={restaurant.bannerImage || restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0B0A] via-[#0D0B0A]/60 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-[#2E2623] text-white text-xs font-bold flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Restaurants
          </button>
        </div>

        {/* Restaurant Header Details */}
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#CAF509] text-black text-xs font-black uppercase tracking-wider">
                  Verified Partner
                </span>
                <span className="text-xs text-gray-400">· {restaurant.totalOrdersServed || 2500}+ orders served</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
                {restaurant.name}
              </h1>
              <p className="text-sm text-gray-300 max-w-2xl font-medium mb-3">
                {restaurant.tagline}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">({restaurant.ratingCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold bg-[#1C1715] px-2.5 py-1 rounded-lg border border-[#2E2623]">
                  <Clock className="w-4 h-4 text-[#CAF509]" />
                  <span>{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold bg-[#1C1715] px-2.5 py-1 rounded-lg border border-[#2E2623]">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{restaurant.address}</span>
                </div>
                <div className="font-semibold text-white">
                  ₹{restaurant.priceForTwo} for two
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Categories Bar & Search */}
      <div className="sticky top-20 z-30 bg-[#0D0B0A]/95 backdrop-blur-md border-b border-[#261E1C] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#CAF509] text-black shadow-md shadow-[#CAF509]/20'
                    : 'bg-[#181311] border border-[#261E1C] text-gray-300 hover:text-white hover:border-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search inside menu */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              placeholder="Search in this menu..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#181311] border border-[#261E1C] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509]"
            />
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-44 rounded-3xl bg-[#151110] animate-pulse border border-[#2E2623]" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[#151110] rounded-3xl border border-[#2E2623]">
            <p className="text-sm font-bold text-white mb-1">No items found</p>
            <p className="text-xs text-gray-400">Try changing the category or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((dish) => {
              const inCartCount = cartItems
                .filter((c) => c.menuItem.id === dish.id)
                .reduce((acc, c) => acc + c.quantity, 0);

              return (
                <div
                  key={dish.id}
                  className={`p-5 rounded-3xl bg-[#151110] border transition-all flex flex-col justify-between ${
                    dish.inStock
                      ? 'border-[#261E1C] hover:border-[#CAF509]/60 hover:shadow-xl'
                      : 'border-red-900/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Veg / Non-Veg Indicator */}
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center p-0.5 ${
                            dish.isVeg ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              dish.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>

                        {dish.isPopular && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                            Bestseller
                          </span>
                        )}

                        {dish.spiceLevel && (
                          <span className="text-[11px] text-amber-400 flex items-center">
                            <Flame className="w-3 h-3 fill-amber-400 mr-0.5" />
                            {dish.spiceLevel}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white mb-1 leading-snug">{dish.name}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
                        {dish.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-[#CAF509]">₹{dish.price}</span>
                        {dish.variants && dish.variants.length > 0 && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            ({dish.variants.length} sizes available)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dish Photo */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[#241D1A] flex-shrink-0 border border-[#2E2623]">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {!dish.inStock && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-center p-1">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add action */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#211A18]">
                    <span className="text-[11px] text-gray-500">
                      {dish.preparationTimeMinutes ? `Prep: ~${dish.preparationTimeMinutes}m` : 'Freshly made'}
                    </span>

                    {dish.inStock ? (
                      <button
                        onClick={() => handleDishClick(dish)}
                        className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
                          inCartCount > 0
                            ? 'bg-[#151F10] border border-[#CAF509] text-[#CAF509]'
                            : 'bg-[#CAF509] hover:bg-[#B6DD06] text-black shadow-[#CAF509]/15'
                        }`}
                      >
                        {inCartCount > 0 ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Added ({inCartCount})
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 font-semibold">Unavailable Today</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customization modal */}
      {activeDishForCustomization && (
        <DishCustomizationModal
          dish={activeDishForCustomization}
          restaurant={restaurant}
          onClose={() => setActiveDishForCustomization(null)}
        />
      )}
    </div>
  );
};
