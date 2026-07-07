import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCartStore } from '../stores/cartStore';
import { ordersApi } from '../lib/api';

function saveOrderToHistory(id: string, orderNumber: number) {
  const existing = JSON.parse(localStorage.getItem('of_orders') || '[]');
  existing.unshift({ id, orderNumber, createdAt: new Date().toISOString() });
  localStorage.setItem('of_orders', JSON.stringify(existing.slice(0, 20)));
}

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { items, notes, updateQuantity, removeItem, setNotes, clearCart, total } = useCartStore();
  const [error, setError] = useState('');

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: () => ordersApi.create({
      items: items.map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity })),
      notes: notes || undefined,
    }),
    onSuccess: order => {
      saveOrderToHistory(order.id, order.orderNumber);
      clearCart();
      onClose();
      toast.success(`Order #${order.orderNumber} placed!`);
      navigate(`/order/${order.id}`);
    },
    onError: () => setError('Failed to place order. Please try again.'),
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Your Order</h2>
            {items.length > 0 && <p className="text-xs" style={{ color: 'var(--text-2)' }}>{items.length} item{items.length > 1 ? 's' : ''}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--text-3)' }}>
              <div className="text-6xl">🛒</div>
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs text-center">Add some delicious items from the menu!</p>
            </div>
          ) : items.map(({ menuItem, quantity }) => (
            <div key={menuItem.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--surface-2)' }}>
              <img src={menuItem.imageUrl} alt={menuItem.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/56?text=🍽️'; }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{menuItem.name}</p>
                <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>₦{(menuItem.price * quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all hover:scale-110"
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)' }}>−</button>
                <span className="w-4 text-center font-bold text-sm" style={{ color: 'var(--text)' }}>{quantity}</span>
                <button onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white transition-all hover:scale-110"
                  style={{ background: 'var(--accent)' }}>+</button>
                <button onClick={() => removeItem(menuItem.id)} className="ml-1 text-lg leading-none transition-all hover:scale-110" style={{ color: 'var(--text-3)' }}>×</button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
            <textarea
              placeholder="Special requests? (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input resize-none h-16 text-sm"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>Total</span>
              <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>₦{total().toFixed(2)}</span>
            </div>
            <button onClick={() => { setError(''); placeOrder(); }} disabled={isPending} className="btn btn-primary w-full text-base" style={{ padding: '14px', borderRadius: '14px', fontSize: '15px' }}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Order…
                </span>
              ) : '🛍️ Place Order'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
