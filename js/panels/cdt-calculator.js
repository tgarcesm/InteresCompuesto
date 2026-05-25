import { calculateCDT } from '../lib/finance.js';
import { fmt, pct } from '../utils/format.js';
import { readOptionalNumber } from '../utils/inputs.js';
import { bindToggle } from '../utils/toggles.js';
import { DAYS_PER_YEAR } from '../config/constants.js';

let getReteOn = () => true;
let getGmfOn = () => false;

const els = {
  capital: () => document.getElementById('cdt-capital'),
  dias: () => document.getElementById('cdt-dias'),
  tasa: () => document.getElementById('cdt-tasa'),
  diasLbl: () => document.getElementById('dias-lbl'),
  results: () => document.getElementById('res-cdt'),
};

export function initCdtCalculator() {
  document.getElementById('btn-calc-cdt')?.addEventListener('click', calcCDT);
  els.dias()?.addEventListener('input', updateDias);

  getReteOn = bindToggle({ rowId: 'tog-rete-cdt', toggleId: 'rtog-cdt', defaultOn: true });
  getGmfOn = bindToggle({ rowId: 'tog-gmf-cdt', toggleId: 'gmf-cdt', defaultOn: false });
}

export function updateDias() {
  const dias = readOptionalNumber(els.dias());
  if (els.diasLbl()) {
    els.diasLbl().textContent =
      dias === null ? 'Ej: 365 días ≈ 1 año' : `≈ ${(dias / DAYS_PER_YEAR).toFixed(2)} año(s)`;
  }
}

function setDeductionMetric(id, value, active) {
  const el = document.getElementById(id);
  const wrap = document.getElementById(`${id}-wrap`);
  if (!el || !wrap) return;
  wrap.hidden = !active;
  el.textContent = active ? '− ' + fmt(value) : '$0';
}

export function calcCDT() {
  const capital = readOptionalNumber(els.capital());
  const dias = readOptionalNumber(els.dias());
  const tasa = readOptionalNumber(els.tasa());

  if (capital === null || dias === null || tasa === null) {
    alert('Completa capital, plazo y tasa E.A. para calcular el CDT.');
    return;
  }

  const aplicarRete = getReteOn();
  const aplicarCuatroPorMil = getGmfOn();
  const r = calculateCDT({
    capital,
    dias,
    tasaEA: tasa / 100,
    aplicarRete,
    aplicarCuatroPorMil,
  });

  document.getElementById('r-cap').textContent = fmt(capital);
  document.getElementById('r-bruto').textContent = fmt(r.interesBruto);
  setDeductionMetric('r-rete', r.retefuente, aplicarRete);
  setDeductionMetric('r-gmf', r.cuatroPorMil, aplicarCuatroPorMil);
  document.getElementById('r-neto').textContent = fmt(r.interesNeto);
  document.getElementById('r-pct').textContent = pct(r.rendimientoNetoPct);
  document.getElementById('r-badge').style.display = 'inline-flex';
  document.getElementById('r-tasa').textContent = pct(r.tasaNetaEA);
  document.getElementById('r-final').textContent = fmt(r.capitalFinal);

  document.getElementById('rss').innerHTML = `
    <span>Plazo: <strong>${dias} días</strong> (${(dias / DAYS_PER_YEAR).toFixed(2)} años)</span>
    <span>Tasa: <strong>${pct((tasa / 100) * 100)} E.A.</strong></span>
    <span>Retefuente: <strong>${aplicarRete ? fmt(r.retefuente) : 'No'}</strong></span>
    <span>4×1000: <strong>${aplicarCuatroPorMil ? fmt(r.cuatroPorMil) : 'No'}</strong></span>
    <span>Rend. neto: <strong>${pct(r.rendimientoNetoPct)}</strong></span>`;

  const block = document.getElementById('results-cdt-block');
  els.results()?.classList.add('on');
  block?.classList.add('has-result');
}
