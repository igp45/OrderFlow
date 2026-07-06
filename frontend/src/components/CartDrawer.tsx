import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '../stores/cartStore';
import { ordersApi } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { items, notes, updateQuantity, removeItem, setNotes, clearCart, total } = useCartStore();
  const [error, setError] = useState('');

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: () =>
      ordersApi.create({
        items: items.map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity })),
        notes: notes || undefined,
      }),
    onSuccess: order => {
      clearCart();
      onClose();
      navigate(`/order/${order.id}`);
    },
    onError: () => setError('Failed to place order. Please try again.'),
  });

  const handlePlaceOrder = () => {
    setError('');
    placeOrder();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <span className="text-5xl">🛒</span>
              <p className="text-sm">Your cart is empty</p>
            </div>
          ) : (
            items.map(({ menuItem, quantity }) => (
              <div key={menuItem.id} className="flex items-center gap-3">
                <img
                  src={menuItem.imageUrl}
                  alt={menuItem.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/56x56?text=Food'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{menuItem.name}</p>
                  <p className="text-orange-500 font-semibold text-sm">${(menuItem.price * quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 font-bold"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                    className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 font-bold"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(menuItem.id)}
                    className="ml-1 text-gray-300 hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <textarea
              placeholder="Any special requests? (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-xl font-bold text-gray-900">${total().toFixed(2)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3.5 rounded-2xl transition-colors text-base"
            >
              {isPending ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
