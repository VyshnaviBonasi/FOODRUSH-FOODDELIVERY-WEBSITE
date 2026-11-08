import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, ShieldCheck, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    restaurant,
    coupon,
    couponCodeInput,
    setCouponCodeInput,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    totalItemCount,
    subtotal,
    estimatedTax,
    estimatedDeliveryFee,
    discount,
    estimatedTotal,
  } = useCart();

  const { toast } = useToast();
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isCartDrawerOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponCodeInput.trim());
    setIsApplyingCoupon(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-fade-in flex justify-end">
      <div 
        className="w-full max-w-md bg-[#120E0D] border-l border-[#2E2623] h-full flex flex-col justify-between shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#231C1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C1715] border border-[#2E2623] flex items-center justify-center text-[#CAF509]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Your Food Cart</h2>
              <p className="text-xs text-gray-400">
                {restaurant ? `${restaurant.name} (${totalItemCount} items)` : 'Empty cart'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="w-8 h-8 rounded-full bg-[#1C1715] hover:bg-[#2A2320] text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#1C1715] border border-[#2E2623] flex items-center justify-center mx-auto mb-4 text-gray-600">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Your cart is empty</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
                Explore our signature menus from Paradise Biryani, Burger Hub, Sweet Tooth Bakery and more!
              </p>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#CAF509] text-black font-extrabold text-xs"
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[#181311] border border-[#261F1C]"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#241D1A] flex-shrink-0">
                      <img
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{item.menuItem.name}</h4>
                      {item.customization?.variant && (
                        <p className="text-[11px] text-[#CAF509]">
                          Portion: {item.customization.variant.name}
                        </p>
                      )}
                      {item.customization?.addons && item.customization.addons.length > 0 && (
                        <p className="text-[10px] text-gray-400 truncate">
                          + {item.customization.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      <p className="text-xs font-black text-white mt-1">
                        ₹{item.unitPrice * item.quantity}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Quantity Selector */}
                      <div className="flex items-center bg-[#1F1917] border border-[#2E2623] rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#CAF509]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Coupon Box */}
              <div className="p-4 rounded-2xl bg-[#181311] border border-[#261F1C]">
                <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder="Enter promo code (e.g. FIRST50)..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1F1917] border border-[#2E2623] text-xs font-mono uppercase text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isApplyingCoupon}
                    className="px-4 py-2.5 rounded-xl bg-[#1F1917] hover:bg-[#CAF509] hover:text-black border border-[#2E2623] text-xs font-extrabold text-white transition-all"
                  >
                    Apply
                  </button>
                </form>

                {coupon && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#151F10] border border-[#CAF509]/30 text-xs">
                    <div className="flex items-center gap-2 text-[#CAF509]">
                      <Check className="w-4 h-4" />
                      <span className="font-bold">Code "{coupon.code}" active! Saved ₹{discount}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div className="p-4 rounded-2xl bg-[#181311] border border-[#261F1C] space-y-2.5 text-xs">
                <h4 className="font-bold text-white text-sm mb-3">Bill Details</h4>

                <div className="flex justify-between text-gray-300">
                  <span>Item Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-300">
                  <span>Govt. Taxes & GST (5%)</span>
                  <span>₹{estimatedTax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-300">
                  <span>Delivery Partner Fee</span>
                  {estimatedDeliveryFee === 0 ? (
                    <span className="text-[#CAF509] font-bold">FREE</span>
                  ) : (
                    <span>₹{estimatedDeliveryFee.toFixed(2)}</span>
                  )}
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#CAF509] font-semibold">
                    <span>Discount Savings</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-[#261F1C] flex justify-between text-base font-extrabold text-white">
                  <span>To Pay</span>
                  <span className="text-[#CAF509]">₹{estimatedTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Hygiene Guarantee */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#14100E] border border-[#211B19] text-[11px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-[#CAF509] flex-shrink-0" />
                <span>Contactless doorstep delivery with tamper-proof seal guarantee.</span>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#231C1A] bg-[#151110] flex items-center gap-3">
            <button
              onClick={clearCart}
              className="px-3.5 py-3.5 rounded-xl bg-[#1F1917] hover:bg-[#2A2320] text-gray-400 hover:text-white border border-[#2E2623] transition-colors"
              title="Clear entire cart"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setIsCartDrawerOpen(false);
                onProceedToCheckout();
              }}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#CAF509] hover:bg-[#B6DD06] text-black font-black text-sm tracking-wide shadow-xl shadow-[#CAF509]/20 flex items-center justify-between transition-all"
            >
              <span>Proceed to Checkout</span>
              <div className="flex items-center gap-1.5 font-black">
                <span>₹{estimatedTotal.toFixed(2)}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
