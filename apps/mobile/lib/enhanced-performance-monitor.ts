/**
 * ============================================================================
 * CIVICSENSE ENHANCED PERFORMANCE MONITOR
 * ============================================================================
 * Comprehensive performance tracking and optimization recommendations
 * for React Native mobile app with database operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// PERFORMANCE TYPES & INTERFACES
// ============================================================================

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  cacheHit: boolean;
  recordCount?: number;
  errorCount?: number;
  metadata?: Record<string, any>;
}

interface DatabaseQueryMetric extends PerformanceMetric {
  queryType: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  table?: string;
  cacheStrategy?: string;
  indexUsed?: boolean;
}

interface ComponentRenderMetric extends PerformanceMetric {
  componentName: string;
  renderType: 'mount' | 'update' | 'unmount';
  propsChanged?: boolean;
  childrenCount?: number;
}

interface PerformanceInsight {
  type: 'bottleneck' | 'optimization' | 'warning' | 'success';
  operation: string;
  message: string;
  recommendation?: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  totalQueries: number;
  averageQueryTime: number;
  cacheHitRate: number;
  slowQueries: DatabaseQueryMetric[];
  memoryUsage?: number;
  insights: PerformanceInsight[];
}

// ============================================================================
// ENHANCED PERFORMANCE MONITOR CLASS
// ============================================================================

export class EnhancedPerformanceMonitor {
  private static instance: EnhancedPerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private insights: PerformanceInsight[] = [];
  private readonly MAX_METRICS = 1000;
  private readonly SLOW_QUERY_THRESHOLD = 500; // ms
  private readonly HIGH_MEMORY_THRESHOLD = 150; // MB
  
  // Performance thresholds
  private readonly THRESHOLDS = {
    database: {
      slow: 500,
      critical: 1000,
      timeout: 5000,
    },
    render: {
      slow: 16.67, // 60fps threshold
      critical: 33.33, // 30fps threshold
    },
    cache: {
      lowHitRate: 0.7, // Below 70%
      targetHitRate: 0.85, // Above 85%
    },
  };

  static getInstance(): EnhancedPerformanceMonitor {
    if (!EnhancedPerformanceMonitor.instance) {
      EnhancedPerformanceMonitor.instance = new EnhancedPerformanceMonitor();
    }
    return EnhancedPerformanceMonitor.instance;
  }

  // ============================================================================
  // DATABASE QUERY TRACKING
  // ============================================================================

  trackDatabaseQuery(
    operation: string,
    startTime: number,
    options: {
      cacheHit?: boolean;
      recordCount?: number;
      queryType?: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
      table?: string;
      cacheStrategy?: string;
      indexUsed?: boolean;
      error?: boolean;
    } = {}
  ): void {
    const duration = performance.now() - startTime;
    
    const metric: DatabaseQueryMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      cacheHit: options.cacheHit || false,
      ...(options.recordCount !== undefined && { recordCount: options.recordCount }),
      errorCount: options.error ? 1 : 0,
      queryType: options.queryType || 'select',
      ...(options.table && { table: options.table }),
      ...(options.cacheStrategy && { cacheStrategy: options.cacheStrategy }),
      ...(options.indexUsed !== undefined && { indexUsed: options.indexUsed }),
      metadata: {
        queryType: options.queryType,
        table: options.table,
      },
    };

    this.addMetric(metric);
    this.analyzeQueryPerformance(metric);
    
    // Only log slow queries in development to reduce noise
    if (__DEV__ && duration > this.THRESHOLDS.database.slow) {
      const logLevel = duration > this.THRESHOLDS.database.critical ? 'error' : 'warn';
      
      console[logLevel](
        `[PERF] Slow DB Query: ${operation} (${duration.toFixed(1)}ms) ${options.cacheHit ? 'Cache' : 'DB'} ${options.recordCount ? `${options.recordCount} records` : ''}`
      );
    }
  }

  // ============================================================================
  // COMPONENT RENDER TRACKING
  // ============================================================================

  trackComponentRender(
    componentName: string,
    renderType: 'mount' | 'update' | 'unmount',
    startTime: number,
    options: {
      propsChanged?: boolean;
      childrenCount?: number;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const duration = performance.now() - startTime;
    
    const metric: ComponentRenderMetric = {
      operation: `${componentName}_${renderType}`,
      componentName,
      renderType,
      duration,
      timestamp: Date.now(),
      cacheHit: false, // Not applicable for renders
      ...(options.propsChanged !== undefined && { propsChanged: options.propsChanged }),
      ...(options.childrenCount !== undefined && { childrenCount: options.childrenCount }),
      metadata: {
        componentName,
        renderType,
        ...options.metadata,
      },
    };

    this.addMetric(metric);
    this.analyzeRenderPerformance(metric);

    // Real-time logging for slow renders
    if (__DEV__ && duration > this.THRESHOLDS.render.slow) {
      console.warn(
        `[PERF] Slow Render: ${componentName} ${renderType} (${duration.toFixed(1)}ms)`
      );
    }
  }

  // ============================================================================
  // CUSTOM OPERATION TRACKING
  // ============================================================================

  trackOperation(
    operation: string,
    startTime: number,
    options: {
      category?: string;
      metadata?: Record<string, any>;
      recordCount?: number;
    } = {}
  ): void {
    const duration = performance.now() - startTime;
    
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      cacheHit: false,
      ...(options.recordCount !== undefined && { recordCount: options.recordCount }),
      metadata: {
        ...(options.category && { category: options.category }),
        ...options.metadata,
      },
    };

    this.addMetric(metric);
  }

  // ============================================================================
  // PERFORMANCE ANALYSIS
  // ============================================================================

  private analyzeQueryPerformance(metric: DatabaseQueryMetric): void {
    const { operation, duration, cacheHit, recordCount } = metric;

    // Slow query detection
    if (duration > this.THRESHOLDS.database.slow && !cacheHit) {
      this.addInsight({
        type: 'bottleneck',
        operation,
        message: `Slow database query detected: ${duration.toFixed(1)}ms`,
        recommendation: this.getQueryOptimizationTip(operation, duration, recordCount),
        impact: duration > this.THRESHOLDS.database.critical ? 'high' : 'medium',
        timestamp: Date.now(),
      });
    }

    // Cache miss patterns
    if (!cacheHit && duration > 200) {
      this.addInsight({
        type: 'optimization',
        operation,
        message: `Consider caching strategy for ${operation}`,
        recommendation: `Add caching with appropriate TTL for this ${metric.queryType} operation`,
        impact: 'medium',
        timestamp: Date.now(),
      });
    }

    // Large result set handling
    if (recordCount && recordCount > 100) {
      this.addInsight({
        type: 'optimization',
        operation,
        message: `Large result set: ${recordCount} records`,
        recommendation: 'Consider pagination or virtual scrolling for better performance',
        impact: recordCount > 500 ? 'high' : 'medium',
        timestamp: Date.now(),
      });
    }
  }

  private analyzeRenderPerformance(metric: ComponentRenderMetric): void {
    const { componentName, duration, renderType } = metric;

    if (duration > this.THRESHOLDS.render.critical) {
      this.addInsight({
        type: 'bottleneck',
        operation: componentName,
        message: `Critical render performance: ${duration.toFixed(1)}ms`,
        recommendation: 'Consider React.memo(), useMemo(), or component splitting',
        impact: 'high',
        timestamp: Date.now(),
      });
    } else if (duration > this.THRESHOLDS.render.slow) {
      this.addInsight({
        type: 'warning',
        operation: componentName,
        message: `Slow render detected: ${duration.toFixed(1)}ms`,
        recommendation: 'Review component complexity and prop dependencies',
        impact: 'medium',
        timestamp: Date.now(),
      });
    }
  }

  // ============================================================================
  // PERFORMANCE INSIGHTS & RECOMMENDATIONS
  // ============================================================================

  private getQueryOptimizationTip(
    operation: string, 
    duration: number, 
    recordCount?: number
  ): string {
    // Specific recommendations based on operation patterns
    if (operation.includes('Category')) {
      return 'Add composite index on (is_active, display_order) for category queries';
    }
    
    if (operation.includes('Topic')) {
      return 'Consider GIN index on categories JSONB field for topic filtering';
    }
    
    if (operation.includes('Question')) {
      return 'Add covering index including question text and options for faster retrieval';
    }
    
    if (operation.includes('Progress')) {
      return 'Consider denormalizing user progress data or adding Redis cache';
    }

    // Generic recommendations
    if (recordCount && recordCount > 50) {
      return 'Use pagination or limit result sets, consider adding database indexes';
    }
    
    return 'Review query execution plan and consider adding appropriate indexes';
  }

  // ============================================================================
  // METRICS MANAGEMENT
  // ============================================================================

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep metrics array manageable
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS / 2);
    }
  }

  private addInsight(insight: PerformanceInsight): void {
    // Avoid duplicate insights for the same operation within 5 minutes
    const recentSimilar = this.insights.find(
      i => i.operation === insight.operation && 
           Date.now() - i.timestamp < 300000 &&
           i.type === insight.type
    );
    
    if (!recentSimilar) {
      this.insights.push(insight);
      
      // Keep insights manageable
      if (this.insights.length > 100) {
        this.insights = this.insights.slice(-50);
      }
    }
  }

  // ============================================================================
  // PERFORMANCE REPORTING
  // ============================================================================

  getPerformanceSnapshot(): PerformanceSnapshot {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes
    
    const dbQueries = recentMetrics.filter(m => 'queryType' in m) as DatabaseQueryMetric[];
    const totalQueries = dbQueries.length;
    const cacheHits = dbQueries.filter(m => m.cacheHit).length;
    const slowQueries = dbQueries.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD);
    
    return {
      timestamp: now,
      totalQueries,
      averageQueryTime: totalQueries > 0 ? 
        dbQueries.reduce((sum, m) => sum + m.duration, 0) / totalQueries : 0,
      cacheHitRate: totalQueries > 0 ? cacheHits / totalQueries : 0,
      slowQueries: slowQueries.slice(-10), // Last 10 slow queries
      insights: this.insights.slice(-20), // Last 20 insights
    };
  }

  getDetailedReport(): {
    summary: PerformanceSnapshot;
    topBottlenecks: { operation: string; avgDuration: number; count: number }[];
    cacheEffectiveness: { operation: string; hitRate: number; totalQueries: number }[];
    recommendations: PerformanceInsight[];
  } {
    const snapshot = this.getPerformanceSnapshot();
    const recentMetrics = this.metrics.filter(m => Date.now() - m.timestamp < 1800000); // Last 30 minutes
    
    // Calculate top bottlenecks
    const operationStats = new Map<string, { durations: number[]; cacheHits: number; total: number }>();
    
    recentMetrics.forEach(metric => {
      if (!operationStats.has(metric.operation)) {
        operationStats.set(metric.operation, { durations: [], cacheHits: 0, total: 0 });
      }
      const stats = operationStats.get(metric.operation)!;
      stats.durations.push(metric.duration);
      stats.total++;
      if (metric.cacheHit) stats.cacheHits++;
    });

    const topBottlenecks = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        avgDuration: stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length,
        count: stats.total,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    const cacheEffectiveness = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        hitRate: stats.cacheHits / stats.total,
        totalQueries: stats.total,
      }))
      .filter(item => item.totalQueries >= 3) // Only show operations with sufficient data
      .sort((a, b) => a.hitRate - b.hitRate)
      .slice(0, 10);

    return {
      summary: snapshot,
      topBottlenecks,
      cacheEffectiveness,
      recommendations: this.insights
        .filter(i => i.impact === 'high')
        .slice(-10),
    };
  }

  // ============================================================================
  // PERSISTENCE & ANALYTICS
  // ============================================================================

  async persistMetrics(): Promise<void> {
    try {
      const data = {
        metrics: this.metrics.slice(-100), // Keep last 100 metrics
        insights: this.insights.slice(-50), // Keep last 50 insights
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(
        '@civicsense_performance_metrics',
        JSON.stringify(data)
      );
      
      // Reduced development logging
      if (__DEV__ && this.metrics.length > 100) {
        console.log(`[PERF] Metrics persisted (${this.metrics.length} entries)`);
      }
    } catch (error) {
      console.warn('Failed to persist performance metrics:', error);
    }
  }

  async loadPersistedMetrics(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('@civicsense_performance_metrics');
      if (data) {
        const parsed = JSON.parse(data);
        this.metrics = parsed.metrics || [];
        this.insights = parsed.insights || [];
        console.log('📊 Performance metrics loaded from storage');
      }
    } catch (error) {
      console.warn('Failed to load persisted metrics:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  clearMetrics(): void {
    this.metrics = [];
    this.insights = [];
    AsyncStorage.removeItem('@civicsense_performance_metrics');
    console.log('🧹 Performance metrics cleared');
  }

  // Create performance timing decorator
  createTimer(operation: string, options: { category?: string } = {}) {
    const startTime = performance.now();
    
    return {
      end: (metadata?: Record<string, any>) => {
        this.trackOperation(operation, startTime, {
          ...(options.category && { category: options.category }),
          ...(metadata && { metadata }),
        });
      },
    };
  }

  // Memory monitoring (React Native specific)
  async checkMemoryUsage(): Promise<number | undefined> {
    try {
      // Note: This would need platform-specific implementation
      // For now, return undefined to indicate unavailable
      return undefined;
    } catch (error) {
      console.warn('Memory monitoring not available:', error);
      return undefined;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const enhancedPerformanceMonitor = EnhancedPerformanceMonitor.getInstance();

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

if (__DEV__) {
  // Auto-report performance only when there are significant issues (disabled by default)
  const PERFORMANCE_REPORTING_ENABLED = false; // Set to true to enable detailed performance logging
  
  if (PERFORMANCE_REPORTING_ENABLED) {
    setInterval(() => {
      const report = enhancedPerformanceMonitor.getDetailedReport();
      
      if (report.topBottlenecks.length > 0) {
        console.group('[PERF] Performance Report');
        console.log('Top Bottlenecks:', report.topBottlenecks.slice(0, 3));
        console.log('Cache Hit Rate:', report.summary.cacheHitRate.toFixed(2));
        console.log('Avg Query Time:', report.summary.averageQueryTime.toFixed(1), 'ms');
        
        if (report.recommendations.length > 0) {
          console.log('High Priority Recommendations:');
          report.recommendations.slice(0, 3).forEach(rec => {
            console.log(`- ${rec.message}: ${rec.recommendation}`);
          });
        }
        console.groupEnd();
      }
    }, 300000); // Every 5 minutes
  }

  // Persist metrics every 2 minutes (silent)
  setInterval(() => {
    enhancedPerformanceMonitor.persistMetrics();
  }, 120000);
} 