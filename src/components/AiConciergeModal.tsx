import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Leaf, 
  Drumstick, 
  Plus, 
  ArrowRight,
  Info,
  DollarSign,
  Users
} from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import type { Restaurant, MenuItem } from '../types';

interface AiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

export const AiConciergeModal: React.FC<AiConciergeModalProps> = ({
  isOpen,
  onClose,
  onSelectRestaurant,
}) => {
  const { addItem, setIsCartDrawerOpen } = useCart();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const samplePrompts = [
    'I need vegetarian dinner for two under ₹400, with a delivery time under 40 minutes.',
    'Royal Hyderabadi chicken biryani feast under ₹350',
    'Late night sweet cravings and cakes under ₹250',
    'South Indian breakfast meal with dosas under ₹200'
  ];

  const handleAsk = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    setQuery(userPrompt);
    setLoading(true);

    try {
      const data = await api.ai.queryConcierge(userPrompt);
      setResult(data);
    } catch (err: any) {
      toast(err.message || 'AI query failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComboToCart = (combo: any) => {
    for (const item of combo.items) {
      addItem(item.dish, combo.restaurant, undefined, item.quantity);
    }
    toast(`Added "${combo.title}" combo directly to your cart!`, 'success');
    onClose();
    setIsCartDrawerOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#120E0D] border border-[#2E2623] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-[#231C1A] flex items-center justify-between bg-gradient-to-r from-[#171210] to-[#1E1612]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#CAF509] to-[#FF7A00] p-0.5 shadow-lg shadow-[#CAF509]/20">
              <div className="w-full h-full bg-[#0D0B0A] rounded-[14px] flex items-center justify-center text-[#CAF509]">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">FoodRush X AI Genie</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#CAF509]/20 border border-[#CAF509]/40 text-[#CAF509] text-[10px] font-black uppercase">
                  Catalogue Intelligence
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Natural-language food discovery backed by verified restaurant records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1715] hover:bg-[#2A2320] text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="relative"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything: e.g. vegetarian dinner for two under ₹400..."
              className="w-full pl-5 pr-14 py-4 rounded-2xl bg-[#181311] border border-[#2E2623] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509] focus:ring-2 focus:ring-[#CAF509]/20 shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2.5 top-2.5 w-10 h-10 rounded-xl bg-[#CAF509] hover:bg-[#B6DD06] text-black font-black flex items-center justify-center disabled:opacity-50 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick prompts */}
          <div>
            <span className="text-xs font-bold text-gray-400 block mb-2">Try asking:</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleAsk(p)}
                  className="px-3 py-1.5 rounded-xl bg-[#181311] hover:bg-[#221B18] border border-[#261F1C] hover:border-[#CAF509]/40 text-xs text-gray-300 hover:text-white text-left transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full border-2 border-[#CAF509] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-white">Analyzing menu catalog & verifying live prices...</p>
              <p className="text-xs text-gray-400">Parsing dietary rules, delivery radius & budget constraints</p>
            </div>
          )}

          {/* AI Result View */}
          {result && !loading && (
            <div className="space-y-6 pt-2">
              {/* Intent Interpretation Tags */}
              <div className="p-4 rounded-2xl bg-[#181311] border border-[#2E2623]">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400">
                  <Info className="w-3.5 h-3.5 text-[#CAF509]" />
                  <span>Verified Constraints Applied:</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {result.interpretation.budget && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#1F1917] border border-[#3D332F] text-amber-300 font-bold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Budget: ₹{result.interpretation.budget}
                    </span>
                  )}
                  {result.interpretation.isVeg !== undefined && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#1F1917] border border-[#3D332F] text-emerald-400 font-bold flex items-center gap-1">
                      {result.interpretation.isVeg ? <Leaf className="w-3.5 h-3.5" /> : <Drumstick className="w-3.5 h-3.5" />}
                      {result.interpretation.isVeg ? 'Vegetarian Only' : 'Non-Vegetarian'}
                    </span>
                  )}
                  {result.interpretation.maxDeliveryTimeMinutes && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#1F1917] border border-[#3D332F] text-cyan-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Max Time: {result.interpretation.maxDeliveryTimeMinutes}m
                    </span>
                  )}
                  {result.interpretation.partySize && result.interpretation.partySize > 1 && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#1F1917] border border-[#3D332F] text-indigo-300 font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Serves: {result.interpretation.partySize} People
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                  {result.summaryMessage}
                </p>
              </div>

              {/* Curated Combos */}
              {result.combos && result.combos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Recommended Curated Sets
                  </h3>

                  {result.combos.map((combo: any) => (
                    <div
                      key={combo.id}
                      className="p-5 rounded-3xl bg-[#161210] border border-[#2E2623] hover:border-[#CAF509] transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-[#CAF509] tracking-wider">
                            {combo.restaurant.name}
                          </span>
                          <h4 className="text-lg font-bold text-white">{combo.title}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-[#CAF509]">₹{combo.totalPrice}</span>
                          <p className="text-[10px] text-emerald-400 font-semibold">{combo.budgetUtilization}</p>
                        </div>
                      </div>

                      {/* Items in combo */}
                      <div className="space-y-2 mb-4">
                        {combo.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#1B1614] border border-[#261E1C] text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.dish.image}
                                alt={item.dish.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-bold text-white">
                                  {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.dish.name}
                                </p>
                                <p className="text-[10px] text-gray-400">{item.reason}</p>
                              </div>
                            </div>
                            <span className="font-bold text-white">₹{item.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      {/* Matched criteria badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {combo.matchedCriteria.map((c: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#211B18] text-[10px] font-medium text-gray-300"
                          >
                            ✓ {c}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#231C1A]">
                        <p className="text-xs text-gray-400 max-w-[260px] line-clamp-2">
                          {combo.explanation}
                        </p>
                        <button
                          onClick={() => handleAddComboToCart(combo)}
                          className="px-4 py-2 rounded-xl bg-[#CAF509] hover:bg-[#B6DD06] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#CAF509]/10 transition-transform active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          Add Combo to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#231C1A] bg-[#151110] text-[11px] text-gray-400 flex items-center justify-between">
          <span>Powered by FoodRush X Semantic Decision Engine</span>
          <span>Zero hallucinations · Real prices only</span>
        </div>
      </div>
    </div>
  );
};
