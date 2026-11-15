import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { RecipesPage } from '@/features/recipes/RecipesPage';
import { RecipeDetailPage } from '@/features/recipes/RecipeDetailPage';
import { RecipeFormPage } from '@/features/recipes/RecipeFormPage';
import { EventsPage } from '@/features/events/EventsPage';
import { EventDetailPage } from '@/features/events/EventDetailPage';
import { RecipeEventPage } from '@/features/events/RecipeEventPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ComingSoon } from '@/pages/ComingSoon';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <ComingSoon titulo="Dashboard" modulo="Módulo 5" /> },
      { path: '/recetas', element: <RecipesPage /> },
      { path: '/recetas/nueva', element: <RecipeFormPage /> },
      { path: '/recetas/:id', element: <RecipeDetailPage /> },
      { path: '/recetas/:id/editar', element: <RecipeFormPage /> },
      { path: '/eventos', element: <EventsPage /> },
      { path: '/eventos/:id', element: <EventDetailPage /> },
      { path: '/registros/:id', element: <RecipeEventPage /> },
      { path: '/reportes', element: <ComingSoon titulo="Reportes" modulo="Módulo 5" /> },
      { path: '/ajustes', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
