// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isProduction = import.meta.env.PROD;
  }

  // Measure page load performance
  measurePageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        domLoad: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        windowLoad: navigation.loadEventEnd - navigation.loadEventStart,
        fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        lcp: this.getLCP(),
      };

      this.recordMetric('page_load', metrics);
      this.logPerformance('Page Load Performance', metrics);
    });
  }

  // Measure component render performance
  measureComponentRender(componentName, startTime) {
    const renderTime = performance.now() - startTime;
    this.recordMetric(`component_render_${componentName}`, renderTime);
    
    if (renderTime > 16) { // 16ms = 60fps threshold
      console.warn(`Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  // Measure API call performance
  measureApiCall(endpoint, startTime) {
    const duration = performance.now() - startTime;
    this.recordMetric(`api_call_${endpoint}`, duration);
    
    if (duration > 1000) { // 1 second threshold
      console.warn(`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  }

  // Get Largest Contentful Paint
  getLCP() {
    if ('PerformanceObserver' in window) {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    }
    return 0;
  }

  // Record metric
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push({
      value,
      timestamp: Date.now(),
    });

    // Keep only last 100 measurements
    if (this.metrics.get(name).length > 100) {
      this.metrics.get(name).shift();
    }
  }

  // Get metric statistics
  getMetricStats(name) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const valuesOnly = values.map(v => v.value);
    return {
      count: values.length,
      min: Math.min(...valuesOnly),
      max: Math.max(...valuesOnly),
      avg: valuesOnly.reduce((a, b) => a + b, 0) / values.length,
      p95: this.getPercentile(valuesOnly, 95),
      p99: this.getPercentile(valuesOnly, 99),
    };
  }

  // Calculate percentile
  getPercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // Log performance data
  logPerformance(title, data) {
    if (this.isProduction) {
      // Send to analytics service in production
      this.sendToAnalytics(title, data);
    } else {
      // Console log in development
      console.group(`📊 ${title}`);
      Object.entries(data).forEach(([key, value]) => {
        console.log(`${key}: ${typeof value === 'number' ? `${value.toFixed(2)}ms` : value}`);
      });
      console.groupEnd();
    }
  }

  // Send to analytics service
  sendToAnalytics(title, data) {
    // TODO: Implement analytics service integration
    // Example: Google Analytics, Mixpanel, etc.
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'performance',
        event_label: title,
        value: data.avg || data.value,
        custom_parameters: data,
      });
    }
  }

  // Monitor memory usage
  monitorMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        
        this.recordMetric('memory_usage', usedMB);
        
        if (usedMB > 100) { // 100MB threshold
          console.warn(`High memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // Monitor long tasks
  monitorLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // 50ms threshold
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
            this.recordMetric('long_tasks', entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // Get performance report
  getPerformanceReport() {
    const report = {};
    
    for (const [name] of this.metrics) {
      report[name] = this.getMetricStats(name);
    }
    
    return report;
  }

  // Start monitoring
  start() {
    this.measurePageLoad();
    this.monitorMemory();
    this.monitorLongTasks();
    
    console.log('🚀 Performance monitoring started');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export const measureComponent = (componentName) => {
  const startTime = performance.now();
  return () => performanceMonitor.measureComponentRender(componentName, startTime);
};

export const measureApiCall = (endpoint) => {
  const startTime = performance.now();
  return () => performanceMonitor.measureApiCall(endpoint, startTime);
};

export const recordMetric = (name, value) => {
  performanceMonitor.recordMetric(name, value);
};

export const getPerformanceReport = () => {
  return performanceMonitor.getPerformanceReport();
};

// Auto-start in production
if (import.meta.env.PROD) {
  performanceMonitor.start();
}

export default performanceMonitor; 