import React from 'react';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#090706] border-t border-[#231C1A] text-gray-400 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white tracking-tight">FoodRush</span>
              <span className="text-2xl font-black text-[#CAF509]">X</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Delicious food delivered to your doorstep from premier restaurant partners, gourmet cloud kitchens and artisanal bakeries across Chennai.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>for food lovers</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#CAF509] transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('restaurants')} className="hover:text-[#CAF509] transition-colors">
                  All Restaurants
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('offers')} className="hover:text-[#CAF509] transition-colors">
                  Deals & Promo Codes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('orders')} className="hover:text-[#CAF509] transition-colors">
                  My Orders & Live Timeline
                </button>
              </li>
            </ul>
          </div>

          {/* Ecosystem experiences */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">FoodRush Ecosystem</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('restaurant-dashboard')} className="hover:text-[#CAF509] transition-colors">
                  Restaurant Partner & Kitchen KDS
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('delivery-dashboard')} className="hover:text-[#CAF509] transition-colors">
                  Delivery Partner Interface
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin-dashboard')} className="hover:text-[#CAF509] transition-colors">
                  Platform Admin Command Center
                </button>
              </li>
              <li>
                <span className="text-gray-500">API Documentation & Webhooks</span>
              </li>
            </ul>
          </div>

          {/* Contact details */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact & Support</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#CAF509]" />
                <span>support@foodrush.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#CAF509]" />
                <span>+91 9876543210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#CAF509]" />
                <span>Anna Nagar, Chennai, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#1C1614] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 FoodRush X. All rights reserved. Production Architecture Upgrade.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
