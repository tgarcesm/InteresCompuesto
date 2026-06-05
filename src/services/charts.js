import { Chart } from 'chart.js/auto';
import { CHART_COLORS } from '../config/constants.js';
import { fmt, chartAxisMoney } from '../utils/format.js';

/**
 * Gráfico de barras apiladas reutilizable (Chart.js)
 */
export function createStackedBarChart(canvas, config, existingChart = null) {
  if (existingChart) existingChart.destroy();

  const defaultColors = [CHART_COLORS.capital, CHART_COLORS.interest];

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: config.labels,
      datasets: config.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.color ?? defaultColors[i] ?? CHART_COLORS.capital,
        stack: 's',
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: '#6b7280',
            autoSkip: config.autoSkipX ?? false,
            maxRotation: config.maxRotationX ?? 0,
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        y: {
          stacked: true,
          ticks: {
            color: '#6b7280',
            callback: chartAxisMoney,
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
    },
  });
}

/**
 * Líneas de capital total por escenario (varianza de tasa)
 */
export function createScenarioLineChart(canvas, config, existingChart = null) {
  if (existingChart) existingChart.destroy();

  const hasSecondaryAxis = config.datasets.some((ds) => ds.yAxisID === 'y2');

  const scales = {
    x: {
      ticks: {
        color: '#6b7280',
        autoSkip: config.autoSkipX ?? false,
        maxRotation: config.maxRotationX ?? 0,
      },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    y: {
      position: 'left',
      ticks: { color: '#6b7280', callback: chartAxisMoney },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
  };

  if (hasSecondaryAxis) {
    scales.y2 = {
      position: 'right',
      ticks: { color: '#92400e', callback: chartAxisMoney },
      grid: { drawOnChartArea: false },
    };
  }

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: config.labels,
      datasets: config.datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.color + '22',
        borderWidth: ds.dashed ? 1.5 : 2,
        borderDash: ds.dashed ? [6, 4] : [],
        pointRadius: ds.dashed ? 2 : 3,
        tension: 0.25,
        fill: false,
        yAxisID: ds.yAxisID || 'y',
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: '#6b7280', boxWidth: 10, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}`,
          },
        },
      },
      scales,
    },
  });
}

export function destroyChart(chart) {
  if (chart) {
    chart.destroy();
    return null;
  }
  return null;
}
