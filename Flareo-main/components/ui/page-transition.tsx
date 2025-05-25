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
      duration: 0.4,
      ease: [0.32, 0.72, 0, 1],
      scale: 0.98,
      blur: 8,
    },
  },
  B: {
    variant: 'B',
    transitionType: 'slide',
    customTransition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
      scale: 0.95,
      blur: 12,
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
    A: { total: 0, average: 0, errors: 0, slowTransitions: 0 },
    B: { total: 0, average: 0, errors: 0, slowTransitions: 0 },
  },
  resourceMetrics: {
    preloadSuccess: 0,
    preloadFailures: 0,
    averagePreloadTime: 0,
    totalPreloadTime: 0,
  },
  memoryUsage: {
    lastCheck: 0,
    peakUsage: 0,
  },
};

// 添加性能监控工具
const PerformanceMonitor = {
  startTransition() {
    performanceMetrics.transitionStart = performance.now();
    // Check if performance.memory is available (Chrome only)
    if (window.performance && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      performanceMetrics.memoryUsage.lastCheck = memory.usedJSHeapSize;
      performanceMetrics.memoryUsage.peakUsage = Math.max(
        performanceMetrics.memoryUsage.peakUsage,
        memory.usedJSHeapSize
      );
    }
  },

  endTransition() {
    performanceMetrics.transitionEnd = performance.now();
    const duration = performanceMetrics.transitionEnd - performanceMetrics.transitionStart;
    performanceMetrics.lastTransitionDuration = duration;
    performanceMetrics.transitionCount++;
    performanceMetrics.averageTransitionDuration = 
      (performanceMetrics.averageTransitionDuration * (performanceMetrics.transitionCount - 1) + duration) 
      / performanceMetrics.transitionCount;
    
    return duration;
  },

  recordPreloadMetrics(success: boolean, duration: number) {
    if (success) {
      performanceMetrics.resourceMetrics.preloadSuccess++;
    } else {
      performanceMetrics.resourceMetrics.preloadFailures++;
    }
    performanceMetrics.resourceMetrics.totalPreloadTime += duration;
    performanceMetrics.resourceMetrics.averagePreloadTime = 
      performanceMetrics.resourceMetrics.totalPreloadTime / 
      (performanceMetrics.resourceMetrics.preloadSuccess + performanceMetrics.resourceMetrics.preloadFailures);
  },

  logPerformanceMetrics() {
    console.group('Page Transition Performance Metrics');
    console.log('Transition Metrics:', {
      averageDuration: performanceMetrics.averageTransitionDuration.toFixed(2) + 'ms',
      totalTransitions: performanceMetrics.transitionCount,
      lastDuration: performanceMetrics.lastTransitionDuration.toFixed(2) + 'ms',
    });
    console.log('Resource Metrics:', {
      preloadSuccess: performanceMetrics.resourceMetrics.preloadSuccess,
      preloadFailures: performanceMetrics.resourceMetrics.preloadFailures,
      averagePreloadTime: performanceMetrics.resourceMetrics.averagePreloadTime.toFixed(2) + 'ms',
    });
    console.log('Memory Usage:', {
      current: (performanceMetrics.memoryUsage.lastCheck / 1024 / 1024).toFixed(2) + 'MB',
      peak: (performanceMetrics.memoryUsage.peakUsage / 1024 / 1024).toFixed(2) + 'MB',
    });
    console.groupEnd();
  }
};

// 预加载策略
interface PreloadStrategy {
  priority: 'high' | 'medium' | 'low';
  resources: Set<string>;
  lastAccessed: number;
  accessCount: number;
}

// 添加高级动画效果
const advancedEffects = {
  parallax: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },
  reveal: {
    initial: { scale: 0.95, opacity: 0, filter: "blur(10px)" },
    animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
    exit: { scale: 0.95, opacity: 0, filter: "blur(10px)" },
  },
  slideFade: {
    initial: { x: -20, opacity: 0, filter: "blur(8px)" },
    animate: { x: 0, opacity: 1, filter: "blur(0px)" },
    exit: { x: 20, opacity: 0, filter: "blur(8px)" },
  },
} as const;

// 优化动画配置
const animationConfig = {
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1,
    velocity: 0,
    restDelta: 0.001,
  },
  tween: {
    type: "tween",
    duration: 0.4,
    ease: [0.32, 0.72, 0, 1],
  },
  custom: {
    type: "spring",
    stiffness: 250,
    damping: 25,
    mass: 0.8,
    velocity: 0,
    restDelta: 0.001,
  },
  smooth: {
    type: "spring",
    stiffness: 200,
    damping: 20,
    mass: 0.5,
    velocity: 0,
    restDelta: 0.001,
  },
} as const;

// 添加性能优化配置
const performanceConfig = {
  maxConcurrentAnimations: 2,
  animationTimeout: 1000,
  cleanupInterval: 5000,
  memoryThreshold: 0.8,
} as const;

// 添加动画队列管理器
class AnimationQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private currentAnimations = 0;

  async add(animation: () => Promise<void>) {
    this.queue.push(animation);
    if (!this.isProcessing) {
      await this.process();
    }
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    while (this.queue.length > 0 && this.currentAnimations < performanceConfig.maxConcurrentAnimations) {
      const animation = this.queue.shift();
      if (animation) {
        this.currentAnimations++;
        try {
          await Promise.race([
            animation(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Animation timeout')), performanceConfig.animationTimeout)
            ),
          ]);
        } catch (error) {
          console.error('Animation error:', error);
        } finally {
          this.currentAnimations--;
        }
      }
    }
    this.isProcessing = false;
    if (this.queue.length > 0) {
      requestAnimationFrame(() => this.process());
    }
  }
}

const animationQueue = new AnimationQueue();

// 优化过渡变体
const transitionVariants = {
  fade: {
    initial: { 
      opacity: 0,
      filter: "blur(8px)",
    },
    animate: { 
      opacity: 1,
      filter: "blur(0px)",
      transition: animationConfig.tween,
    },
    exit: { 
      opacity: 0,
      filter: "blur(8px)",
      transition: animationConfig.tween,
    },
  },
  slide: {
    initial: { 
      opacity: 0, 
      y: 20,
      filter: "blur(8px)",
      scale: 0.98,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: animationConfig.spring,
    },
    exit: { 
      opacity: 0, 
      y: -20,
      filter: "blur(8px)",
      scale: 0.98,
      transition: animationConfig.spring,
    },
  },
  scale: {
    initial: { 
      opacity: 0, 
      scale: 0.95,
      filter: "blur(8px)",
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      filter: "blur(0px)",
      transition: animationConfig.custom,
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      filter: "blur(8px)",
      transition: animationConfig.custom,
    },
  },
} as const;

// Optimized preload manager with better resource management
class PreloadManager {
  private strategies = new Map<string, PreloadStrategy>();
  private preloadQueue = new Set<string>();
  private loadedResources = new Set<string>();
  private isPreloading = false;
  private currentPreloads = 0;
  private readonly maxConcurrentPreloads = 2;
  private readonly cleanupInterval = 3600000; // 1 hour

  constructor() {
    this.initializeStrategies();
    this.startCleanupInterval();
  }

  private initializeStrategies() {
    ['critical', 'common', 'optional'].forEach(priority => {
      this.strategies.set(priority, {
        priority: priority as 'high' | 'medium' | 'low',
        resources: new Set(),
        lastAccessed: Date.now(),
        accessCount: 0,
      });
    });
  }

  private startCleanupInterval() {
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  addResource(url: string, strategy: string = 'common') {
    if (this.loadedResources.has(url)) return;

    const currentStrategy = this.strategies.get(strategy);
    if (currentStrategy) {
      currentStrategy.resources.add(url);
      currentStrategy.accessCount++;
      currentStrategy.lastAccessed = Date.now();
      this.preloadQueue.add(url);
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isPreloading || this.currentPreloads >= this.maxConcurrentPreloads) return;

    this.isPreloading = true;
    const resources = Array.from(this.preloadQueue)
      .sort((a, b) => this.getStrategyPriority(b) - this.getStrategyPriority(a));

    for (const url of resources) {
      if (this.currentPreloads >= this.maxConcurrentPreloads) break;

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
      requestIdleCallback(() => this.processQueue());
    }
  }

  private getStrategyPriority(strategy: string): number {
    const data = this.strategies.get(strategy);
    if (!data) return 0;

    const timeSinceLastAccess = Date.now() - data.lastAccessed;
    const accessWeight = data.accessCount;
    const timeWeight = 1 / (timeSinceLastAccess + 1);

    const priorityMultiplier = {
      high: 3,
      medium: 2,
      low: 1,
    }[data.priority];

    return priorityMultiplier * accessWeight * timeWeight;
  }

  private async preloadResource(url: string): Promise<void> {
    const startTime = performance.now();
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.onload = () => {
        const duration = performance.now() - startTime;
        PerformanceMonitor.recordPreloadMetrics(true, duration);
        resolve();
      };
      link.onerror = () => {
        const duration = performance.now() - startTime;
        PerformanceMonitor.recordPreloadMetrics(false, duration);
        reject(new Error(`Failed to preload: ${url}`));
      };
      document.head.appendChild(link);
    });
  }

  cleanup() {
    const now = Date.now();
    for (const [strategy, data] of this.strategies.entries()) {
      if (now - data.lastAccessed > this.cleanupInterval) {
        data.resources.clear();
        data.accessCount = 0;
      }
    }
  }
}

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

// 优化 PageTransition 组件
export const PageTransition: React.FC<PageTransitionProps> = React.memo(({ 
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
  const transitionStartTime = useRef(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 添加动画状态管理
  const [animationState, setAnimationState] = useState<'idle' | 'entering' | 'exiting'>('idle');
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const variants = useMemo(() => {
    if (customTransition) {
      return {
        initial: { 
          opacity: 0, 
          y: 20, 
          scale: customTransition.scale || 0.98,
          filter: `blur(${customTransition.blur || 4}px)`,
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
          scale: customTransition.scale || 0.98,
          filter: `blur(${customTransition.blur || 4}px)`,
        },
      };
    }
    return transitionVariants[transitionType as keyof typeof transitionVariants] || transitionVariants.fade;
  }, [transitionType, customTransition]);

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

    setIsContentReady(false);
    PerformanceMonitor.startTransition();
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
      await new Promise(resolve => setTimeout(resolve, 50));
      await backgroundControls.start('animate');
      await contentControls.start('exit');

      contentReadyTimeoutRef.current = setTimeout(() => {
        setIsContentReady(true);
      }, 100);
    } catch (error) {
      console.error('Animation error:', error);
      if (abTest?.enabled) {
        performanceMetrics.variantPerformance[currentVariant].errors++;
      }
      setIsTransitioning(false);
      setIsContentReady(true);
    }
  }, [backgroundControls, contentControls, disableAnimation, prefersReducedMotion, onTransitionStart, abTest, currentVariant]);

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
        
        const duration = PerformanceMonitor.endTransition();
        
        if (abTest?.enabled) {
          const variantMetrics = performanceMetrics.variantPerformance[currentVariant];
          variantMetrics.total += duration;
          variantMetrics.average = variantMetrics.total / performanceMetrics.transitionCount;
          
          if (duration > 300) {
            variantMetrics.slowTransitions++;
            console.warn(`Slow transition detected in variant ${currentVariant}:`, duration);
          }
        }

        // 每10次过渡记录一次性能指标
        if (performanceMetrics.transitionCount % 10 === 0) {
          PerformanceMonitor.logPerformanceMetrics();
        }

        onTransitionEnd?.();
      } catch (error) {
        console.error('Animation error:', error);
        if (abTest?.enabled) {
          performanceMetrics.variantPerformance[currentVariant].errors++;
        }
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

  // 优化过渡效果
  const handleTransition = useCallback(async () => {
    if (animationState !== 'idle') return;
    
    setAnimationState('entering');
    try {
      await animationQueue.add(async () => {
        await Promise.all([
          backgroundControls.start('animate'),
          contentControls.start('exit'),
        ]);

        await new Promise(resolve => setTimeout(resolve, 50));

        await Promise.all([
          backgroundControls.start('exit'),
          contentControls.start('animate'),
        ]);
      });
    } catch (error) {
      console.error('Animation error:', error);
    } finally {
      setAnimationState('idle');
    }
  }, [backgroundControls, contentControls, animationState]);

  // 添加性能监控
  useEffect(() => {
    const checkPerformance = () => {
      if (window.performance && 'memory' in window.performance) {
        const memory = (window.performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (memoryUsage > performanceConfig.memoryThreshold) {
          console.warn('High memory usage detected:', memoryUsage);
          // 清理未使用的资源
          preloadManager.cleanup();
        }
      }
    };

    const interval = setInterval(checkPerformance, performanceConfig.cleanupInterval);
    return () => clearInterval(interval);
  }, []);

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
              ...animationConfig.spring,
              filter: {
                duration: 0.3,
              },
            }}
            className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 pointer-events-none ${
              transitionDirection === 'forward' ? 'origin-top' : 'origin-bottom'
            }`}
            style={{
              willChange: 'transform, opacity, filter',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
              perspective: '1000px',
              WebkitPerspective: '1000px',
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
            ...animationConfig.spring,
            scale: {
              duration: 0.3,
            },
            filter: {
              duration: 0.2,
            },
          }}
          className={`relative z-10 ${className}`}
          style={{
            willChange: 'transform, opacity, filter',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            perspective: '1000px',
            WebkitPerspective: '1000px',
            opacity: isContentReady ? 1 : 0,
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
});

PageTransition.displayName = 'PageTransition'; 