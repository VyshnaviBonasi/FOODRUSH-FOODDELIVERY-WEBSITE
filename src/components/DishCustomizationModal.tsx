import React, { useState } from 'react';
import { X, Plus, Minus, Flame, Leaf, Drumstick, Sparkles } from 'lucide-react';
import type { MenuItem, Restaurant, OrderItemCustomization } from '../types';
import { useCart } from '../context/CartContext';

interface DishCustomizationModalProps {
  dish: MenuItem | null;
  restaurant: Restaurant | null;
  onClose: () => void;
}

export const DishCustomizationModal: React.FC<DishCustomizationModalProps> = ({
  dish,
  restaurant,
  onClose,
}) => {
  const { addItem } = useCart();
  if (!dish || !restaurant) return null;

  const [selectedVariant, setSelectedVariant] = useState(
    dish.variants && dish.variants.length > 0 ? dish.variants[0] : undefined
  );
  const [selectedAddons, setSelectedAddons] = useState<{ id: string; name: string; price: number }[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const toggleAddon = (addon: { id: string; name: string; price: number }) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  // Calculate current unit price
  const basePrice = selectedVariant ? selectedVariant.price : dish.price;
  const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalUnitPrice = basePrice + addonsPrice;
  const grandTotal = totalUnitPrice * quantity;

  const handleAddToCart = () => {
    const customization: OrderItemCustomization = {
      variant: selectedVariant,
      addons: selectedAddons.length > 0 ? selectedAddons : undefined,
      specialInstructions: specialInstructions.trim() || undefined,
    };

    addItem(dish, restaurant, customization, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151110] border border-[#2E2623] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dish image header */}
        <div className="relative h-56 w-full overflow-hidden bg-[#1D1715]">
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151110] via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md ${
                dish.isVeg
                  ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50'
                  : 'bg-rose-950/90 text-rose-400 border border-rose-500/50'
              }`}
            >
              {dish.isVeg ? <Leaf className="w-3.5 h-3.5" /> : <Drumstick className="w-3.5 h-3.5" />}
              {dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            </span>

            {dish.spiceLevel && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span className="capitalize">{dish.spiceLevel}</span>
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-2xl font-black text-white">{dish.name}</h2>
              <p className="text-xs text-gray-400 mt-1">{restaurant.name}</p>
            </div>
            <span className="text-xl font-black text-[#CAF509]">₹{dish.price}</span>
          </div>

          <p className="text-sm text-gray-300 mb-6 leading-relaxed">{dish.description}</p>

          {/* Allergens & Calories */}
          {(dish.allergens || dish.calories) && (
            <div className="flex flex-wrap gap-2 mb-6 p-3 rounded-xl bg-[#1C1715] border border-[#2B2320] text-xs text-gray-400">
              {dish.calories && <span>🔥 {dish.calories} kcal</span>}
              {dish.allergens && (
                <span>⚠️ Contains: {dish.allergens.join(', ')}</span>
              )}
            </div>
          )}

          {/* Variants section */}
          {dish.variants && dish.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                Select Portion Size
              </label>
              <div className="space-y-2">
                {dish.variants.map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedVariant?.id === v.id
                        ? 'bg-[#1F1917] border-[#CAF509] text-white shadow-sm'
                        : 'bg-[#171210] border-[#2E2623] text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="dish-variant"
                        checked={selectedVariant?.id === v.id}
                        onChange={() => setSelectedVariant(v)}
                        className="accent-[#CAF509] w-4 h-4"
                      />
                      <span className="text-sm font-semibold">{v.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#CAF509]">₹{v.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons section */}
          {dish.addons && dish.addons.length > 0 && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                Optional Add-ons
              </label>
              <div className="space-y-2">
                {dish.addons.map((a) => {
                  const isChecked = selectedAddons.some((addon) => addon.id === a.id);
                  return (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#1F1917] border-[#CAF509]/60 text-white'
                          : 'bg-[#171210] border-[#2E2623] text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(a)}
                          className="accent-[#CAF509] w-4 h-4 rounded"
                        />
                        <span className="text-sm font-medium">{a.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-300">+₹{a.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Cooking Instructions (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, keep chutney separate..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#181311] border border-[#2E2623] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509]"
            />
          </div>

          {/* Quantity selector & Add action */}
          <div className="flex items-center justify-between pt-4 border-t border-[#231C1A] gap-4">
            <div className="flex items-center bg-[#1C1715] border border-[#2E2623] rounded-xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#2A2320]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-extrabold text-white">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#CAF509] hover:bg-[#2A2320]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 px-6 rounded-2xl bg-[#CAF509] hover:bg-[#B6DD06] text-black font-black text-sm tracking-wide shadow-lg shadow-[#CAF509]/20 flex items-center justify-between transition-all"
            >
              <span>Add to Cart</span>
              <span>₹{grandTotal}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
