import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi } from '../lib/api';
import socket from '../lib/socket';
import DarkModeToggle from '../components/DarkModeToggle';
import type { Order, OrderStatus } from '../types';

const ACTIVE: OrderStatus[] = ['PENDING', 'PREPARING', 'READY'];

const COL_META = {
  PENDING:   { label: 'New Orders',  dot: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  next: 'Start Preparing', nextColor: '#F59E0B' },
  PREPARING: { label: 'Preparing',   dot: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  next: 'Mark Ready',      nextColor: '#3B82F6' },
  READY:     { label: 'Ready',       dot: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  next: 'Complete',        nextColor: '#10B981' },
};

function playAlert() {
  try {
    const ctx = new AudioContext();
    [880, 1100, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.12);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.12);
    });
  } catch { /* AudioContext blocked — user hasn't interacted yet */ }
}

function OrderCard({ order, onAdvance }: { order: Order; onAdvance: () => void }) {
  const meta = COL_META[order.status as keyof typeof COL_META];
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = order.status === 'PENDING' && elapsed >= 5;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200"
      style={{ background: meta.bg, border: `1.5px solid ${isUrgent ? '#EF4444' : meta.border}`, boxShadow: isUrgent ? '0 0 0 2px rgba(239,68,68,0.2)' : 'none' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black" style={{ color: '#fff' }}>#{order.orderNumber}</span>
          {isUrgent && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">URGENT</span>}
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#9CA3AF' }}>
          {elapsed}m ago
        </span>
      </div>

      <ul className="space-y-1.5">
        {order.items.map(item => (
          <li key={item.id} className="flex justify-between items-center text-sm">
            <span className="font-semibold" style={{ color: '#E5E7EB' }}>
              <span className="font-black" style={{ color: meta.dot }}>×{item.quantity}</span> {item.menuItem.name}
            </span>
            <span className="text-xs" style={{ color: '#6B7280' }}>{item.menuItem.category}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="text-xs italic rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
          📝 {order.notes}
        </p>
      )}

      {order.status !== 'READY' ? (
        <button onClick={onAdvance}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: meta.nextColor, color: '#fff' }}>
          {meta.next} →
        </button>
      ) : (
        <button onClick={onAdvance}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff' }}>
          ✓ Complete Order
        </button>
      )}
    </div>
  );
}

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const audioUnlocked = useRef(false);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['kitchen-orders'],
    queryFn: () => [] as Order[],
  });

  const { mutate: advance } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: updated => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev =>
        (prev ?? []).map(o => o.id === updated.id ? updated : o).filter(o => ACTIVE.includes(o.status))
      );
      const labels: Record<string, string> = { PREPARING: 'Started preparing', READY: 'Marked as ready 🔔', COMPLETED: 'Order completed ✓' };
      toast.success(labels[updated.status] || 'Status updated');
    },
  });

  const NEXT_STATUS: Record<string, OrderStatus> = { PENDING: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED' };

  useEffect(() => {
    const handleNew = (order: Order) => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev => {
        if ((prev ?? []).some(o => o.id === order.id)) return prev!;
        return [order, ...(prev ?? [])];
      });
      if (audioUnlocked.current) playAlert();
      setNewIds(prev => new Set(prev).add(order.id));
      setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(order.id); return s; }), 4000);
      toast('🆕 New order arrived!', { icon: '🔔', style: { background: '#F59E0B', color: '#fff' } });
    };
    const handleUpdated = (order: Order) => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev =>
        (prev ?? []).map(o => o.id === order.id ? order : o).filter(o => ACTIVE.includes(o.status))
      );
    };
    socket.on('order:new', handleNew);
    socket.on('order:statusUpdated', handleUpdated);
    return () => { socket.off('order:new', handleNew); socket.off('order:statusUpdated', handleUpdated); };
  }, [queryClient]);

  type ActiveStatus = 'PENDING' | 'PREPARING' | 'READY';
  const cols: Record<ActiveStatus, Order[]> = { PENDING: orders.filter(o => o.status === 'PENDING'), PREPARING: orders.filter(o => o.status === 'PREPARING'), READY: orders.filter(o => o.status === 'READY') };
  const totalActive = orders.length;

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0C', color: '#fff' }}
      onClick={() => { audioUnlocked.current = true; }}>
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1E1E24', background: '#111116' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍🍳</span>
          <div>
            <h1 className="font-black text-lg text-white">Kitchen Display</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Click anywhere to enable sound alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalActive > 0 && (
            <span className="text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)' }}>
              {totalActive} active
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: '#6B7280' }}>Live</span>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4" style={{ color: '#374151' }}>
          <span className="text-7xl">🍳</span>
          <p className="text-xl font-bold text-white">All caught up!</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>New orders will appear here instantly</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5">
          {(Object.keys(cols) as ActiveStatus[]).map(status => {
            const meta = COL_META[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.dot }} />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>{meta.label}</h2>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#1E1E24', color: '#6B7280' }}>
                    {cols[status].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {cols[status].length === 0 ? (
                    <div className="rounded-2xl p-8 text-center text-sm" style={{ border: '2px dashed #1E1E24', color: '#374151' }}>
                      Empty
                    </div>
                  ) : cols[status].map((order: Order) => (
                    <div key={order.id} className={`transition-all duration-500 ${newIds.has(order.id) ? 'ring-2 ring-orange-400 rounded-2xl' : ''}`}>
                      <OrderCard order={order} onAdvance={() => advance({ id: order.id, status: NEXT_STATUS[order.status] as OrderStatus })} />
                    </div>
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
