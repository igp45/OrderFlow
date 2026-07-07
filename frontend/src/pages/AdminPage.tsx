import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { dashboardApi, aiApi, menuApi, ordersApi, authApi } from '../lib/api';
import socket from '../lib/socket';
import DarkModeToggle from '../components/DarkModeToggle';
import type { Order, MenuItem, OrderStatus } from '../types';

const SITE_URL = import.meta.env.VITE_API_URL
  ? window.location.origin
  : window.location.origin;

function StatCard({ label, value, icon, sub, accent }: { label: string; value: string | number; icon: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`card p-5 flex flex-col gap-2 ${accent ? 'outline outline-2 outline-offset-2' : ''}`} style={accent ? { outlineColor: 'var(--accent)' } : {}}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'var(--accent-soft)' }}>{icon}</div>
        {sub && <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>{sub}</span>}
      </div>
      <p className="text-3xl font-black" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</p>
    </div>
  );
}

function MenuItemRow({ item, onToggle, onDelete }: { item: MenuItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl transition-all" style={{ background: 'var(--surface-2)' }}>
      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/48?text=🍽️'; }} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{item.category} · ₦{item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onToggle}
          className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
          style={item.available
            ? { background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }
            : { background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }
          }>
          {item.available ? '✓ Available' : '✗ Sold Out'}
        </button>
        <button onClick={onDelete} className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>🗑</button>
      </div>
    </div>
  );
}

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export default function AdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState<Record<string, number> | null>(null);

  const { mutate: logout } = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'qr'>('overview');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders', orderStatusFilter],
    queryFn: () => ordersApi.getAll(orderStatusFilter || undefined),
    enabled: activeTab === 'orders',
    refetchInterval: activeTab === 'orders' ? 15000 : false,
  });
  const [qrTable, setQrTable] = useState('1');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', imageUrl: '', category: '', available: true });

  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.getStats, refetchInterval: 30000 });
  const { data: menuItems = [], refetch: refetchMenu } = useQuery({ queryKey: ['admin-menu'], queryFn: menuApi.getAll });

  const { mutate: predict, isPending: predicting } = useMutation({
    mutationFn: aiApi.predict,
    onSuccess: data => { setPrediction(data); toast.success('Prediction ready!'); },
    onError: () => toast.error('Prediction failed. Try again in a moment.'),
  });

  const { mutate: toggleAvailable } = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => menuApi.update(id, { available }),
    onSuccess: (item) => {
      refetchMenu();
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success(`${item.name} marked as ${item.available ? 'available' : 'sold out'}`);
    },
  });

  const { mutate: deleteItem } = useMutation({
    mutationFn: (id: string) => menuApi.delete(id),
    onSuccess: () => { refetchMenu(); queryClient.invalidateQueries({ queryKey: ['menu'] }); toast.success('Item removed'); },
  });

  const { mutate: addItem, isPending: adding } = useMutation({
    mutationFn: () => menuApi.create({ ...newItem, price: parseFloat(newItem.price), available: true }),
    onSuccess: () => {
      refetchMenu(); queryClient.invalidateQueries({ queryKey: ['menu'] });
      setShowAddForm(false);
      setNewItem({ name: '', description: '', price: '', imageUrl: '', category: '', available: true });
      toast.success('Menu item added!');
    },
    onError: () => toast.error('Failed to add item. Check all fields.'),
  });

  useEffect(() => {
    const refresh = (_order: Order) => queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    socket.on('order:new', refresh);
    socket.on('order:statusUpdated', refresh);
    return () => { socket.off('order:new', refresh); socket.off('order:statusUpdated', refresh); };
  }, [queryClient]);

  const chartData = stats?.topItems.map(({ menuItem, totalSold }) => ({
    name: menuItem.name.split(' ')[0],
    sold: totalSold ?? 0,
    revenue: (totalSold ?? 0) * menuItem.price,
  })) ?? [];

  const revenuePoints = stats ? [
    { time: '6am', value: stats.revenueToday * 0.05 },
    { time: '9am', value: stats.revenueToday * 0.18 },
    { time: '12pm', value: stats.revenueToday * 0.45 },
    { time: '3pm', value: stats.revenueToday * 0.62 },
    { time: '6pm', value: stats.revenueToday * 0.82 },
    { time: 'Now', value: stats.revenueToday },
  ] : [];

  const tabs = [
    { id: 'overview' as const, label: '📊 Overview' },
    { id: 'orders' as const, label: '🧾 Orders' },
    { id: 'menu' as const, label: '🍽️ Menu' },
    { id: 'qr' as const, label: '📱 QR Codes' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="font-black text-xl tracking-tight" style={{ color: 'var(--text)' }}>Admin</span>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-0 flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all"
              style={activeTab === t.id
                ? { background: 'var(--bg)', color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }
                : { color: 'var(--text-2)' }
              }>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 h-32 skeleton" />)}
              </div>
            ) : stats && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon="💰" label="Revenue Today" value={`₦${stats.revenueToday.toFixed(2)}`} sub="today" accent />
                  <StatCard icon="🧾" label="Total Orders" value={stats.totalOrders} sub="today" />
                  <StatCard icon="🔥" label="Active" value={stats.activeOrders} sub="live" />
                  <StatCard icon="✅" label="Completed" value={stats.completedOrders} sub="today" />
                </div>

                {/* Revenue Chart */}
                <div className="card p-6">
                  <h2 className="font-bold mb-5" style={{ color: 'var(--text)' }}>Revenue Today</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenuePoints}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="time" tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v.toFixed(0)}`} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', color: 'var(--text)' }}
                        formatter={(v) => [`₦${Number(v).toFixed(2)}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#F97316" strokeWidth={2.5} fill="url(#rev)" dot={{ fill: '#F97316', r: 4 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Best Sellers Chart */}
                {chartData.length > 0 && (
                  <div className="card p-6">
                    <h2 className="font-bold mb-5" style={{ color: 'var(--text)' }}>🏆 Best Sellers Today</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', color: 'var(--text)' }}
                          formatter={(v, name) => [v, name === 'sold' ? 'Units sold' : 'Revenue']}
                        />
                        <Bar dataKey="sold" radius={[8, 8, 0, 0]}>
                          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* AI Prediction */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="font-bold" style={{ color: 'var(--text)' }}>🤖 AI Demand Prediction</h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Powered by Groq · Based on today's order history</p>
                    </div>
                    <button onClick={() => predict()} disabled={predicting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', borderRadius: '12px' }}>
                      {predicting ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Thinking…</> : '✨ Predict Next Hour'}
                    </button>
                  </div>

                  {prediction && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up">
                      {Object.entries(prediction).map(([item, count]) => (
                        <div key={item} className="flex items-center justify-between p-3 rounded-xl"
                          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item}</span>
                          <span className="text-xl font-black" style={{ color: '#7C3AED' }}>{Math.round(count)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!prediction && !predicting && (
                    <div className="mt-4 text-center py-8" style={{ color: 'var(--text-3)' }}>
                      <p className="text-3xl mb-2">🔮</p>
                      <p className="text-sm">Click predict to get AI-powered demand forecasting</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                Today's Orders {!ordersLoading && <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: '14px' }}>({allOrders.length})</span>}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {['', 'PENDING', 'PREPARING', 'READY', 'COMPLETED'].map(s => (
                  <button key={s} onClick={() => setOrderStatusFilter(s)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                    style={orderStatusFilter === s
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }
                    }>
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
              </div>
            ) : allOrders.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-3xl mb-3">🧾</p>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>No orders yet today</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                {allOrders.map((order, i) => {
                  const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
                    PENDING:   { bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B' },
                    PREPARING: { bg: 'rgba(59,130,246,0.1)',  text: '#3B82F6' },
                    READY:     { bg: 'rgba(16,185,129,0.1)', text: '#10B981' },
                    COMPLETED: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280' },
                  };
                  const sc = statusColors[order.status];
                  return (
                    <div key={order.id} className="flex items-center gap-4 px-4 py-3 transition-all hover:bg-[var(--surface-2)]"
                      style={{ borderBottom: i < allOrders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span className="text-lg font-black w-12 flex-shrink-0" style={{ color: 'var(--text)' }}>#{order.orderNumber}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                          {order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {order.notes && <span className="ml-2 italic">· {order.notes}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>₦{order.total.toFixed(2)}</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl" style={{ background: sc.bg, color: sc.text }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Daily total */}
            {allOrders.length > 0 && (
              <div className="card p-4 flex justify-between items-center">
                <span className="font-semibold" style={{ color: 'var(--text-2)' }}>Total revenue shown</span>
                <span className="text-xl font-black" style={{ color: 'var(--accent)' }}>
                  ₦{allOrders.filter(o => o.status === 'COMPLETED' || o.status === 'READY').reduce((s, o) => s + o.total, 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── MENU TAB ── */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Menu Items ({menuItems.length})</h2>
              <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
                {showAddForm ? '✕ Cancel' : '+ Add Item'}
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="card p-5 space-y-3 animate-fade-up">
                <h3 className="font-bold" style={{ color: 'var(--text)' }}>New Menu Item</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="input" placeholder="Name *" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                  <input className="input" placeholder="Category (e.g. Burgers) *" value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} />
                  <input className="input" placeholder="Price (e.g. 12.99) *" type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} />
                  <input className="input" placeholder="Image URL *" value={newItem.imageUrl} onChange={e => setNewItem(p => ({ ...p, imageUrl: e.target.value }))} />
                </div>
                <textarea className="input resize-none h-20" placeholder="Description *" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
                <button onClick={() => addItem()} disabled={adding || !newItem.name || !newItem.price || !newItem.category} className="btn btn-primary">
                  {adding ? 'Adding…' : '✓ Add to Menu'}
                </button>
              </div>
            )}

            {/* Items List */}
            <div className="card" style={{ overflow: 'hidden' }}>
              {menuItems.length === 0 ? (
                <p className="p-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>No menu items</p>
              ) : (
                <div className="p-4 space-y-2">
                  {menuItems.map(item => (
                    <MenuItemRow key={item.id} item={item}
                      onToggle={() => toggleAvailable({ id: item.id, available: !item.available })}
                      onDelete={() => { if (confirm(`Remove "${item.name}"?`)) deleteItem(item.id); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── QR CODES TAB ── */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Generate Table QR Codes</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Customers scan the QR code to open the menu on their phone.</p>

              <div className="flex items-center gap-3 mb-6">
                <label className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Table number:</label>
                <input type="number" min="1" max="99" value={qrTable}
                  onChange={e => setQrTable(e.target.value)}
                  className="input w-24" />
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="p-6 rounded-3xl" style={{ background: 'var(--surface-2)', border: '2px solid var(--border)' }}>
                  <QRCodeCanvas
                    value={`${SITE_URL}?table=${qrTable}`}
                    size={200}
                    level="H"
                  />
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: 'var(--text)' }}>Table {qrTable}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{SITE_URL}</p>
                </div>
                <button
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (!canvas) return;
                    const link = document.createElement('a');
                    link.download = `table-${qrTable}-qr.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                    toast.success(`QR code for Table ${qrTable} downloaded!`);
                  }}
                  className="btn btn-primary"
                >
                  ⬇ Download QR Code
                </button>
              </div>
            </div>

            {/* Quick generate grid */}
            <div className="card p-6">
              <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Quick Preview — All Tables</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setQrTable(String(n))}
                    className="p-3 rounded-2xl text-center transition-all hover:scale-105"
                    style={qrTable === String(n)
                      ? { background: 'var(--accent-soft)', border: '2px solid var(--accent)', color: 'var(--accent)' }
                      : { background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text-2)' }
                    }>
                    <p className="text-lg font-black">T{n}</p>
                    <p className="text-xs">Table {n}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
