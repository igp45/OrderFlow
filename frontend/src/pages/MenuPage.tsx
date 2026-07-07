import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { menuApi } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import MenuItemCard from '../components/MenuItemCard';
import CartDrawer from '../components/CartDrawer';
import DarkModeToggle from '../components/DarkModeToggle';
import type { MenuItem } from '../types';

interface SavedOrder { id: string; orderNumber: number; createdAt: string; }

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton w-full h-44" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="flex justify-between items-center mt-2">
          <div className="skeleton h-7 w-16" />
          <div className="skeleton h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const itemCount = useCartStore(s => s.itemCount());

  const { data: menuItems = [], isLoading, isError } = useQuery({
    queryKey: ['menu'],
    queryFn: menuApi.getAll,
  });

  useEffect(() => {
    setSavedOrders(JSON.parse(localStorage.getItem('of_orders') || '[]'));
  }, []);

  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category))).sort()];
  const filtered = activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory);

  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>OrderFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            {savedOrders.length > 0 && (
              <button onClick={() => setHistoryOpen(true)} className="btn btn-ghost text-sm" style={{ padding: '8px 14px' }}>
                📋 My Orders
              </button>
            )}
            <button onClick={() => setCartOpen(true)} className="btn btn-primary relative text-sm" style={{ padding: '8px 16px' }}>
              🛒 Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce-in">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="max-w-5xl mx-auto px-4 py-10 relative">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">What are you craving? 🔥</h1>
          <p className="text-orange-100 text-base">Fresh food, made to order — ready in minutes</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-[61px] z-20 py-3" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                style={activeCategory === cat
                  ? { background: 'var(--accent)', color: 'white' }
                  : { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {isError && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">😕</p>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>Failed to load menu</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Please refresh the page</p>
          </div>
        )}

        {!isLoading && !isError && Object.keys(grouped).sort().map(category => (
          <section key={category} className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3" style={{ color: 'var(--text)' }}>
              <span className="w-1 h-6 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
              {category}
              <span className="text-sm font-normal" style={{ color: 'var(--text-3)' }}>({grouped[category].length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[category].map(item => <MenuItemCard key={item.id} item={item} />)}
            </div>
          </section>
        ))}
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Order History Panel */}
      <>
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${historyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setHistoryOpen(false)}
        />
        <div
          className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col transition-transform duration-300 ease-out ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>My Orders</h2>
            <button onClick={() => setHistoryOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {savedOrders.length === 0 ? (
              <p className="text-center py-12 text-sm" style={{ color: 'var(--text-3)' }}>No previous orders</p>
            ) : savedOrders.map(o => (
              <Link key={o.id} to={`/order/${o.id}`} onClick={() => setHistoryOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>Order #{o.orderNumber}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {new Date(o.createdAt).toLocaleDateString()} at {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span style={{ color: 'var(--accent)' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </>
    </div>
  );
}
