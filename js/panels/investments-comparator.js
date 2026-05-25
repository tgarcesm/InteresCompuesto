import { projectInvestment } from '../lib/finance.js';
import { fmt, pct } from '../utils/format.js';
import { readOptionalNumber, readNumber } from '../utils/inputs.js';
import { createStackedBarChart, destroyChart } from '../services/charts.js';

/** @type {{ nombre: string, capital: number, dias: number, tasa: number, rete: boolean }[]} */
let investments = [];
let compareChart = null;

export function initInvestmentsComparator() {
  document.getElementById('btn-toggle-add')?.addEventListener('click', toggleAddForm);
  document.getElementById('btn-add-inv')?.addEventListener('click', addInvestment);
  document.getElementById('btn-cancel-add')?.addEventListener('click', toggleAddForm);
  document.getElementById('f-anio')?.addEventListener('change', renderComparator);
  document.getElementById('f-orden')?.addEventListener('change', renderComparator);
  renderComparator();
}

function toggleAddForm() {
  const panel = document.getElementById('add-p');
  panel?.classList.toggle('open');
  if (panel?.classList.contains('open')) {
    setTimeout(() => document.getElementById('inv-nom')?.focus(), 50);
  }
}

function addInvestment() {
  const nombre =
    document.getElementById('inv-nom')?.value.trim() || `CDT ${investments.length + 1}`;
  const capital = readNumber(document.getElementById('inv-cap'), 0);
  const dias = readNumber(document.getElementById('inv-dias'), 360);
  const tasaVal = readOptionalNumber(document.getElementById('inv-tasa'));
  if (tasaVal === null) {
    alert('Ingresa la tasa E.A. del CDT.');
    return;
  }
  const tasa = tasaVal / 100;
  const rete = document.getElementById('inv-rete')?.value === '1';

  investments.push({ nombre, capital, dias, tasa, rete });

  document.getElementById('add-p')?.classList.remove('open');
  document.getElementById('inv-nom').value = '';
  renderComparator();
}

function removeInvestment(index) {
  investments.splice(index, 1);
  renderComparator();
}

function sortData(data, orden) {
  const sorted = [...data];
  if (orden === 'rend') sorted.sort((a, b) => b.interesNeto - a.interesNeto);
  else if (orden === 'tasa') sorted.sort((a, b) => b.tasaNetaEA - a.tasaNetaEA);
  else sorted.sort((a, b) => b.capitalFinal - a.capitalFinal);
  return sorted;
}

export function renderComparator() {
  const anios = parseInt(document.getElementById('f-anio')?.value, 10) || 1;
  const orden = document.getElementById('f-orden')?.value || 'rend';
  const lista = document.getElementById('inv-lista');
  const tbl = document.getElementById('comp-tbl');
  const chartWrap = document.getElementById('comp-chart-w');
  const divider = document.getElementById('comp-div');

  if (investments.length === 0) {
    lista.innerHTML =
      '<div class="empty"><span class="empty-icon">📊</span>Agrega tu primer CDT para comenzar a comparar.</div>';
    tbl.innerHTML = '';
    chartWrap.style.display = 'none';
    divider.style.display = 'none';
    compareChart = destroyChart(compareChart);
    return;
  }

  lista.innerHTML = investments
    .map(
      (inv, i) => `
    <div class="inv-card">
      <div>
        <div class="inv-name">${inv.nombre} <span class="badge bd-gy">${inv.dias} días</span>${!inv.rete ? ' <span class="badge bd-bl">sin rete</span>' : ''}</div>
        <div class="inv-meta">${fmt(inv.capital)} &nbsp;·&nbsp; ${pct(inv.tasa * 100)} E.A.</div>
      </div>
      <button class="btn-del" data-remove="${i}" title="Eliminar">✕</button>
    </div>`
    )
    .join('');

  lista.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => removeInvestment(+btn.dataset.remove));
  });

  let data = investments.map((inv) => ({
    ...inv,
    ...projectInvestment(
      { capital: inv.capital, tasaEA: inv.tasa, aplicarRete: inv.rete },
      anios
    ),
  }));

  data = sortData(
    data.map((d) => ({
      ...d,
      intB: d.interesBruto,
      reteV: d.retefuente,
      intN: d.interesNeto,
      capF: d.capitalFinal,
      tNetaEA: d.tasaNetaEA,
    })),
    orden
  );

  divider.style.display = '';

  let html = `<div class="tw"><table><thead><tr>
    <th>Inversión</th><th>Capital</th><th>Interés bruto</th><th>Retefuente</th><th>Interés neto</th><th>Tasa neta E.A.</th><th>Capital final</th>
  </tr></thead><tbody>`;

  data.forEach((d, i) => {
    const best = i === 0 && data.length > 1;
    html += `<tr class="${best ? 'best-row' : ''}">
      <td>${d.nombre}${best ? ' <span class="badge bd-gn">mejor</span>' : ''}</td>
      <td>${fmt(d.capital)}</td><td>${fmt(d.intB)}</td>
      <td style="color:var(--red)">−${fmt(d.reteV)}</td>
      <td class="${best ? 'best' : ''}">${fmt(d.intN)}</td>
      <td class="${best ? 'best' : ''}">${pct(d.tNetaEA)}</td>
      <td class="${best ? 'best' : ''}">${fmt(d.capF)}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  tbl.innerHTML = html;

  chartWrap.style.display = 'block';
  document.getElementById('comp-leg').innerHTML =
    '<span><span class="ldot" style="background:#1a56db"></span>Capital inicial</span>' +
    '<span><span class="ldot" style="background:#059669"></span>Interés neto</span>';

  const canvas = document.getElementById('compC');
  compareChart = createStackedBarChart(
    canvas,
    {
      labels: data.map((d) => d.nombre),
      datasets: [
        { label: 'Capital inicial', data: data.map((d) => d.capital) },
        { label: 'Interés neto', data: data.map((d) => Math.round(d.intN)) },
      ],
    },
    compareChart
  );
}
