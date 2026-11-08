import React from 'react';
import { Search, Sparkles, Clock, ShieldCheck, Zap } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (term: string) => void;
  onOpenAiConcierge: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onOpenAiConcierge }) => {
  const [localSearch, setLocalSearch] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      onSearch(localSearch.trim());
    }
  };

  const quickPills = ['Biryani', 'Burgers', 'Cakes', 'Pizza', 'South Indian', 'Kebabs'];

  return (
    <section className="relative overflow-hidden bg-[#0D0B0A] py-16 lg:py-24 border-b border-[#2E2623]">
      {/* Background image overlay */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-luminosity filter blur-xs"
        style={{ backgroundImage: `url('/assets/hero.jpeg')` }}
      />
      
      {/* Radial lighting glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#CAF509]/15 via-[#FF7A00]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1715] border border-[#CAF509]/30 text-[#CAF509] text-xs font-bold tracking-wide uppercase mb-6 shadow-md shadow-[#CAF509]/5">
            <Zap className="w-3.5 h-3.5 fill-[#CAF509]" />
            FoodRush X · Turbo Hyperlocal Delivery
          </div>

          {/* Heading preserving original wording */}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Delicious Food <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CAF509] via-lime-200 to-[#FF7A00]">
              Delivered to Your Doorstep
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 font-normal mb-8 max-w-2xl leading-relaxed">
            Order from authentic legacy restaurants, gourmet kitchens and trending bakeries near you with instant real-time kitchen tracking.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Enter your location or favourite dish..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#181311] border border-[#2E2623] text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509] focus:ring-2 focus:ring-[#CAF509]/20 transition-all text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl bg-[#CAF509] hover:bg-[#B6DD06] text-black font-extrabold text-sm tracking-wide shadow-lg shadow-[#CAF509]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Search
            </button>
          </form>

          {/* Quick pills & AI concierge prompt */}
          <div className="flex flex-wrap items-center gap-2 mb-10">
            <span className="text-xs text-gray-400 font-semibold mr-1">Popular:</span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                onClick={() => onSearch(pill)}
                className="px-3 py-1 rounded-full bg-[#1C1715] hover:bg-[#2A2320] border border-[#2E2623] text-xs text-gray-300 hover:text-[#CAF509] transition-colors"
              >
                {pill}
              </button>
            ))}
            <button
              onClick={onOpenAiConcierge}
              className="px-3 py-1 rounded-full bg-[#CAF509]/10 border border-[#CAF509]/40 text-[#CAF509] text-xs font-bold flex items-center gap-1.5 hover:bg-[#CAF509]/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI Genie
            </button>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#231C1A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1C1715] border border-[#2E2623] flex items-center justify-center text-[#CAF509]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">20-30 Mins</p>
                <p className="text-[11px] text-gray-400">Avg Delivery Speed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1C1715] border border-[#2E2623] flex items-center justify-center text-[#FF7A00]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">100% Verified</p>
                <p className="text-[11px] text-gray-400">Hygiene & Safety</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1C1715] border border-[#2E2623] flex items-center justify-center text-[#CAF509]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Smart Match</p>
                <p className="text-[11px] text-gray-400">AI Concierge Engine</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
