import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { useUi } from '@/store/ui';
import './styles/index.css';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });

// Aplica el tema guardado antes de pintar y cuando cambie
const applyTheme = (t: 'light' | 'dark') => document.documentElement.classList.toggle('dark', t === 'dark');
applyTheme(useUi.getState().theme);
useUi.subscribe((s) => applyTheme(s.theme));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
