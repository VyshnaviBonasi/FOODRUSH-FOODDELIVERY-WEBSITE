import React, { useEffect, useState } from 'react';
import { Bike, MapPin, Store, Navigation, CheckCircle2 } from 'lucide-react';

interface LiveRouteMapProps {
  orderStatus: string;
  restaurantName: string;
  courierName?: string;
  deliveryAddress: string;
}

export const LiveRouteMap: React.FC<LiveRouteMapProps> = ({
  orderStatus,
  restaurantName,
  courierName = 'Rajesh Kumar (TVS Raider)',
  deliveryAddress,
}) => {
  // Progress along the route from 0% (at restaurant) to 100% (at customer)
  const [progress, setProgress] = useState(35);

  useEffect(() => {
    if (orderStatus === 'OUT_FOR_DELIVERY') {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : 90));
      }, 3000);
      return () => clearInterval(interval);
    } else if (orderStatus === 'DELIVERED') {
      setProgress(100);
    } else {
      setProgress(10);
    }
  }, [orderStatus]);

  return (
    <div className="rounded-3xl bg-[#151110] border border-[#2E2623] p-6 overflow-hidden relative">
      {/* Simulation banner */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#CAF509]" />
          <h4 className="text-sm font-bold text-white">Live Courier Dispatch Tracker</h4>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#1F1917] border border-[#3D332F] text-[10px] font-mono text-gray-400">
          Simulated Demonstration Route
        </span>
      </div>

      {/* Visual Road Canvas / Diagram */}
      <div className="relative h-44 rounded-2xl bg-[#0D0B0A] border border-[#231C1A] p-4 flex flex-col justify-between overflow-hidden">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ backgroundImage: 'radial-gradient(#CAF509 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        {/* Route Line */}
        <div className="relative z-10 w-full top-1/2 -translate-y-1/2 px-8">
          <div className="h-2 w-full bg-[#261E1C] rounded-full relative">
            {/* Active travelled route */}
            <div
              className="h-full bg-gradient-to-r from-[#FF7A00] to-[#CAF509] rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />

            {/* Courier bike marker moving */}
            <div
              className="absolute -top-4 -translate-x-1/2 transition-all duration-1000 flex flex-col items-center"
              style={{ left: `${progress}%` }}
            >
              <div className="w-9 h-9 rounded-full bg-[#CAF509] text-black shadow-lg shadow-[#CAF509]/30 flex items-center justify-center animate-pulse">
                <Bike className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold text-[#CAF509] whitespace-nowrap mt-1 bg-black/80 px-1.5 rounded">
                {progress === 100 ? 'Arrived!' : `${Math.round(progress)}% En Route`}
              </span>
            </div>
          </div>
        </div>

        {/* Start Point: Restaurant */}
        <div className="relative z-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#241B18] border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-[11px] truncate max-w-[140px]">{restaurantName}</p>
              <p className="text-[10px] text-gray-500">Pickup Kitchen</p>
            </div>
          </div>

          {/* End Point: Customer */}
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="font-bold text-white text-[11px] truncate max-w-[140px]">Customer Doorstep</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[140px]">{deliveryAddress}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#1B2418] border border-[#CAF509]/40 text-[#CAF509] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Operational Metrics */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#231C1A] text-xs">
        <div>
          <span className="text-gray-500 text-[10px] block">Assigned Partner</span>
          <span className="font-bold text-white truncate block">{courierName}</span>
        </div>
        <div>
          <span className="text-gray-500 text-[10px] block">Remaining Distance</span>
          <span className="font-bold text-[#CAF509]">
            {progress >= 100 ? '0.0 km' : `${((100 - progress) * 0.04).toFixed(1)} km`}
          </span>
        </div>
        <div>
          <span className="text-gray-500 text-[10px] block">Est. Arrival Time</span>
          <span className="font-bold text-white">
            {progress >= 100 ? 'Delivered' : `${Math.ceil((100 - progress) * 0.2)} mins`}
          </span>
        </div>
      </div>
    </div>
  );
};
