import type { MenuItem } from '../types';
import { useCartStore } from '../stores/cartStore';

interface Props {
  item: MenuItem;
}

export default function MenuItemCard({ item }: Props) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find(i => i.menuItem.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-full h-44 object-cover"
        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x176?text=Food'; }}
      />
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs font-medium text-orange-500 uppercase tracking-wide mb-1">
          {item.category}
        </span>
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 flex-1 mb-3 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</span>
          {qty === 0 ? (
            <button
              onClick={() => addItem(item)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, qty - 1)}
                className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center hover:bg-orange-200 transition-colors"
              >
                −
              </button>
              <span className="w-5 text-center font-semibold text-gray-900">{qty}</span>
              <button
                onClick={() => addItem(item)}
                className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
