import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, aiApi } from '../lib/api';
import socket from '../lib/socket';
import type { Order } from '../types';

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [prediction, setPrediction] = useState<Record<string, number> | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  });

  const { mutate: predict, isPending: predicting, isError: predictError } = useMutation({
    mutationFn: aiApi.predict,
    onSuccess: data => setPrediction(data),
  });

  // Live updates: refetch dashboard when any order changes
  useEffect(() => {
    const refresh = (_order: Order) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    socket.on('order:new', refresh);
    socket.on('order:statusUpdated', refresh);
    return () => {
      socket.off('order:new', refresh);
      socket.off('order:statusUpdated', refresh);
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon="💰"
                label="Revenue Today"
                value={`$${stats.revenueToday.toFixed(2)}`}
                sub="today"
              />
              <StatCard
                icon="🧾"
                label="Total Orders"
                value={stats.totalOrders}
                sub="today"
              />
              <StatCard
                icon="🔥"
                label="Active Orders"
                value={stats.activeOrders}
                sub="live"
              />
              <StatCard
                icon="✅"
                label="Completed"
                value={stats.completedOrders}
                sub="today"
              />
            </div>

            {/* Top Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span>🏆</span> Best Sellers Today
              </h2>
              {stats.topItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No orders yet today</p>
              ) : (
                <div className="space-y-3">
                  {stats.topItems.map(({ menuItem, totalSold }, index) => (
                    <div key={menuItem.id} className="flex items-center gap-4">
                      <span className="text-lg font-black text-gray-300 w-6 text-center">
                        {index + 1}
                      </span>
                      <img
                        src={menuItem.imageUrl}
                        alt={menuItem.name}
                        className="w-10 h-10 rounded-xl object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=F'; }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{menuItem.name}</p>
                        <p className="text-xs text-gray-400">{menuItem.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-500">{totalSold} sold</p>
                        <p className="text-xs text-gray-400">${menuItem.price.toFixed(2)} each</p>
                      </div>
                      {/* Bar */}
                      <div className="w-24 hidden sm:block">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-400 rounded-full"
                            style={{
                              width: `${Math.min(100, ((totalSold ?? 0) / (stats.topItems[0]?.totalSold ?? 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Prediction */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>🤖</span> AI Demand Prediction
                </h2>
                <button
                  onClick={() => predict()}
                  disabled={predicting}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  {predicting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Predicting…
                    </>
                  ) : (
                    <>✨ Predict Next Hour</>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                Powered by Gemini · Based on today's order history
              </p>

              {predictError && (
                <p className="text-sm text-red-500 bg-red-50 rounded-xl p-3">
                  Prediction failed. This is usually a Gemini free-tier quota limit — try again in a few minutes or tomorrow when the daily quota resets.
                </p>
              )}

              {prediction && !predictError && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Predicted orders in next hour
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(prediction).map(([item, count]) => (
                      <div
                        key={item}
                        className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-purple-900">{item}</span>
                        <span className="text-xl font-black text-purple-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!prediction && !predictError && !predicting && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">🔮</p>
                  <p className="text-sm">Click "Predict Next Hour" to get AI-powered demand forecasting</p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
