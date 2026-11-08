import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CustomerHome } from './pages/CustomerHome';
import { RestaurantListPage } from './pages/RestaurantListPage';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { OrdersPage } from './pages/OrdersPage';
import { OffersPage } from './pages/OffersPage';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { DeliveryDashboard } from './pages/DeliveryDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './pages/CheckoutModal';
import { AiConciergeModal } from './components/AiConciergeModal';
import type { Restaurant } from './types';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setCurrentTab('restaurant-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (orderId: string) => {
    setCurrentTab('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0B0A] text-white">
      {/* Universal Navbar with Role Switcher & Cart */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAiConcierge={() => setIsAiConciergeOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <CustomerHome
            onSelectRestaurant={handleSelectRestaurant}
            onOpenAiConcierge={() => setIsAiConciergeOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {currentTab === 'restaurants' && (
          <RestaurantListPage
            onSelectRestaurant={handleSelectRestaurant}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {currentTab === 'restaurant-detail' && selectedRestaurant && (
          <RestaurantDetail
            restaurant={selectedRestaurant}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'offers' && <OffersPage />}

        {currentTab === 'orders' && <OrdersPage />}

        {currentTab === 'restaurant-dashboard' && <RestaurantDashboard />}

        {currentTab === 'delivery-dashboard' && <DeliveryDashboard />}

        {currentTab === 'admin-dashboard' && <AdminDashboard />}
      </main>

      {/* Slide-out Cart Drawer */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* AI Food Concierge Modal */}
      <AiConciergeModal
        isOpen={isAiConciergeOpen}
        onClose={() => setIsAiConciergeOpen(false)}
        onSelectRestaurant={handleSelectRestaurant}
      />

      {/* Universal Footer */}
      <Footer onNavigate={(tab) => {
        setCurrentTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
