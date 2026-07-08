import { useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
import type { MenuItem } from '../types';

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

export default function MenuItemModal({ item, onClose }: Props) {
  const { items, addItem, updateQuantity } = useCartStore();

  useEffect(() => {
    if (!item) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [item, onClose]);

  if (!item) return null;

  const cartItem = items.find(i => i.menuItem.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 overflow-hidden"
        style={{
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0',
        }}
      >
        <div
          className="w-full sm:w-auto sm:max-w-md sm:m-auto sm:rounded-3xl rounded-t-3xl overflow-hidden"
          style={{
            background: 'var(--surface)',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -8px 60px rgba(0,0,0,0.3)',
            animation: 'slide-up 0.3s ease both',
            width: '100%',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Image */}
          <div className="relative flex-shrink-0" style={{ height: 260 }}>
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x260?text=🍽️'; }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)' }} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#fff' }}
            >
              ×
            </button>

            {/* Category badge on image */}
            <div className="absolute bottom-4 left-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: 'var(--accent)', color: '#fff', letterSpacing: '0.05em' }}>
                {item.category}
              </span>
            </div>

            {!item.available && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)' }}>
                <span className="font-bold text-white text-lg">Sold Out</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <h2 className="text-2xl font-black leading-tight" style={{ color: 'var(--text)' }}>{item.name}</h2>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>{item.description}</p>
            </div>

            <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>
                ₦{item.price.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
              </span>
              {item.available && (
                <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-3)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Available
                </div>
              )}
            </div>
          </div>

          {/* Footer action */}
          <div className="px-6 pb-6 pt-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            {!item.available ? (
              <div className="py-3 rounded-2xl text-center text-sm font-semibold"
                style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                Currently unavailable
              </div>
            ) : qty === 0 ? (
              <button
                onClick={() => { addItem(item); }}
                className="btn btn-primary w-full"
                style={{ padding: '14px', borderRadius: '14px', fontSize: '15px' }}
              >
                Add to Order — ₦{item.price.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 justify-center rounded-2xl py-3"
                  style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}>
                  <button
                    onClick={() => updateQuantity(item.id, qty - 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:scale-110"
                    style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
                  >−</button>
                  <span className="text-lg font-black w-8 text-center" style={{ color: 'var(--text)' }}>{qty}</span>
                  <button
                    onClick={() => addItem(item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg text-white transition-all hover:scale-110"
                    style={{ background: 'var(--accent)' }}
                  >+</button>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>Subtotal</p>
                  <p className="font-black" style={{ color: 'var(--text)' }}>
                    ₦{(item.price * qty).toLocaleString('en-NG', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
