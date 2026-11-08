import React from 'react';
import { Tag, Sparkles, Copy, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const OffersSection: React.FC = () => {
  const { applyCoupon, setCouponCodeInput } = useCart();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const deals = [
    {
      code: 'FIRST50',
      title: '50% OFF First Order',
      subtitle: 'Flat 50% discount up to ₹150 for new users',
      tag: 'WELCOME DEAL',
      image: '/assets/chickenbiriyani.jpg',
      badgeColor: 'border-[#CAF509] text-[#CAF509]',
    },
    {
      code: 'BIRYANI145',
      title: 'Weekend Biryani Special',
      subtitle: 'Flat 40% OFF on Paradise & Nawabi Biryanis',
      tag: 'BIRYANI LOVERS',
      image: '/assets/paradise biriyani.avif',
      badgeColor: 'border-[#FF7A00] text-[#FF7A00]',
    },
    {
      code: 'SWEET30',
      title: 'Dessert Rush Treat',
      subtitle: '30% OFF on cakes, brownies and pastries',
      tag: 'SWEET TOOTH',
      image: '/assets/chocolate brownie.jpg',
      badgeColor: 'border-pink-500 text-pink-400',
    },
    {
      code: 'CHICKEN453',
      title: 'Free Delivery Special',
      subtitle: 'Zero delivery charges on all orders above ₹199',
      tag: 'NO DELIVERY FEE',
      image: '/assets/free-delivery-logo-with-bike-man-courier_1308-48827.avif',
      badgeColor: 'border-emerald-400 text-emerald-400',
    },
  ];

  const handleCopyAndApply = async (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setCouponCodeInput(code);
    toast(`Coupon code ${code} copied to clipboard!`, 'info');
    await applyCoupon(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <section className="py-12 bg-[#0D0B0A] border-b border-[#2E2623]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#CAF509] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Special Offers & Deals
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Top Deals of the Day
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal) => (
            <div
              key={deal.code}
              className="group relative bg-[#151110] border border-[#2E2623] hover:border-[#CAF509]/50 rounded-3xl p-5 overflow-hidden transition-all hover:scale-[1.02] shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${deal.badgeColor} bg-black/40`}>
                  {deal.tag}
                </span>
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#2E2623]">
                  <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{deal.title}</h3>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">{deal.subtitle}</p>

              <div className="flex items-center justify-between pt-3 border-t border-[#231C1A]">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white bg-[#1F1917] px-3 py-1.5 rounded-lg border border-dashed border-[#3D332F]">
                  <Tag className="w-3.5 h-3.5 text-[#CAF509]" />
                  <span>{deal.code}</span>
                </div>

                <button
                  onClick={() => handleCopyAndApply(deal.code)}
                  className="px-3 py-1.5 rounded-lg bg-[#CAF509] hover:bg-[#B6DD06] text-black text-xs font-black flex items-center gap-1 transition-all"
                >
                  {copiedCode === deal.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Applied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Apply
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
