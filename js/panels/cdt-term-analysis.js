import { compareShortVsLong } from '../lib/finance.js';
import { pct } from '../utils/format.js';
import { readOptionalNumber } from '../utils/inputs.js';

const VERDICT_COPY = {
  corto: {
    icon: '✅',
    title: 'Conviene el CDT corto',
    className: 'verdict v-corto',
    diffSub: 'corto es mejor',
    sub: (eaCorto, eaLargo, diff) =>
      `La tasa del CDT corto equivale a un ${pct(eaCorto * 100)} E.A., superando el ${pct(eaLargo * 100)} del largo en ${pct(Math.abs(diff))}. Renueva el corto mientras las tasas sigan así.`,
  },
  largo: {
    icon: '🔒',
    title: 'Conviene el CDT largo',
    className: 'verdict v-largo',
    diffSub: 'largo es mejor',
    sub: (eaCorto, eaLargo, diff) =>
      `El CDT largo ofrece ${pct(eaLargo * 100)} E.A., superando la equivalente del corto (${pct(eaCorto * 100)}) en ${pct(Math.abs(diff))}. Asegura la tasa larga hoy.`,
  },
  igual: {
    icon: '⚖️',
    title: 'Tasas prácticamente equivalentes',
    className: 'verdict v-igual',
    diffSub: 'sin diferencia clara',
    sub: (_eaCorto, _eaLargo, diff) =>
      `La diferencia es solo ${pct(Math.abs(diff))}. Elige según tu necesidad de liquidez: corto si podrías necesitar el dinero antes, largo si prefieres estabilidad.`,
  },
};

function resetComparisonUI() {
  document.getElementById('cmp-ea-corto').textContent = '—';
  document.getElementById('cmp-ea-largo').textContent = '—';
  document.getElementById('cmp-diff').textContent = '—';
  document.getElementById('cmp-diff').className = 'm-val';
  document.getElementById('cmp-corto-sub').textContent = 'completa los campos';
  document.getElementById('cmp-diff-sub').textContent = '—';
  document.getElementById('cmp-verdict').className = 'verdict v-igual';
}

export function initCdtTermAnalysis() {
  ['cmp-tcorto', 'cmp-dcorto', 'cmp-tlargo'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', calcComparacion);
  });
  resetComparisonUI();
}

export function calcComparacion() {
  const rCorto = readOptionalNumber(document.getElementById('cmp-tcorto'));
  const dCorto = readOptionalNumber(document.getElementById('cmp-dcorto'));
  const rLargo = readOptionalNumber(document.getElementById('cmp-tlargo'));

  if (rCorto === null || dCorto === null || rLargo === null) {
    resetComparisonUI();
    return;
  }

  const { eaCorto, eaLargo, diffPp, verdict } = compareShortVsLong(
    rCorto / 100,
    dCorto,
    rLargo / 100
  );
  const copy = VERDICT_COPY[verdict];

  const diffEl = document.getElementById('cmp-diff');
  diffEl.textContent = (diffPp >= 0 ? '+' : '') + pct(diffPp);
  diffEl.className = 'm-val ' + (diffPp > 0.05 ? 'grn' : diffPp < -0.05 ? 'red' : 'amb');

  document.getElementById('cmp-ea-corto').textContent = pct(eaCorto * 100);
  document.getElementById('cmp-ea-largo').textContent = pct(eaLargo * 100);
  document.getElementById('cmp-corto-sub').textContent = `${dCorto} días → equiv. anual`;
  document.getElementById('cmp-diff-sub').textContent = copy.diffSub;

  const verd = document.getElementById('cmp-verdict');
  verd.className = copy.className + ' is-visible';
  document.getElementById('cmp-vicon').textContent = copy.icon;
  document.getElementById('cmp-vtitle').textContent = copy.title;
  document.getElementById('cmp-vsub').textContent = copy.sub(eaCorto, eaLargo, diffPp);
}
