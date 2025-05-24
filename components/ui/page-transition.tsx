import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/router';
import { type PageTransitionProps, type ABTestConfig } from '@/types/ui';

// A/B 测试配置
const abTestConfigs: Record<'A' | 'B', ABTestConfig> = {
  A: {
    variant: 'A',
    transitionType: 'fade',
    customTransition: {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1],
      scale: 0.98,
      blur: 4,
    },
  },
  B: {
    variant: 'B',
    transitionType: 'slide',
    customTransition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
      scale: 0.95,
      blur: 8,
    },
  },
};

// 性能监控
const performanceMetrics = {
  transitionStart: 0,
  transitionEnd: 0,
  lastTransitionDuration: 0,
  averageTransitionDuration: 0,
  transitionCount: 0,
  variantPerformance: {
    A: { total: 0, average: 0 },
    B: { total: 0, average: 0 },
  },
};

// 预加载策略
interface PreloadStrategy {
  priority: 'high' | 'medium' | 'low';
  resources: Set<string>;
  lastAccessed: number;
  accessCount: number;
}

class PreloadManager {
  private strategies: Map<string, PreloadStrategy> = new Map();
  private isPreloading: boolean = false;
  private preloadQueue: Set<string> = new Set();
  private maxConcurrentPreloads: number = 2;
  private currentPreloads: number = 0;
  private loadedResources: Set<string> = new Set();

  constructor() {
    // 初始化预加载策略
    this.strategies.set('critical', {
      priority: 'high',
      resources: new Set(),
      lastAccessed: Date.now(),
      accessCount: 0,
    });
    this.strategies.set('common', {
      priority: 'medium',
      resources: new Set(),
      lastAccessed: Date.now(),
      accessCount: 0,
    });
    this.strategies.set('optional', {
      priority: 'low',
      resources: new Set(),
      lastAccessed: Date.now(),
      accessCount: 0,
    });
  }

  // 添加资源到预加载队列
  addResource(url: string, strategy: string = 'common') {
    // 如果资源已经加载过，直接返回
    if (this.loadedResources.has(url)) {
      return;
    }

    const currentStrategy = this.strategies.get(strategy);
    if (currentStrategy) {
      currentStrategy.resources.add(url);
      currentStrategy.accessCount++;
      currentStrategy.lastAccessed = Date.now();
      this.preloadQueue.add(url);
      this.processQueue();
    }
  }

  // 处理预加载队列
  private async processQueue() {
    if (this.isPreloading || this.currentPreloads >= this.maxConcurrentPreloads) {
      return;
    }

    this.isPreloading = true;
    const resources = Array.from(this.preloadQueue);

    // 按优先级排序
    resources.sort((a, b) => {
      const strategyA = this.getResourceStrategy(a);
      const strategyB = this.getResourceStrategy(b);
      return this.getStrategyPriority(strategyB) - this.getStrategyPriority(strategyA);
    });

    for (const url of resources) {
      if (this.currentPreloads >= this.maxConcurrentPreloads) {
        break;
      }

      this.currentPreloads++;
      try {
        await this.preloadResource(url);
        this.loadedResources.add(url);
      } catch (error) {
        console.error(`Failed to preload resource: ${url}`, error);
      } finally {
        this.currentPreloads--;
        this.preloadQueue.delete(url);
      }
    }

    this.isPreloading = false;
    if (this.preloadQueue.size > 0) {
      setTimeout(() => this.processQueue(), 100); // 添加延迟，避免过于频繁的加载
    }
  }

  // 获取资源策略
  private getResourceStrategy(url: string): string {
    for (const [strategy, data] of this.strategies.entries()) {
      if (data.resources.has(url)) {
        return strategy;
      }
    }
    return 'common';
  }

  // 获取策略优先级
  private getStrategyPriority(strategy: string): number {
    const strategyData = this.strategies.get(strategy);
    if (!strategyData) return 0;

    const timeSinceLastAccess = Date.now() - strategyData.lastAccessed;
    const accessWeight = strategyData.accessCount;
    const timeWeight = 1 / (timeSinceLastAccess + 1);

    switch (strategyData.priority) {
      case 'high':
        return 3 * accessWeight * timeWeight;
      case 'medium':
        return 2 * accessWeight * timeWeight;
      case 'low':
        return accessWeight * timeWeight;
      default:
        return 0;
    }
  }

  // 预加载单个资源
  private async preloadResource(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      document.head.appendChild(link);
    });
  }

  // 清理不常用的资源
  cleanup(maxAge: number = 3600000) { // 默认1小时
    const now = Date.now();
    for (const [strategy, data] of this.strategies.entries()) {
      if (now - data.lastAccessed > maxAge) {
        data.resources.clear();
        data.accessCount = 0;
      }
    }
  }
}

// 创建预加载管理器实例
const preloadManager = new PreloadManager();

// 获取过渡变体
const getTransitionVariants = (type: string, custom?: any) => {
  const baseVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.98 },
    },
    custom: {
      initial: { 
        opacity: 0, 
        y: 20, 
        scale: custom?.scale || 0.98,
        filter: `blur(${custom?.blur || 4}px)`,
      },
      animate: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        filter: 'blur(0px)',
      },
      exit: { 
        opacity: 0, 
        y: -20, 
        scale: custom?.scale || 0.98,
        filter: `blur(${custom?.blur || 4}px)`,
      },
    },
  };

  return baseVariants[type as keyof typeof baseVariants] || baseVariants.fade;
};

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '',
  disableAnimation = false,
  transitionType = 'fade',
  customTransition,
  onTransitionStart,
  onTransitionEnd,
  abTest,
}) => {
  const [isFirstMount, setIsFirstMount] = useState(true);
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
  const backgroundControls = useAnimation();
  const contentControls = useAnimation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);
  const prefersReducedMotion = useReducedMotion();
  const lastPathRef = useRef(router.asPath);
  const [currentVariant, setCurrentVariant] = useState<'A' | 'B'>(abTest?.variant || 'A');
  const [isContentReady, setIsContentReady] = useState(true);
  const contentReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当前 A/B 测试配置
  const currentConfig = useMemo(() => {
    if (abTest?.enabled) {
      return abTestConfigs[currentVariant];
    }
    return {
      transitionType,
      customTransition,
    };
  }, [abTest, currentVariant, transitionType, customTransition]);

  // 获取过渡变体
  const variants = useMemo(() => 
    getTransitionVariants(currentConfig.transitionType, currentConfig.customTransition),
    [currentConfig]
  );

  // 预加载资源
  useEffect(() => {
    // 预加载关键资源
    preloadManager.addResource('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=', 'critical');

    // 预加载动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pageTransitionFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pageTransitionSlide {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes pageTransitionScale {
        from { transform: scale(0.98); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // 定期清理不常用的资源
    const cleanupInterval = setInterval(() => {
      preloadManager.cleanup();
    }, 3600000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // 处理首次加载
  useEffect(() => {
    if (isInitialLoad.current) {
      contentControls.set('animate');
      isInitialLoad.current = false;
    }
    setIsFirstMount(false);
  }, [contentControls]);

  // 处理路由变化
  const handleRouteChange = useCallback(async (url: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isInitialLoad.current || disableAnimation || prefersReducedMotion) {
      return;
    }

    // 设置内容未准备好状态
    setIsContentReady(false);

    performanceMetrics.transitionStart = performance.now();
    onTransitionStart?.();
    setIsTransitioning(true);
    const currentPath = lastPathRef.current;
    const nextPath = url;
    const currentDepth = currentPath.split('/').length;
    const nextDepth = nextPath.split('/').length;
    setTransitionDirection(nextDepth > currentDepth ? 'forward' : 'backward');
    lastPathRef.current = nextPath;

    // 预加载下一个页面的资源
    preloadManager.addResource(nextPath, 'common');

    try {
      // 等待一小段时间确保新页面内容已加载
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await backgroundControls.start('animate');
      await contentControls.start('exit');

      // 设置内容准备好状态
      contentReadyTimeoutRef.current = setTimeout(() => {
        setIsContentReady(true);
      }, 100);
    } catch (error) {
      console.error('Animation error:', error);
      setIsTransitioning(false);
      setIsContentReady(true);
    }
  }, [backgroundControls, contentControls, disableAnimation, prefersReducedMotion, onTransitionStart]);

  // 处理路由完成
  const handleRouteComplete = useCallback(async () => {
    if (isInitialLoad.current || disableAnimation || prefersReducedMotion) {
      return;
    }

    // 等待内容准备好
    if (!isContentReady) {
      await new Promise(resolve => {
        const checkContent = () => {
          if (isContentReady) {
            resolve(true);
          } else {
            setTimeout(checkContent, 50);
          }
        };
        checkContent();
      });
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await backgroundControls.start('exit');
        await contentControls.start('animate');
        setIsTransitioning(false);
        
        // 记录性能指标
        performanceMetrics.transitionEnd = performance.now();
        const duration = performanceMetrics.transitionEnd - performanceMetrics.transitionStart;
        performanceMetrics.lastTransitionDuration = duration;
        performanceMetrics.transitionCount++;

        // 更新 A/B 测试性能指标
        if (abTest?.enabled) {
          const variantMetrics = performanceMetrics.variantPerformance[currentVariant];
          variantMetrics.total += duration;
          variantMetrics.average = variantMetrics.total / performanceMetrics.transitionCount;
        }

        // 如果过渡时间过长，记录警告
        if (duration > 300) {
          console.warn('Slow transition detected:', duration);
        }

        // 如果启用了 A/B 测试，根据性能自动切换变体
        if (abTest?.enabled && performanceMetrics.transitionCount > 10) {
          const variantA = performanceMetrics.variantPerformance.A;
          const variantB = performanceMetrics.variantPerformance.B;
          
          if (Math.abs(variantA.average - variantB.average) > 50) {
            const betterVariant = variantA.average < variantB.average ? 'A' : 'B';
            if (betterVariant !== currentVariant) {
              setCurrentVariant(betterVariant);
              abTest.onVariantChange?.(betterVariant);
            }
          }
        }

        onTransitionEnd?.();
      } catch (error) {
        console.error('Animation error:', error);
        setIsTransitioning(false);
      }
    }, 50);
  }, [backgroundControls, contentControls, disableAnimation, prefersReducedMotion, onTransitionEnd, abTest, currentVariant, isContentReady]);

  // 设置路由事件监听
  useEffect(() => {
    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteComplete);
    router.events.on('routeChangeError', handleRouteComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteComplete);
      router.events.off('routeChangeError', handleRouteComplete);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (contentReadyTimeoutRef.current) {
        clearTimeout(contentReadyTimeoutRef.current);
      }
    };
  }, [router, handleRouteChange, handleRouteComplete]);

  // 如果禁用动画或用户偏好减少动画，直接渲染内容
  if (disableAnimation || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isTransitioning && !isInitialLoad.current && (
          <motion.div
            key="background"
            initial="initial"
            animate={backgroundControls}
            exit="exit"
            variants={variants}
            transition={{
              duration: currentConfig.customTransition?.duration || 0.5,
              ease: currentConfig.customTransition?.ease || [0.32, 0.72, 0, 1],
              filter: {
                duration: 0.4,
              },
            }}
            className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 pointer-events-none ${
              transitionDirection === 'forward' ? 'origin-top' : 'origin-bottom'
            }`}
            style={{
              willChange: 'transform, opacity, filter',
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={isFirstMount ? 'initial' : 'transition'}
          initial="initial"
          animate={contentControls}
          exit="exit"
          variants={variants}
          transition={{
            duration: currentConfig.customTransition?.duration || 0.5,
            ease: currentConfig.customTransition?.ease || [0.32, 0.72, 0, 1],
            scale: {
              duration: 0.4,
            },
            filter: {
              duration: 0.3,
            },
          }}
          className={`relative z-10 ${className}`}
          style={{
            willChange: 'transform, opacity, filter',
            opacity: isContentReady ? 1 : 0,
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}; 