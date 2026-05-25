const LOCALE = 'es-CO';

/** Formato monetario colombiano: $1.234.567 */
export function fmt(value) {
  return '$' + Math.round(value).toLocaleString(LOCALE);
}

/** Porcentaje con dos decimales */
export function pct(value) {
  return (+value).toFixed(2) + '%';
}

/** Eje Y compacto para gráficos Chart.js */
export function chartAxisMoney(value) {
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
  return '$' + (value / 1e3).toFixed(0) + 'K';
}
