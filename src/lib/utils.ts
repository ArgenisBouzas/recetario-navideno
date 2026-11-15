import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const CATEGORIA_LABEL: Record<string, string> = {
  plato_principal: 'Plato principal',
  ensalada: 'Ensalada',
  pan: 'Pan',
  postre: 'Postre',
  extra: 'Extra',
  hallaca: 'Hallaca',
};
