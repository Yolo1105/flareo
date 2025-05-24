import { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'secondary' | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
} 