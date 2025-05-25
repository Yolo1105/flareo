import React, { memo, useMemo, useEffect } from 'react';
import { PluginsPageProps } from '@/types/features';
import { Card, VirtualScroll, SkeletonCard, LazyImage, ErrorBoundary, PageTransition } from '@/components/ui';
import { useData } from '@/lib/hooks/useData';
import { usePrefetch } from '@/lib/hooks/usePrefetch';

const PluginCard = memo(({ plugin }: { plugin: PluginsPageProps['plugins'][0] }) => {
  const formattedDownloads = useMemo(() => {
    if (plugin.downloads >= 1000000) {
      return `${(plugin.downloads / 1000000).toFixed(1)}M`;
    }
    if (plugin.downloads >= 1000) {
      return `${(plugin.downloads / 1000).toFixed(1)}K`;
    }
    return plugin.downloads.toString();
  }, [plugin.downloads]);

  const formattedDate = useMemo(() => {
    return new Date(plugin.lastUpdated).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [plugin.lastUpdated]);

  return (
    <Card className="plugin-card p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="plugin-header flex items-start gap-4">
        <LazyImage 
          src={plugin.icon} 
          alt={plugin.name} 
          className="plugin-icon w-12 h-12 rounded-lg object-cover"
        />
        <div className="plugin-info flex-1">
          <h3 className="plugin-title text-lg font-semibold mb-1">{plugin.name}</h3>
          <p className="plugin-description text-gray-600 text-sm line-clamp-2">{plugin.description}</p>
        </div>
      </div>
      <div className="plugin-meta flex items-center justify-between mt-4">
        <span className="plugin-category text-sm text-gray-500">{plugin.category}</span>
        <div className="plugin-stats flex items-center gap-4">
          <span className="plugin-rating text-sm text-yellow-500">⭐ {plugin.rating}</span>
          <span className="plugin-downloads text-sm text-gray-500">⬇️ {formattedDownloads}</span>
        </div>
      </div>
      <div className="plugin-tags flex flex-wrap gap-2 mt-4">
        {plugin.tags.map((tag) => (
          <span 
            key={tag} 
            className="plugin-tag text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="plugin-version flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>版本: {plugin.version}</span>
        <span>更新: {formattedDate}</span>
      </div>
    </Card>
  );
});

PluginCard.displayName = 'PluginCard';

const PluginsPage: React.FC<PluginsPageProps> = memo(({ plugins: initialPlugins, className = '' }) => {
  const { prefetch } = usePrefetch();
  const { data: plugins, isLoading, error, refetch, invalidateCache } = useData({
    url: '/api/plugins',
    initialData: initialPlugins,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    prefetch: true, // 启用预取
  });

  // 预取相关数据
  useEffect(() => {
    if (plugins) {
      const urls = plugins.map(plugin => `/api/plugins/${plugin.id}/details`);
      prefetch({
        urls,
        cacheTime: 5 * 60 * 1000,
        onError: (error) => console.error('预取失败:', error),
        onSuccess: (url) => console.log('预取成功:', url),
      });
    }
  }, [plugins, prefetch]);

  const sortedPlugins = useMemo(() => {
    if (!plugins) return [];
    return [...plugins].sort((a, b) => b.rating - a.rating);
  }, [plugins]);

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
          items={sortedPlugins}
          height={800}
          itemHeight={200}
          renderItem={(plugin, index) => (
            <PluginCard key={plugin.id} plugin={plugin} />
          )}
          className={className}
        />
      </ErrorBoundary>
    </PageTransition>
  );
});

PluginsPage.displayName = 'PluginsPage';

export default PluginsPage; 