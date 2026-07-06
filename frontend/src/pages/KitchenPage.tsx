import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../lib/api';
import socket from '../lib/socket';
import type { Order, OrderStatus } from '../types';

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  PENDING:   'PREPARING',
  PREPARING: 'READY',
  READY:     'COMPLETED',
  COMPLETED: null,
};

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: 'Pending',   color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  PREPARING: { label: 'Preparing', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  READY:     { label: 'Ready',     color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200' },
  COMPLETED: { label: 'Completed', color: 'text-gray-500',   bg: 'bg-gray-50',    border: 'border-gray-200' },
};

const NEXT_LABEL: Record<OrderStatus, string> = {
  PENDING:   'Start Preparing',
  PREPARING: 'Mark Ready',
  READY:     'Complete Order',
  COMPLETED: '',
};

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'READY'];

function OrderCard({ order, onStatusUpdate }: { order: Order; onStatusUpdate: (id: string, status: OrderStatus) => void }) {
  const meta = STATUS_META[order.status];
  const nextStatus = STATUS_FLOW[order.status];
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  return (
    <div className={`rounded-2xl border-2 ${meta.border} ${meta.bg} p-4 flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-gray-900">#{order.orderNumber}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color} bg-white border ${meta.border}`}>
            {meta.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">{elapsed}m ago</span>
      </div>

      {/* Items */}
      <ul className="space-y-1">
        {order.items.map(item => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-800">
              <span className="text-orange-500 font-bold">×{item.quantity}</span>{' '}
              {item.menuItem.name}
            </span>
            <span className="text-gray-400 text-xs">{item.menuItem.category}</span>
          </li>
        ))}
      </ul>

      {/* Notes */}
      {order.notes && (
        <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100 italic">
          📝 {order.notes}
        </p>
      )}

      {/* Action */}
      {nextStatus && (
        <button
          onClick={() => onStatusUpdate(order.id, nextStatus)}
          className="mt-1 w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-700 transition-colors"
        >
          {NEXT_LABEL[order.status]}
        </button>
      )}
    </div>
  );
}

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  // Load all active orders on mount
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      // We don't have a GET /orders endpoint for all orders, so we track via socket
      // and seed from a dashboard call. Kitchen starts fresh each session.
      return [] as Order[];
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: updated => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev =>
        (prev ?? []).map(o => (o.id === updated.id ? updated : o))
          .filter(o => ACTIVE_STATUSES.includes(o.status))
      );
    },
  });

  useEffect(() => {
    const handleNew = (order: Order) => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev => {
        const exists = (prev ?? []).some(o => o.id === order.id);
        return exists ? prev! : [order, ...(prev ?? [])];
      });
      setNewOrderIds(prev => new Set(prev).add(order.id));
      setTimeout(() => {
        setNewOrderIds(prev => { const s = new Set(prev); s.delete(order.id); return s; });
      }, 3000);
    };

    const handleUpdated = (order: Order) => {
      queryClient.setQueryData<Order[]>(['kitchen-orders'], prev =>
        (prev ?? []).map(o => (o.id === order.id ? order : o))
          .filter(o => ACTIVE_STATUSES.includes(o.status))
      );
    };

    socket.on('order:new', handleNew);
    socket.on('order:statusUpdated', handleUpdated);
    return () => {
      socket.off('order:new', handleNew);
      socket.off('order:statusUpdated', handleUpdated);
    };
  }, [queryClient]);

  const columns: Record<string, Order[]> = {
    PENDING:   orders.filter(o => o.status === 'PENDING'),
    PREPARING: orders.filter(o => o.status === 'PREPARING'),
    READY:     orders.filter(o => o.status === 'READY'),
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍🍳</span>
          <div>
            <h1 className="text-lg font-bold">Kitchen Display</h1>
            <p className="text-xs text-gray-400">Orders update in real time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {(['PENDING', 'PREPARING', 'READY'] as OrderStatus[]).map(status => (
            <div key={status}>
              {/* Column header */}
              <div className={`flex items-center gap-2 mb-4`}>
                <span className={`w-3 h-3 rounded-full ${status === 'PENDING' ? 'bg-yellow-400' : status === 'PREPARING' ? 'bg-blue-400' : 'bg-green-400'}`} />
                <h2 className="font-bold text-sm uppercase tracking-widest text-gray-300">
                  {STATUS_META[status].label}
                </h2>
                <span className="ml-auto bg-gray-700 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  {columns[status].length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-4">
                {columns[status].length === 0 ? (
                  <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center text-gray-600 text-sm">
                    No orders
                  </div>
                ) : (
                  columns[status].map(order => (
                    <div
                      key={order.id}
                      className={`transition-all duration-700 ${newOrderIds.has(order.id) ? 'ring-4 ring-orange-400 ring-offset-2 ring-offset-gray-900 rounded-2xl scale-[1.02]' : ''}`}
                    >
                      <OrderCard
                        order={order}
                        onStatusUpdate={(id, status) => updateStatus({ id, status })}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-gray-600">
          <span className="text-6xl mb-4">🍳</span>
          <p className="text-lg font-semibold">Waiting for orders…</p>
          <p className="text-sm mt-1">New orders will appear here instantly</p>
        </div>
      )}
    </div>
  );
}
