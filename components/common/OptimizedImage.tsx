import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 预加载图片
  useEffect(() => {
    if (priority) {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        setIsLoading(false);
        onLoad?.();
      };
      img.onerror = () => {
        setError(true);
        setIsLoading(false);
      };
    }
  }, [src, priority, onLoad]);

  // 计算图片尺寸
  const imageSize = {
    width: width || '100%',
    height: height || 'auto',
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={imageSize}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse"
          />
        )}
      </AnimatePresence>

      <Image
        src={error ? '/images/fallback.jpg' : src}
        alt={alt}
        width={width}
        height={height}
        className={`
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${error ? 'object-contain' : 'object-cover'}
        `}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoadingComplete={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        loading={priority ? 'eager' : 'lazy'}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}; 