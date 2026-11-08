import React, { useState } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Search, 
  Sparkles, 
  User as UserIcon, 
  Menu, 
  X,
  ChefHat,
  Bike,
  ShieldCheck,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAiConcierge: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAiConcierge,
  searchQuery,
  setSearchQuery,
}) => {
  const { user, switchRole, logout } = useAuth();
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: { role: UserRole; email?: string; label: string; icon: React.ReactNode; desc: string }[] = [
    { role: 'customer', email: 'vyshnavi@foodrush.com', label: 'Customer', icon: <UserIcon className="w-4 h-4" />, desc: 'Order food, track live & use AI Genie' },
    { role: 'restaurant', email: 'partner@paradise.com', label: 'Restaurant Partner', icon: <ChefHat className="w-4 h-4" />, desc: 'Paradise Biryani KDS & Menu control' },
    { role: 'delivery', email: 'courier@foodrush.com', label: 'Delivery Partner', icon: <Bike className="w-4 h-4" />, desc: 'Rajesh Kumar: Orders dispatch & map' },
    { role: 'admin', email: 'admin@foodrush.com', label: 'Chief Admin', icon: <ShieldCheck className="w-4 h-4" />, desc: 'Platform analytics, audit logs & settlements' },
  ];

  const handleRoleSelect = async (r: UserRole, email?: string) => {
    setRoleDropdownOpen(false);
    await switchRole(r, email);
    if (r === 'restaurant') setCurrentTab('restaurant-dashboard');
    else if (r === 'delivery') setCurrentTab('delivery-dashboard');
    else if (r === 'admin') setCurrentTab('admin-dashboard');
    else setCurrentTab('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0D0B0A]/95 backdrop-blur-md border-b border-[#2E2623]">
      {/* Top Experience Persona Switcher Bar */}
      <div className="bg-[#151110] border-b border-[#231C1A] px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-[#CAF509] animate-pulse"></span>
            <span className="font-semibold text-white">FoodRush X Ecosystem:</span>
            <span className="hidden sm:inline">Switch views instantly to test all roles:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {roles.map((r) => {
              const isActive = user?.role === r.role && (!r.email || user.email === r.email);
              return (
                <button
                  key={r.label}
                  onClick={() => handleRoleSelect(r.role, r.email)}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                    isActive
                      ? 'bg-[#CAF509] text-black font-bold shadow-sm'
                      : 'bg-[#1F1917] hover:bg-[#2A2320] text-gray-300'
                  }`}
                  title={r.desc}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#CAF509] to-[#FF7A00] p-0.5 flex items-center justify-center shadow-lg shadow-[#CAF509]/10 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0D0B0A] rounded-[10px] flex items-center justify-center">
                <span className="text-[#CAF509] font-black text-xl tracking-tighter">FX</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black tracking-tight text-white">FoodRush</span>
                <span className="text-2xl font-black text-[#CAF509]">X</span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#FF7A00] -mt-1">Next-Gen FoodTech</p>
            </div>
          </div>

          {/* Location Chip */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181311] border border-[#2E2623] text-xs text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-[#CAF509]" />
            <span className="font-semibold text-white">Anna Nagar, Chennai</span>
            <span className="text-gray-500">| 25-35m</span>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes (Biryani, Burger, Dosa, Cake)..."
              className="w-full pl-10 pr-4 py-2 bg-[#181311] border border-[#2E2623] rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509] focus:ring-1 focus:ring-[#CAF509] transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setCurrentTab('home')}
              className={`text-sm font-semibold transition-colors ${
                currentTab === 'home' ? 'text-[#CAF509]' : 'text-gray-300 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('restaurants')}
              className={`text-sm font-semibold transition-colors ${
                currentTab === 'restaurants' ? 'text-[#CAF509]' : 'text-gray-300 hover:text-white'
              }`}
            >
              Restaurants
            </button>
            <button
              onClick={() => setCurrentTab('offers')}
              className={`text-sm font-semibold transition-colors ${
                currentTab === 'offers' ? 'text-[#CAF509]' : 'text-gray-300 hover:text-white'
              }`}
            >
              Offers
            </button>
            <button
              onClick={() => setCurrentTab('orders')}
              className={`text-sm font-semibold transition-colors ${
                currentTab === 'orders' ? 'text-[#CAF509]' : 'text-gray-300 hover:text-white'
              }`}
            >
              My Orders
            </button>
          </nav>

          {/* Right Actions: AI Concierge & Cart & Profile */}
          <div className="flex items-center gap-3">
            {/* AI Food Concierge Trigger Button */}
            <button
              onClick={onOpenAiConcierge}
              className="relative px-3.5 py-2 rounded-full bg-gradient-to-r from-[#CAF509]/20 to-[#FF7A00]/20 border border-[#CAF509]/50 text-white flex items-center gap-2 text-xs font-bold hover:scale-105 hover:border-[#CAF509] shadow-lg shadow-[#CAF509]/10 transition-all group"
            >
              <Sparkles className="w-4 h-4 text-[#CAF509] animate-spin group-hover:rotate-45" style={{ animationDuration: '4s' }} />
              <span className="hidden sm:inline">AI Food Genie</span>
              <span className="bg-[#CAF509] text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">NEW</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2.5 rounded-xl bg-[#1C1715] border border-[#2E2623] hover:border-[#CAF509] text-white transition-all flex items-center justify-center group"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-gray-200 group-hover:text-[#CAF509] transition-colors" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#CAF509] text-black text-xs font-black flex items-center justify-center animate-bounce">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#1C1715] border border-[#2E2623] hover:border-gray-600 transition-all text-xs"
              >
                <img
                  src={user?.avatar || '/assets/user-sign.jpg'}
                  alt={user?.name || 'User'}
                  className="w-7 h-7 rounded-lg object-cover"
                />
                <span className="font-semibold text-gray-200 hidden xl:inline max-w-[100px] truncate">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#181311] border border-[#2E2623] shadow-2xl p-2 z-50">
                  <div className="p-2 border-b border-[#2E2623] mb-1">
                    <p className="text-sm font-bold text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#CAF509]/10 text-[#CAF509] border border-[#CAF509]/30 text-[10px] font-bold rounded-md uppercase">
                      {user?.role} Mode
                    </span>
                  </div>

                  <div className="py-1">
                    {user?.role === 'restaurant' && (
                      <button
                        onClick={() => { setCurrentTab('restaurant-dashboard'); setRoleDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-[#251E1C] rounded-lg flex items-center gap-2"
                      >
                        <ChefHat className="w-4 h-4 text-[#CAF509]" />
                        Kitchen KDS Dashboard
                      </button>
                    )}
                    {user?.role === 'delivery' && (
                      <button
                        onClick={() => { setCurrentTab('delivery-dashboard'); setRoleDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-[#251E1C] rounded-lg flex items-center gap-2"
                      >
                        <Bike className="w-4 h-4 text-[#CAF509]" />
                        Delivery Partner Portal
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => { setCurrentTab('admin-dashboard'); setRoleDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-[#251E1C] rounded-lg flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#CAF509]" />
                        Admin Command Center
                      </button>
                    )}
                    <button
                      onClick={() => { setCurrentTab('orders'); setRoleDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-[#251E1C] rounded-lg"
                    >
                      My Orders & Live Timeline
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#2E2623]">
                    <button
                      onClick={() => { logout(); setRoleDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu collapse */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#2E2623] space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or restaurants..."
              className="w-full px-4 py-2 bg-[#181311] border border-[#2E2623] rounded-xl text-sm text-white mb-2"
            />
            <button
              onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-gray-200 hover:text-[#CAF509]"
            >
              Home
            </button>
            <button
              onClick={() => { setCurrentTab('restaurants'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-gray-200 hover:text-[#CAF509]"
            >
              Restaurants
            </button>
            <button
              onClick={() => { setCurrentTab('offers'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-gray-200 hover:text-[#CAF509]"
            >
              Offers & Discounts
            </button>
            <button
              onClick={() => { setCurrentTab('orders'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-gray-200 hover:text-[#CAF509]"
            >
              My Orders
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
