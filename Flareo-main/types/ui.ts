import { type ReactNode } from 'react';
import { type ErrorInfo } from 'react';
import { type ToastAction } from '@/components/ui/toast';

// Carousel Types
export interface CarouselProps {
  opts?: any; // TODO: Replace with proper type from embla-carousel-react
  plugins?: any; // TODO: Replace with proper type from embla-carousel-react
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: any) => void; // TODO: Replace with proper type from embla-carousel-react
}

// Toast Types
export interface ToasterToast {
  id: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export type Toast = Omit<ToasterToast, 'id'>;
export type ToastActionElement = React.ReactElement<typeof ToastAction>;

// Form Types
export interface FormItemContextValue {
  id: string;
}

// Page Transition Types
export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  disableAnimation?: boolean;
  transitionType?: 'fade' | 'slide' | 'scale' | 'custom';
  customTransition?: {
    duration?: number;
    ease?: [number, number, number, number];
    scale?: number;
    blur?: number;
  };
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
  abTest?: {
    enabled: boolean;
    variant: 'A' | 'B';
    onVariantChange?: (variant: 'A' | 'B') => void;
  };
}

export interface ABTestConfig {
  variant: 'A' | 'B';
  transitionType: 'fade' | 'slide' | 'scale' | 'custom';
  customTransition?: {
    duration: number;
    ease: [number, number, number, number];
    scale: number;
    blur: number;
  };
}

// Error Boundary Types
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Chart Types
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

export interface ChartContextProps {
  config: ChartConfig;
}

// Skeleton Types
export interface SkeletonCardProps {
  className?: string;
}

// Virtual Scroll Types
export interface VirtualScrollProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
} 