import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      dark: false,
      toggle: () => {
        const next = !get().dark;
        set({ dark: next });
        document.documentElement.classList.toggle('dark', next);
      },
    }),
    { name: 'orderflow-theme' }
  )
);

export function initTheme() {
  const stored = localStorage.getItem('orderflow-theme');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.dark) document.documentElement.classList.add('dark');
  }
}
