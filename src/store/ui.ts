import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  theme: 'light' | 'dark';
  password: string | null;
  toggleTheme: () => void;
  setPassword: (p: string | null) => void;
};

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      password: null,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setPassword: (password) => set({ password }),
    }),
    { name: 'recetario-ui' },
  ),
);
