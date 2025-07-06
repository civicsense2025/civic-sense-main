// Performance monitor for real-time operations
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  trackLatency(operation: string, startTime: number): void {
    const latency = Date.now() - startTime;
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push(latency);
    
    // Keep only last 100 measurements
    if (this.metrics.get(operation)!.length > 100) {
      this.metrics.get(operation)!.shift();
    }

    // Alert if latency is too high
    if (latency > 1000) {
      console.warn(`High latency detected for ${operation}: ${latency}ms`);
    }
  }

  getAverageLatency(operation: string): number {
    const measurements = this.metrics.get(operation) || [];
    if (measurements.length === 0) return 0;
    
    return measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
  }

  trackMessageFrequency(channel: string): void {
    const key = `messages_${channel}`;
    const now = Date.now();
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push(now);
    
    // Clean old messages (> 1 minute)
    this.metrics.set(key, 
      this.metrics.get(key)!.filter(time => now - time < 60000)
    );
  }
}

export const performanceMonitor = new PerformanceMonitor(); 