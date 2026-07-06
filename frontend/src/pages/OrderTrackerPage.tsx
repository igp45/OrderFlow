import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../lib/api';
import socket from '../lib/socket';
import type { Order, OrderStatus } from '../types';

const STEPS: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];

const STEP_META: Record<OrderStatus, { label: string; icon: string; description: string }> = {
  PENDING:   { label: 'Order Received',  icon: '📋', description: 'We got your order!' },
  PREPARING: { label: 'Preparing',       icon: '👨‍🍳', description: 'Kitchen is on it' },
  READY:     { label: 'Ready',           icon: '✅', description: 'Come pick it up!' },
  COMPLETED: { label: 'Completed',       icon: '🎉', description: 'Enjoy your meal!' },
};

export default function OrderTrackerPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    const handler = (updated: Order) => {
      if (updated.id === id) {
        queryClient.setQueryData(['order', id], updated);
      }
    };
    socket.on('order:statusUpdated', handler);
    return () => { socket.off('order:statusUpdated', handler); };
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Order not found.</p>
        <Link to="/" className="text-orange-500 hover:underline">Back to menu</Link>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-600 text-xl">←</Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-gray-900">OrderFlow</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Order Number */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-1">Order Number</p>
          <p className="text-5xl font-black text-orange-500">#{order.orderNumber}</p>
          <p className="text-sm text-gray-400 mt-2">
            Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Status Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-700 mb-6">Order Status</h2>
          <div className="space-y-0">
            {STEPS.map((step, index) => {
              const isDone = index < currentIndex;
              const isActive = index === currentIndex;
              const meta = STEP_META[step];
              return (
                <div key={step} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all duration-500
                        ${isActive ? 'bg-orange-500 shadow-lg shadow-orange-200 scale-110' : isDone ? 'bg-green-100' : 'bg-gray-100'}`}
                    >
                      {meta.icon}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 transition-colors duration-500 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  {/* Text */}
                  <div className="pb-8 pt-1.5">
                    <p className={`font-semibold text-sm ${isActive ? 'text-orange-500' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                      {meta.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={item.menuItem.imageUrl}
                    alt={item.menuItem.name}
                    className="w-10 h-10 rounded-lg object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=F'; }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.menuItem.name}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          {order.notes && (
            <p className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 italic">
              Note: {order.notes}
            </p>
          )}
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
          </div>
        </div>

        <Link
          to="/"
          className="block text-center text-orange-500 hover:text-orange-600 font-medium text-sm"
        >
          ← Back to menu
        </Link>
      </main>
    </div>
  );
}
