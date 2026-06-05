import { useEffect, useRef } from 'react';
import { createScenarioLineChart, destroyChart } from '../../services/charts.js';

export default function ScenarioLineChart({ config, ariaLabel }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const configKey = config ? JSON.stringify(config) : '';

  useEffect(() => {
    if (!canvasRef.current || !config) return;
    chartRef.current = createScenarioLineChart(canvasRef.current, config, chartRef.current);
    return () => {
      chartRef.current = destroyChart(chartRef.current);
    };
  }, [configKey, config]);

  return (
    <canvas ref={canvasRef} role="img" aria-label={ariaLabel || 'Gráfico de escenarios'} />
  );
}
