import { useCartStore } from '../stores/cartStore';
import type { MenuItem } from '../types';

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find(i => i.menuItem.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div
      className={`card card-lift flex flex-col overflow-hidden transition-all duration-200 ${!item.available ? 'opacity-60' : ''}`}
    >
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-44 object-cover"
          onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x176?text=🍽️'; }}
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="badge" style={{ background: '#1a1a1a', color: '#fff', fontSize: '13px', padding: '6px 14px' }}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
          {item.category}
        </span>
        <h3 className="font-bold text-base leading-snug mb-1" style={{ color: 'var(--text)' }}>{item.name}</h3>
        <p className="text-sm flex-1 mb-4 line-clamp-2" style={{ color: 'var(--text-2)' }}>{item.description}</p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-black" style={{ color: 'var(--text)' }}>₦{item.price.toFixed(2)}</span>

          {!item.available ? (
            <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Unavailable</span>
          ) : qty === 0 ? (
            <button onClick={() => addItem(item)} className="btn btn-primary text-sm" style={{ borderRadius: '10px', padding: '8px 18px' }}>
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, qty - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:scale-110"
                style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
              >−</button>
              <span className="w-5 text-center font-bold" style={{ color: 'var(--text)' }}>{qty}</span>
              <button
                onClick={() => addItem(item)}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg text-white transition-all hover:scale-110"
                style={{ background: 'var(--accent)' }}
              >+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
