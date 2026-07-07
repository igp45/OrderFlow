import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi, authApi } from '../lib/api';
import socket from '../lib/socket';
import DarkModeToggle from '../components/DarkModeToggle';
import type { Order, OrderStatus } from '../types';

const ACTIVE: OrderStatus[] = ['PENDING', 'PREPARING', 'READY'];

type ActiveStatus = 'PENDING' | 'PREPARING' | 'READY';

const COL_META: Record<ActiveStatus, { label: string; dot: string; accent: string; nextLabel: string }> = {
  PENDING:   { label: 'New Orders',  dot: '#F59E0B', accent: 'rgba(245,158,11,0.12)',  nextLabel: 'Start Preparing' },
  PREPARING: { label: 'Preparing',   dot: '#3B82F6', accent: 'rgba(59,130,246,0.12)',  nextLabel: 'Mark Ready' },
  READY:     { label: 'Ready',       dot: '#10B981', accent: 'rgba(16,185,129,0.12)', nextLabel: 'Complete Order' },
};

const NEXT_STATUS: Record<ActiveStatus, OrderStatus> = {
  PENDING: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED',
};

function playAlert() {
  try {
    const ctx = new AudioContext();
    [880, 1100, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.12);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.12);
    });
  } catch { /* user hasn't interacted yet */ }
}

function OrderCard({ order, onAdvance }: { order: Order; onAdvance: () => void }) {
  const status = order.status as ActiveStatus;
  const meta = COL_META[status];
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = status === 'PENDING' && elapsed >= 5;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200"
      style={{
        background: meta.accent,
        border: `1.5px solid ${isUrgent ? '#EF4444' : meta.dot}40`,
        boxShadow: isUrgent ? '0 0 0 2px rgba(239,68,68,0.25)' : 'none',
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>#{order.orderNumber}</span>
          {isUrgent && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">URGENT</span>
          )}
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
          {elapsed}m ago
        </span>
      </div>

      <ul className="space-y-1.5">
        {order.items.map(item => (
          <li key={item.id} className="flex justify-between items-center text-sm">
            <span className="font-semibold" style={{ color: 'var(--text)' }}>
              <span className="font-black" style={{ color: meta.dot }}>×{item.quantity}</span>{' '}
              {item.menuItem.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{item.menuItem.category}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="text-xs italic rounded-xl px-3 py-2" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
          📝 {order.notes}
        </p>
      )}

      <button
        onClick={onAdvance}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: status === 'READY' ? 'linear-gradient(135deg,#10B981,#059669)' : meta.dot }}
      >
        {meta.nextLabel} →
      </button>
    </div>
  );
}

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const audioUnlocked = useRef(false);

  const { mutate: logout } = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  // ✅ Load active orders from API on mount — persists across navigation
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['kitchen-orders'],
    queryFn: ordersApi.getActive,
    staleTime: 0,
  });

  const { mutate: advance } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: updated => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev =>
        (prev ?? []).map(o => o.id === updated.id ? updated : o)
          .filter(o => ACTIVE.includes(o.status))
      );
      const labels: Record<string, string> = {
        PREPARING: '🔥 Started preparing',
        READY: '✅ Marked as ready',
        COMPLETED: '✓ Order completed',
      };
      toast.success(labels[updated.status] ?? 'Updated');
    },
  });

  useEffect(() => {
    const handleNew = (order: Order) => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev => {
        if ((prev ?? []).some(o => o.id === order.id)) return prev!;
        return [order, ...(prev ?? [])];
      });
      if (audioUnlocked.current) playAlert();
      toast('🆕 New order arrived!', {
        icon: '🔔',
        style: { background: '#F59E0B', color: '#fff', fontWeight: '600' },
      });
    };

    const handleUpdated = (order: Order) => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev =>
        (prev ?? []).map(o => o.id === order.id ? order : o)
          .filter(o => ACTIVE.includes(o.status))
      );
    };

    socket.on('order:new', handleNew);
    socket.on('order:statusUpdated', handleUpdated);
    return () => {
      socket.off('order:new', handleNew);
      socket.off('order:statusUpdated', handleUpdated);
    };
  }, [queryClient]);

  const cols: Record<ActiveStatus, Order[]> = {
    PENDING:   orders.filter(o => o.status === 'PENDING'),
    PREPARING: orders.filter(o => o.status === 'PREPARING'),
    READY:     orders.filter(o => o.status === 'READY'),
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)' }}
      onClick={() => { audioUnlocked.current = true; }}
    >
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'var(--accent-soft)' }}>👨‍🍳</div>
            <div>
              <h1 className="font-black text-lg" style={{ color: 'var(--text)' }}>Kitchen Display</h1>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Click anywhere to enable sound alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {orders.length > 0 && (
              <span className="text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)30' }}>
                {orders.length} active
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Live</span>
            </div>
            <DarkModeToggle />
            <button
              onClick={() => logout()}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading orders…</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <span className="text-7xl">🍳</span>
          <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>All caught up!</p>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>New orders will appear here instantly</p>
        </div>
      )}

      {/* Columns */}
      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5">
          {(Object.keys(cols) as ActiveStatus[]).map(status => {
            const meta = COL_META[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
                    {meta.label}
                  </h2>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    {cols[status].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {cols[status].length === 0 ? (
                    <div className="rounded-2xl p-8 text-center text-sm" style={{ border: '2px dashed var(--border)', color: 'var(--text-3)' }}>
                      No orders
                    </div>
                  ) : cols[status].map((order: Order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAdvance={() => advance({ id: order.id, status: NEXT_STATUS[status] })}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
