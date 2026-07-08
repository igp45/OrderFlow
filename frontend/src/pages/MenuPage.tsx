import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { menuApi } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import MenuItemCard from '../components/MenuItemCard';
import MenuItemModal from '../components/MenuItemModal';
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

const HEADLINE_WORDS = ['What', 'are', 'you', 'craving', 'today?'];
const SUB = 'Order your favourites in seconds — hot, fresh, and ready for pickup';

function HeroSection() {
  const [visibleWords, setVisibleWords] = useState(0);
  const [subVisible, setSubVisible] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    HEADLINE_WORDS.forEach((_, i) => {
      setTimeout(() => setVisibleWords(i + 1), 300 + i * 160);
    });
    setTimeout(() => setSubVisible(true), 300 + HEADLINE_WORDS.length * 160 + 100);
    setTimeout(() => setPillsVisible(true), 300 + HEADLINE_WORDS.length * 160 + 350);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #F97316, #EA580C, #B91C1C, #9A3412, #F97316)',
        backgroundSize: '300% 300%',
        animation: 'hero-gradient 9s ease infinite',
      }} />
      {/* Dot overlay */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }} />

      {/* Two-column layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative flex items-center gap-6"
        style={{ minHeight: 'clamp(270px, 42vw, 370px)' }}>

        {/* ── Left: text content ── */}
        <div className="flex-1 py-8 sm:py-10 min-w-0">
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            borderRadius: 99, padding: '5px 14px', marginBottom: 14,
            border: '1px solid rgba(255,255,255,0.22)',
            animation: 'slide-up 0.4s ease 0.1s both',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
              🔥 FRESH & MADE TO ORDER
            </span>
          </div>

          {/* Word-flow headline */}
          <h1 className="font-black text-white leading-tight" style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            marginBottom: 12,
            textShadow: '0 2px 20px rgba(0,0,0,0.25)',
            display: 'flex', flexWrap: 'wrap', gap: '0 10px',
          }}>
            {HEADLINE_WORDS.map((word, i) => (
              <span key={i} style={{
                display: 'inline-block',
                opacity: i < visibleWords ? 1 : 0,
                transform: i < visibleWords ? 'translateY(0)' : 'translateY(18px)',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
              }}>
                {word}
              </span>
            ))}
          </h1>

          {/* Sub text */}
          <p style={{
            color: 'rgba(255,255,255,0.82)', fontSize: 14, marginBottom: 20,
            maxWidth: 340, lineHeight: 1.65,
            opacity: subVisible ? 1 : 0,
            transform: subVisible ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}>
            {SUB}
          </p>

          {/* Stat pills */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            opacity: pillsVisible ? 1 : 0,
            transform: pillsVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}>
            {[{ icon: '🍽️', label: '24+ Items' }, { icon: '⚡', label: 'Ready Fast' }, { icon: '🟢', label: 'Open Now' }].map(({ icon, label }) => (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                borderRadius: 99, padding: '6px 14px',
                color: 'white', fontSize: 12, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                {icon} {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: burger photo ── */}
        <div className="flex-shrink-0 flex items-center justify-center py-8"
          style={{ width: 'clamp(150px, 34vw, 290px)' }}>
          <div style={{ position: 'relative', animation: 'float 5s ease-in-out infinite', width: '100%' }}>

            {/* Outer warm glow */}
            <div style={{
              position: 'absolute', inset: -24,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,180,50,0.35) 0%, rgba(249,115,22,0.15) 45%, transparent 72%)',
              filter: 'blur(2px)',
            }} />

            {/* Pulsing ring */}
            <div style={{
              position: 'absolute', inset: -10,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.2)',
            }} />

            {/* Photo circle */}
            <div style={{
              width: 'clamp(150px, 34vw, 280px)',
              height: 'clamp(150px, 34vw, 280px)',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '6px solid rgba(255,255,255,0.6)',
              boxShadow: '0 0 0 3px rgba(255,255,255,0.18), 0 28px 80px rgba(0,0,0,0.55)',
              position: 'relative',
            }}>
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=95"
                alt="Classic Cheeseburger"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0" style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
          <path d="M0 40L1440 40L1440 0C1200 34 840 40 720 28C540 14 180 0 0 18L0 40Z" fill="var(--bg)" />
        </svg>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
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
              <button onClick={() => setHistoryOpen(true)} className="btn btn-ghost text-sm" style={{ padding: '8px 12px' }}>
                📋 <span className="hidden sm:inline">My Orders</span>
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
      <HeroSection />

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
              {grouped[category].map(item => <MenuItemCard key={item.id} item={item} onViewDetails={setSelectedItem} />)}
            </div>
          </section>
        ))}
      </main>

      <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
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
