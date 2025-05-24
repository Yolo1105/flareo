import React, { memo, useMemo, useEffect } from 'react';
import { ExplorePageProps } from '@/types/features';
import { Card, VirtualScroll, SkeletonCard, LazyImage, ErrorBoundary, PageTransition } from '@/components/ui';
import { useData } from '@/lib/hooks/useData';
import { usePrefetch } from '@/lib/hooks/usePrefetch';

const ExploreCard = memo(({ explore }: { explore: ExplorePageProps['explores'][0] }) => {
  const formattedDownloads = useMemo(() => {
    if (explore.downloads >= 1000000) {
      return `${(explore.downloads / 1000000).toFixed(1)}M`;
    }
    if (explore.downloads >= 1000) {
      return `${(explore.downloads / 1000).toFixed(1)}K`;
    }
    return explore.downloads.toString();
  }, [explore.downloads]);

  return (
    <Card className="explore-card p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="explore-header flex items-start gap-4">
        <LazyImage 
          src={explore.icon} 
          alt={explore.name} 
          className="explore-icon w-12 h-12 rounded-lg object-cover"
        />
        <div className="explore-info flex-1">
          <h3 className="explore-title text-lg font-semibold mb-1">{explore.name}</h3>
          <p className="explore-description text-gray-600 text-sm line-clamp-2">{explore.description}</p>
        </div>
      </div>
      <div className="explore-meta flex items-center justify-between mt-4">
        <span className="explore-category text-sm text-gray-500">{explore.category}</span>
        <div className="explore-stats flex items-center gap-4">
          <span className="explore-rating text-sm text-yellow-500">⭐ {explore.rating}</span>
          <span className="explore-downloads text-sm text-gray-500">⬇️ {formattedDownloads}</span>
        </div>
      </div>
      <div className="explore-tags flex flex-wrap gap-2 mt-4">
        {explore.tags.map((tag) => (
          <span 
            key={tag} 
            className="explore-tag text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
});

ExploreCard.displayName = 'ExploreCard';

const ExplorePage: React.FC<ExplorePageProps> = memo(({ explores: initialExplores, className = '' }) => {
  const { prefetch } = usePrefetch();
  const { data: explores, isLoading, error, refetch, invalidateCache } = useData({
    url: '/api/explores',
    initialData: initialExplores,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    prefetch: true, // 启用预取
  });

  // 预取相关数据
  useEffect(() => {
    if (explores) {
      const urls = explores.map(explore => `/api/explores/${explore.id}/details`);
      prefetch({
        urls,
        cacheTime: 5 * 60 * 1000,
        onError: (error) => console.error('预取失败:', error),
        onSuccess: (url) => console.log('预取成功:', url),
      });
    }
  }, [explores, prefetch]);

  const sortedExplores = useMemo(() => {
    if (!explores) return [];
    return [...explores].sort((a, b) => b.rating - a.rating);
  }, [explores]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">加载失败</h2>
          <p className="text-sm text-red-600 mb-4">{error.message}</p>
          <button
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            onClick={() => refetch()}
          >
            重试
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ErrorBoundary>
        <VirtualScroll
          items={sortedExplores}
          height={800}
          itemHeight={200}
          renderItem={(explore, index) => (
            <ExploreCard key={explore.id} explore={explore} />
          )}
          className={className}
        />
      </ErrorBoundary>
    </PageTransition>
  );
});

ExplorePage.displayName = 'ExplorePage';

export default ExplorePage; 