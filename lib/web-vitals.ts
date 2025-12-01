import { onCLS, onFCP, onLCP } from 'web-vitals';

export function initWebVitals() {
  function sendMetric(metric) {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      body: JSON.stringify(metric)
    });
  }
  
  onCLS(sendMetric);
  onFCP(sendMetric);
  onLCP(sendMetric);
}
