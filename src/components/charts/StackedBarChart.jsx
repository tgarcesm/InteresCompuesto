import { useEffect, useRef } from 'react';
import { createStackedBarChart, destroyChart } from '../../services/charts.js';

export default function StackedBarChart({ config, ariaLabel }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const configKey = config ? JSON.stringify(config) : '';

  useEffect(() => {
    if (!canvasRef.current || !config) return;
    chartRef.current = createStackedBarChart(canvasRef.current, config, chartRef.current);
    return () => {
      chartRef.current = destroyChart(chartRef.current);
    };
  }, [configKey, config]);

  return (
    <canvas ref={canvasRef} role="img" aria-label={ariaLabel || 'Gráfico de barras'} />
  );
}
