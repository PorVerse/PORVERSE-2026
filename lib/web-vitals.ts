import { onCLS, onFCP, onLCP, type Metric } from 'web-vitals';

export function initWebVitals() {
  function sendMetric(metric: Metric) {
    void fetch('/api/analytics/web-vitals', {
      method: 'POST',
      body: JSON.stringify(metric)
    });
  }
  
  onCLS(sendMetric);
  onFCP(sendMetric);
  onLCP(sendMetric);
}
