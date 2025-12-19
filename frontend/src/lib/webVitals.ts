import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        onCLS(onPerfEntry);
        onINP(onPerfEntry);
        onFCP(onPerfEntry);
        onLCP(onPerfEntry);
        onTTFB(onPerfEntry);
    } else {
        // Default behavior: Log to console with colors
        const logMetric = (metric: Metric) => {
            const value = Math.round(metric.value * 10) / 10;
            let color = '#999';

            // Color coding based on Web Vitals thresholds
            switch (metric.name) {
                case 'LCP':
                    color = value > 2500 ? (value > 4000 ? '#ef5350' : '#ffa726') : '#66bb6a';
                    break;
                case 'CLS':
                    color = value > 0.1 ? (value > 0.25 ? '#ef5350' : '#ffa726') : '#66bb6a';
                    break;
                case 'INP':
                    color = value > 200 ? (value > 500 ? '#ef5350' : '#ffa726') : '#66bb6a';
                    break;
                case 'FCP':
                    color = value > 1800 ? (value > 3000 ? '#ef5350' : '#ffa726') : '#66bb6a';
                    break;
                case 'TTFB':
                    color = value > 800 ? (value > 1800 ? '#ef5350' : '#ffa726') : '#66bb6a';
                    break;
            }

            console.log(
                `%c ${metric.name} %c ${value}${metric.name === 'CLS' ? '' : 'ms'} `,
                `background: #333; color: white; padding: 2px 4px; border-radius: 2px 0 0 2px;`,
                `background: ${color}; color: white; padding: 2px 4px; border-radius: 0 2px 2px 0; font-weight: bold;`
            );
        };

        onCLS(logMetric);
        onINP(logMetric);
        onFCP(logMetric);
        onLCP(logMetric);
        onTTFB(logMetric);
    }
};

export default reportWebVitals;
