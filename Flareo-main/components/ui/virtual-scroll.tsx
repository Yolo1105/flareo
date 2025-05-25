import React, { useRef, useEffect, useState, useCallback } from 'react';
import { type VirtualScrollProps } from '@/types/ui';

export function VirtualScroll<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
}: VirtualScrollProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const visibleItems = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems + 1, items.length);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const visibleItemsStyle = {
    height: `${totalHeight}px`,
    position: 'relative' as const,
  };

  const visibleItemsContainerStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    transform: `translateY(${startIndex * itemHeight}px)`,
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: `${height}px` }}
      onScroll={handleScroll}
    >
      <div style={visibleItemsStyle}>
        <div style={visibleItemsContainerStyle}>
          {items.slice(startIndex, endIndex).map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: `${itemHeight}px` }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 