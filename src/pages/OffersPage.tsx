import React, { useState } from 'react';
import { Tag, Sparkles, Copy, Check, Clock, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const OffersPage: React.FC = () => {
  const { applyCoupon, setCouponCodeInput, setIsCartDrawerOpen } = useCart();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const coupons = [
    {
      code: 'FIRST50',
      title: 'First Order Special',
      description: 'Flat 50% discount up to ₹150 for new FoodRush X users. Valid across all restaurants.',
      discount: '50% OFF',
      minOrder: 'Min order ₹199',
      image: '/assets/chickenbiriyani.jpg',
      badge: 'POPULAR',
      color: 'border-[#CAF509] text-[#CAF509]',
    },
    {
      code: 'BIRYANI145',
      title: 'Weekend Biryani Feast',
      description: 'Flat 40% OFF on Chicken Biryani, Mutton Biryani and Kebabs at Paradise Biryani & Nawabi Dum House.',
      discount: '40% OFF',
      minOrder: 'Min order ₹299',
      image: '/assets/paradise biriyani.avif',
      badge: 'WEEKEND SPECIAL',
      color: 'border-[#FF7A00] text-[#FF7A00]',
    },
    {
      code: 'SWEET30',
      title: 'Dessert Rush Delight',
      description: '30% OFF on all cakes, pastries, brownies and donuts from Sweet Tooth Bakery.',
      discount: '30% OFF',
      minOrder: 'Min order ₹199',
      image: '/assets/chocolate-truffle-cake-8844.jpg',
      badge: 'SWEET TOOTH',
      color: 'border-pink-500 text-pink-400',
    },
    {
      code: 'SOUTH100',
      title: 'South Indian Super Saver',
      description: 'Flat 40% discount on Andhra Full Meals, Ghee Roast Dosas & Tiffins from Andhra Spice Kitchen.',
      discount: '40% OFF',
      minOrder: 'Min order ₹199',
      image: '/assets/meals.jpg',
      badge: 'LUNCH HOURS',
      color: 'border-amber-400 text-amber-400',
    },
    {
      code: 'BURGER798',
      title: 'Burger & Pizza Flash Sale',
      description: 'Buy 1 Get 1 Free / 30% discount on gourmet double burgers and loaded cheese pizzas at Burger Hub.',
      discount: '30% OFF',
      minOrder: 'Min order ₹249',
      image: '/assets/burger.jpg',
      badge: 'FLASH SALE',
      color: 'border-yellow-400 text-yellow-300',
    },
    {
      code: 'CHICKEN453',
      title: 'Free Delivery Special',
      description: 'Zero delivery charges applied across all partnered restaurants for orders above ₹199.',
      discount: 'FREE DELIVERY',
      minOrder: 'Min order ₹199',
      image: '/assets/free-delivery-logo-with-bike-man-courier_1308-48827.avif',
      badge: 'ZERO FEE',
      color: 'border-emerald-400 text-emerald-400',
    },
  ];

  const handleApply = async (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setCouponCodeInput(code);
    toast(`Coupon code "${code}" copied and set!`, 'info');
    const applied = await applyCoupon(code);
    if (applied) {
      setIsCartDrawerOpen(true);
    }
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1715] border border-[#CAF509]/30 text-[#CAF509] text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Verified Savings
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Offers, Deals & Super Savers
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Apply active promo coupons during checkout for instant discounts on your order.
        </p>
      </div>

      {/* Grid of coupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="group bg-[#151110] border border-[#2E2623] hover:border-[#CAF509] rounded-3xl p-6 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#CAF509]/5 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${c.color} bg-black/40`}>
                  {c.badge}
                </span>
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#241D1A] border border-[#2E2623]">
                  <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                </div>
              </div>

              <span className="text-2xl font-black text-white block mb-1">{c.discount}</span>
              <h3 className="text-base font-bold text-gray-200 mb-2">{c.title}</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{c.description}</p>
            </div>

            <div className="pt-4 border-t border-[#231C1A] flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white bg-[#1C1715] px-3 py-1.5 rounded-xl border border-dashed border-[#3D332F]">
                <Tag className="w-3.5 h-3.5 text-[#CAF509]" />
                <span>{c.code}</span>
              </div>

              <button
                onClick={() => handleApply(c.code)}
                className="px-4 py-2 rounded-xl bg-[#CAF509] hover:bg-[#B6DD06] text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#CAF509]/15 transition-all active:scale-95"
              >
                {copiedCode === c.code ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Applied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Apply Code
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
