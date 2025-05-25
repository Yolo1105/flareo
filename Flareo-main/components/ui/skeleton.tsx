import React from 'react';
import { cn } from "@/lib/utils"
import { type SkeletonCardProps } from '@/types/ui';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseStyles = 'bg-gray-200 rounded';
  const variantStyles = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'w-full h-full',
  };
  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const style = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
    />
  );
};

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-start space-x-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="80%" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Skeleton width="30%" />
        <div className="flex space-x-2">
          <Skeleton width={60} />
          <Skeleton width={60} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width={80} height={24} />
        ))}
      </div>
    </div>
  );
}
