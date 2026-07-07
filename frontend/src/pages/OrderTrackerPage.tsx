import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi } from '../lib/api';
import socket from '../lib/socket';
import DarkModeToggle from '../components/DarkModeToggle';
import type { Order, OrderStatus } from '../types';

const STEPS: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];

const STEP_META: Record<OrderStatus, { label: string; icon: string; desc: string; color: string }> = {
  PENDING:   { label: 'Order Received',  icon: '📋', desc: 'We got your order!',          color: '#F59E0B' },
  PREPARING: { label: 'Being Prepared',  icon: '👨‍🍳', desc: 'Kitchen is on it',           color: '#3B82F6' },
  READY:     { label: 'Ready to Pickup', icon: '🎉', desc: 'Your food is ready!',          color: '#10B981' },
  COMPLETED: { label: 'Completed',       icon: '✅', desc: 'Enjoy your meal!',             color: '#6B7280' },
};

function SuccessAnimation() {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 4000); return () => clearTimeout(t); }, []);
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative flex flex-col items-center gap-4">
        {/* Confetti */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="absolute w-3 h-3 rounded-full"
            style={{
              background: ['#F97316','#10B981','#3B82F6','#F59E0B','#EC4899','#8B5CF6'][i % 6],
              left: `${(i % 4) * 30 - 45}px`,
              top: `${Math.floor(i / 4) * -20 - 20}px`,
              animation: `confetti-fall ${0.8 + i * 0.1}s ease-out ${i * 0.05}s forwards`,
            }} />
        ))}
        {/* Main circle */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: '#10B981', opacity: 0.3 }} />
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl animate-pop-in"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 0 40px rgba(16,185,129,0.4)' }}>
            🎉
          </div>
        </div>
        <div className="animate-fade-up text-center">
          <p className="text-2xl font-black text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Order Ready!</p>
          <p className="text-white/80 text-sm">Your food is ready for pickup 🍽️</p>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackerPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    const handler = (updated: Order) => {
      if (updated.id !== id) return;
      queryClient.setQueryData(['order', id], updated);
      if (updated.status === 'READY') {
        setShowSuccess(true);
        toast.success('🎉 Your order is ready for pickup!', { duration: 5000 });
      }
      if (updated.status === 'PREPARING') toast('👨‍🍳 Kitchen is preparing your order', { icon: '🔥' });
      if (updated.status === 'COMPLETED') toast.success('✅ Order completed. Enjoy!');
    };
    socket.on('order:statusUpdated', handler);
    return () => { socket.off('order:statusUpdated', handler); };
  }, [id, queryClient]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Loading your order…</p>
      </div>
    </div>
  );

  if (isError || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
      <p className="text-4xl">😕</p>
      <p className="font-semibold" style={{ color: 'var(--text)' }}>Order not found</p>
      <Link to="/" className="btn btn-primary">Back to menu</Link>
    </div>
  );

  const currentIndex = STEPS.indexOf(order.status);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {showSuccess && <SuccessAnimation />}

      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>←</Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">🍽️</span>
              <span className="font-black text-lg tracking-tight" style={{ color: 'var(--text)' }}>OrderFlow</span>
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Order Number Card */}
        <div className="card text-center py-8" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #EA580C 100%)' }}>
          <p className="text-sm font-semibold text-orange-100 mb-1 uppercase tracking-wider">Order Number</p>
          <p className="text-7xl font-black text-white tracking-tight">#{order.orderNumber}</p>
          <p className="text-orange-100 text-sm mt-2">
            Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Status Timeline */}
        <div className="card p-6">
          <h2 className="font-bold mb-6" style={{ color: 'var(--text)' }}>Order Status</h2>
          <div>
            {STEPS.map((step, i) => {
              const isDone = i < currentIndex;
              const isActive = i === currentIndex;
              const meta = STEP_META[step];
              return (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 transition-all duration-500 ${isActive ? 'animate-bounce-in' : ''}`}
                      style={{
                        background: isActive ? meta.color : isDone ? '#D1FAE5' : 'var(--surface-2)',
                        boxShadow: isActive ? `0 0 20px ${meta.color}55` : 'none',
                        transform: isActive ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >{meta.icon}</div>
                    {i < STEPS.length - 1 && (
                      <div className="w-0.5 h-8 mt-1 rounded-full transition-colors duration-500"
                        style={{ background: isDone ? '#10B981' : 'var(--border)' }} />
                    )}
                  </div>
                  <div className="pb-8 pt-2">
                    <p className="font-bold text-sm" style={{ color: isActive ? meta.color : isDone ? '#10B981' : 'var(--text-3)' }}>
                      {meta.label}
                      {isDone && ' ✓'}
                    </p>
                    {isActive && <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{meta.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="card p-6">
          <h2 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Order Summary</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={item.menuItem.imageUrl} alt={item.menuItem.name}
                  className="w-12 h-12 rounded-xl object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/48?text=🍽️'; }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.menuItem.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>×{item.quantity}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>₦{(item.unitPrice * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          {order.notes && (
            <div className="mt-4 p-3 rounded-xl text-sm italic" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
              📝 {order.notes}
            </div>
          )}
          <div className="flex justify-between items-center pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-2)' }}>Total</span>
            <span className="text-xl font-black" style={{ color: 'var(--text)' }}>₦{order.total.toFixed(2)}</span>
          </div>
        </div>

        <Link to="/" className="block text-center text-sm font-medium py-2 transition-all hover:opacity-70" style={{ color: 'var(--accent)' }}>
          ← Order more food
        </Link>
      </main>
    </div>
  );
}
