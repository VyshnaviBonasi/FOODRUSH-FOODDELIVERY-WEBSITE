import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import type { DeliveryAddress } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, restaurant, coupon, clearCart, estimatedTotal } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: user?.name || 'Bonasi Vyshnavi',
    street: 'Apartment 402, Green Glen Residency, Anna Nagar',
    landmark: 'Near Roundtana Park',
    city: 'Chennai',
    pincode: '600040',
    phone: user?.phone || '+91 9876543299',
  });

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [instructions, setInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  if (!isOpen || !restaurant || items.length === 0) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.fullName.trim() || !address.street.trim() || !address.phone.trim()) {
      toast('Please complete all required address fields', 'error');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderPayload = {
        restaurantId: restaurant.id,
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          variantId: i.customization?.variant?.id,
          addonIds: i.customization?.addons?.map((a) => a.id),
        })),
        couponCode: coupon?.code,
        deliveryAddress: address,
        paymentMethod,
        instructions: instructions.trim() || undefined,
        idempotencyKey: 'idem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      };

      const res = await api.orders.create(orderPayload);
      clearCart();
      toast(`Order ${res.order.id} confirmed! Kitchen has started preparing.`, 'success');
      onOrderSuccess(res.order.id);
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to place order', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#120E0D] border border-[#2E2623] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-[#231C1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#CAF509] text-black font-black flex items-center justify-center">
              FX
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Secure Checkout</h2>
              <p className="text-xs text-gray-400">
                Ordering from {restaurant.name} · Est. {restaurant.deliveryTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1715] hover:bg-[#2A2320] text-gray-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handlePlaceOrder} className="p-6 space-y-6">
          {/* Delivery Address Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#CAF509]" />
                Delivery Address
              </label>
              <span className="text-[11px] text-[#CAF509] font-semibold">Anna Nagar Sector</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181311] border border-[#2E2623] text-xs text-white focus:outline-none focus:border-[#CAF509]"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181311] border border-[#2E2623] text-xs text-white focus:outline-none focus:border-[#CAF509]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-gray-400 block mb-1">Street Address / Flat / Floor</label>
                <input
                  type="text"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181311] border border-[#2E2623] text-xs text-white focus:outline-none focus:border-[#CAF509]"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={address.landmark || ''}
                  onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181311] border border-[#2E2623] text-xs text-white focus:outline-none focus:border-[#CAF509]"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181311] border border-[#2E2623] text-xs text-white focus:outline-none focus:border-[#CAF509]"
                />
              </div>
            </div>
          </div>

          {/* Delivery Instructions */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              Delivery Instructions for Rider
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Leave with security guard, don't ring bell..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181311] border border-[#2E2623] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509]"
            />
          </div>

          {/* Payment Method Selector (Safe Demonstration Mode) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Select Payment Mode
              </label>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                Safe Demo Sandbox Mode
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-[#1C1714] border-[#CAF509] text-white shadow-sm'
                    : 'bg-[#181311] border-[#2E2623] text-gray-400 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="accent-[#CAF509]"
                />
                <Smartphone className="w-4 h-4 text-[#CAF509]" />
                <span className="text-xs font-bold">UPI / QR (Instant)</span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-[#1C1714] border-[#CAF509] text-white shadow-sm'
                    : 'bg-[#181311] border-[#2E2623] text-gray-400 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="accent-[#CAF509]"
                />
                <Banknote className="w-4 h-4 text-[#CAF509]" />
                <span className="text-xs font-bold">Cash on Delivery</span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-[#1C1714] border-[#CAF509] text-white shadow-sm'
                    : 'bg-[#181311] border-[#2E2623] text-gray-400 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                  className="accent-[#CAF509]"
                />
                <CreditCard className="w-4 h-4 text-[#CAF509]" />
                <span className="text-xs font-bold">Demo Debit / Card</span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentMethod === 'NETBANKING'
                    ? 'bg-[#1C1714] border-[#CAF509] text-white shadow-sm'
                    : 'bg-[#181311] border-[#2E2623] text-gray-400 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'NETBANKING'}
                  onChange={() => setPaymentMethod('NETBANKING')}
                  className="accent-[#CAF509]"
                />
                <ShieldCheck className="w-4 h-4 text-[#CAF509]" />
                <span className="text-xs font-bold">NetBanking</span>
              </label>
            </div>
          </div>

          {/* Final Total Notice */}
          <div className="p-4 rounded-2xl bg-[#161F12] border border-[#CAF509]/30 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-300">Final Authoritative Total:</span>
              <p className="text-lg font-black text-[#CAF509]">₹{estimatedTotal.toFixed(2)}</p>
            </div>
            <div className="text-right text-[11px] text-gray-400">
              <span>{items.length} dishes from {restaurant.name}</span>
              <p className="text-[#CAF509] font-medium">Free cancellation before kitchen confirmation</p>
            </div>
          </div>

          {/* Place Order CTA */}
          <button
            type="submit"
            disabled={isPlacingOrder}
            className="w-full py-4 px-6 rounded-2xl bg-[#CAF509] hover:bg-[#B6DD06] disabled:opacity-50 text-black font-black text-sm tracking-wide shadow-xl shadow-[#CAF509]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            {isPlacingOrder ? (
              <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Confirm & Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
