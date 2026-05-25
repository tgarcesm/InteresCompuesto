import {
  calculateCompoundInterest,
  buildRateScenarios,
  simulateCajitaCDT,
} from '../lib/finance.js';
import { fmt, pct } from '../utils/format.js';
import { readOptionalNumber, readNumber } from '../utils/inputs.js';
import { bindToggle } from '../utils/toggles.js';
import { CHART_SCENARIO_COLORS } from '../config/constants.js';
import {
  createStackedBarChart,
  createScenarioLineChart,
  destroyChart,
} from '../services/charts.js';

let compoundChart = null;
let getCpReteOn = () => false;
let getCpGmfOn = () => false;
let getCajitaOn = () => false;

function readCompoundInputs() {
  const tasa = readOptionalNumber(document.getElementById('cp-tasa'));
  const anios = readOptionalNumber(document.getElementById('cp-anios'));
  if (tasa === null || anios === null) return null;

  return {
    aporteInicial: readNumber(document.getElementById('cp-ini'), 0),
    aporteMensual: readNumber(document.getElementById('cp-men'), 0),
    tasaEA: tasa / 100,
    anios,
    periodosPorAnio: readNumber(document.getElementById('cp-freq'), 12),
    varianzaPp: readOptionalNumber(document.getElementById('cp-varianza')),
    aplicarRete: getCpReteOn(),
    aplicarCuatroPorMil: getCpGmfOn(),
  };
}

function readCajitaInputs() {
  const tasa = readOptionalNumber(document.getElementById('cp-tasa'));
  const anios = readOptionalNumber(document.getElementById('cp-anios'));
  const tasaCajita = readOptionalNumber(document.getElementById('cp-tasa-cajita'));
  const plazoCdt = readOptionalNumber(document.getElementById('cp-plazo-cdt'));

  if (tasa === null || anios === null || tasaCajita === null || plazoCdt === null) return null;

  return {
    capitalInicial: readNumber(document.getElementById('cp-ini'), 0),
    aporteMensual: readNumber(document.getElementById('cp-men'), 0),
    tasaCdtEA: tasa / 100,
    tasaCajitaEA: tasaCajita / 100,
    plazoCdtDias: plazoCdt,
    anios,
    aplicarRete: getCpReteOn(),
    aplicarCuatroPorMil: getCpGmfOn(),
  };
}

function renderYearlyTable(snapshots) {
  return (
    `<table><thead><tr><th>Año</th><th>Aportado acum.</th><th>Interés neto</th><th>Capital neto</th><th>Rendimiento</th></tr></thead><tbody>` +
    snapshots
      .map(
        (row) => `<tr>
      <td>${row.year}</td>
      <td>${fmt(row.aportadoAcum)}</td>
      <td>${fmt(row.interesesAcum)}</td>
      <td>${fmt(row.capitalTotal)}</td>
      <td style="color:var(--green);font-weight:600">${pct(row.rendimientoPct)}</td>
    </tr>`
      )
      .join('') +
    '</tbody></table>'
  );
}

function renderCajitaTable(snapshots) {
  return (
    `<table><thead><tr><th>Año</th><th>CDT</th><th>Cajita</th><th>Total</th><th>Ciclos</th><th>Int. CDT</th><th>Int. Cajita</th></tr></thead><tbody>` +
    snapshots
      .map(
        (row) => `<tr>
      <td>${row.year}</td>
      <td>${fmt(row.saldoCdt)}</td>
      <td>${fmt(row.saldoCajita)}</td>
      <td style="font-weight:600">${fmt(row.totalCombinado)}</td>
      <td>${row.ciclosAcum}</td>
      <td style="color:var(--green)">${fmt(row.interesesCdt)}</td>
      <td style="color:var(--amber)">${fmt(row.interesesCajita)}</td>
    </tr>`
      )
      .join('') +
    '</tbody></table>'
  );
}

function renderVarianceBlock(scenarios) {
  const sec = document.getElementById('cp-variance-sec');
  if (!scenarios) {
    sec.hidden = true;
    return;
  }
  sec.hidden = false;

  const labels = { bajo: 'Escenario bajo', base: 'Escenario base', alto: 'Escenario alto' };
  document.getElementById('cp-variance-metrics').innerHTML = ['bajo', 'base', 'alto']
    .map((key) => {
      const r = scenarios[key];
      return `<div class="metric metric--scenario metric--${key}">
        <div class="m-label">${labels[key]} (${pct(r.tasaEA * 100)} E.A.)</div>
        <div class="m-val">${fmt(r.capitalFinal)}</div>
        <div class="m-sub">Interés neto: ${fmt(r.totalIntereses)}</div>
      </div>`;
    })
    .join('');
}

function updateCpDeductions(result) {
  const showRete = result.retefuente > 0;
  const showGmf = result.cuatroPorMil > 0;
  document.getElementById('cp-rete-wrap').hidden = !showRete;
  document.getElementById('cp-gmf-wrap').hidden = !showGmf;
  if (showRete) document.getElementById('cp-rete').textContent = '− ' + fmt(result.retefuente);
  if (showGmf) document.getElementById('cp-gmf').textContent = '− ' + fmt(result.cuatroPorMil);
}

function toggleCajitaUI(active) {
  document.getElementById('cajita-fields').hidden = !active;
  const menLabel = document.querySelector('label[for="cp-men"]');
  if (menLabel) {
    menLabel.textContent = active ? 'Aportes mensuales a cajita ($)' : 'Aportes mensuales ($)';
  }
}

export function initCompoundInterest() {
  document.getElementById('btn-calc-cp')?.addEventListener('click', calcCompoundInterest);
  getCpReteOn = bindToggle({ rowId: 'tog-rete-cp', toggleId: 'rtog-cp', defaultOn: false });
  getCpGmfOn = bindToggle({ rowId: 'tog-gmf-cp', toggleId: 'gmf-cp', defaultOn: false });
  getCajitaOn = bindToggle({
    rowId: 'tog-cajita',
    toggleId: 'tog-cajita-switch',
    defaultOn: false,
    onChange: toggleCajitaUI,
  });
}

export function calcCompoundInterest() {
  if (getCajitaOn()) {
    calcCajitaMode();
  } else {
    calcStandardMode();
  }
}

function calcCajitaMode() {
  const inputs = readCajitaInputs();
  if (!inputs) {
    alert('Completa tasa E.A. del CDT, tasa cajita, plazo CDT y años.');
    return;
  }

  const result = simulateCajitaCDT(inputs);

  document.getElementById('cp-metrics-standard').hidden = true;
  document.getElementById('cp-metrics-cajita').hidden = false;
  document.getElementById('cp-results-label').textContent = 'Resultados cajita + CDT';

  document.getElementById('cj-ciclos').textContent = result.ciclos;
  document.getElementById('cj-aportado').textContent = fmt(result.totalAportado);
  document.getElementById('cj-int-cdt').textContent = fmt(result.interesesCdt);
  document.getElementById('cj-int-cajita').textContent = fmt(result.interesesCajita);
  document.getElementById('cj-saldo-cdt').textContent = fmt(result.saldoCdt);
  document.getElementById('cj-saldo-cajita').textContent = fmt(result.saldoCajita);
  document.getElementById('cj-final').textContent = fmt(result.capitalFinal);
  document.getElementById('cj-rend').textContent = pct(result.rendimientoTotalPct);

  const showRete = result.retefuente > 0;
  const showGmf = result.cuatroPorMil > 0;
  document.getElementById('cj-rete-wrap').hidden = !showRete;
  document.getElementById('cj-gmf-wrap').hidden = !showGmf;
  if (showRete) document.getElementById('cj-rete').textContent = '− ' + fmt(result.retefuente);
  if (showGmf) document.getElementById('cj-gmf').textContent = '− ' + fmt(result.cuatroPorMil);

  document.getElementById('cp-tabla').innerHTML = renderCajitaTable(result.yearlySnapshots);
  document.getElementById('cp-variance-sec').hidden = true;

  document.getElementById('res-cp')?.classList.add('on');
  document.getElementById('cp-chart-sec')?.classList.add('on');
  document.getElementById('results-cp-block')?.classList.add('has-result');

  const canvas = document.getElementById('cpC');
  const labels = result.yearlySnapshots.map((r) => 'Año ' + r.year);
  compoundChart = destroyChart(compoundChart);

  document.getElementById('cp-chart-legend-base').hidden = true;
  document.getElementById('cp-chart-legend-var').hidden = true;

  compoundChart = createScenarioLineChart(canvas, {
    labels,
    datasets: [
      {
        label: 'Saldo CDT',
        data: result.yearlySnapshots.map((r) => Math.round(r.saldoCdt)),
        color: '#1a56db',
      },
      {
        label: 'Saldo cajita',
        data: result.yearlySnapshots.map((r) => Math.round(r.saldoCajita)),
        color: '#d97706',
      },
      {
        label: 'Total combinado',
        data: result.yearlySnapshots.map((r) => Math.round(r.totalCombinado)),
        color: '#059669',
      },
    ],
    autoSkipX: labels.length > 12,
    maxRotationX: 45,
  });
}

function calcStandardMode() {
  const inputs = readCompoundInputs();
  if (!inputs) {
    alert('Ingresa la tasa E.A. y los años para proyectar el interés compuesto.');
    return;
  }

  document.getElementById('cp-metrics-standard').hidden = false;
  document.getElementById('cp-metrics-cajita').hidden = true;
  document.getElementById('cp-results-label').textContent = 'Resultados interés compuesto';

  const base = calculateCompoundInterest(inputs);
  const rateScenarios = buildRateScenarios(inputs.tasaEA, inputs.varianzaPp);

  document.getElementById('cp-ap').textContent = fmt(base.totalAportado);
  document.getElementById('cp-int').textContent = fmt(base.totalIntereses);
  document.getElementById('cp-fin').textContent = fmt(base.capitalFinal);
  document.getElementById('cp-rend').textContent = pct(base.rendimientoTotalPct);
  updateCpDeductions(base);
  document.getElementById('cp-tabla').innerHTML = renderYearlyTable(base.yearlySnapshots);

  let scenarios = null;
  if (rateScenarios) {
    scenarios = {
      bajo: {
        ...calculateCompoundInterest({ ...inputs, tasaEA: rateScenarios.bajo }),
        tasaEA: rateScenarios.bajo,
      },
      base: { ...base, tasaEA: rateScenarios.base },
      alto: {
        ...calculateCompoundInterest({ ...inputs, tasaEA: rateScenarios.alto }),
        tasaEA: rateScenarios.alto,
      },
    };
  }
  renderVarianceBlock(scenarios);

  document.getElementById('res-cp')?.classList.add('on');
  document.getElementById('cp-chart-sec')?.classList.add('on');
  document.getElementById('results-cp-block')?.classList.add('has-result');

  const canvas = document.getElementById('cpC');
  const labels = base.yearlySnapshots.map((r) => 'Año ' + r.year);
  compoundChart = destroyChart(compoundChart);

  if (scenarios) {
    document.getElementById('cp-chart-legend-base').hidden = true;
    document.getElementById('cp-chart-legend-var').hidden = false;
    compoundChart = createScenarioLineChart(canvas, {
      labels,
      datasets: [
        {
          label: `Bajo (${pct(scenarios.bajo.tasaEA * 100)})`,
          data: scenarios.bajo.yearlySnapshots.map((r) => Math.round(r.capitalTotal)),
          color: CHART_SCENARIO_COLORS.bajo,
        },
        {
          label: `Base (${pct(scenarios.base.tasaEA * 100)})`,
          data: scenarios.base.yearlySnapshots.map((r) => Math.round(r.capitalTotal)),
          color: CHART_SCENARIO_COLORS.base,
        },
        {
          label: `Alto (${pct(scenarios.alto.tasaEA * 100)})`,
          data: scenarios.alto.yearlySnapshots.map((r) => Math.round(r.capitalTotal)),
          color: CHART_SCENARIO_COLORS.alto,
        },
      ],
      autoSkipX: labels.length > 12,
      maxRotationX: 45,
    });
  } else {
    document.getElementById('cp-chart-legend-base').hidden = false;
    document.getElementById('cp-chart-legend-var').hidden = true;
    compoundChart = createStackedBarChart(canvas, {
      labels,
      datasets: [
        {
          label: 'Capital aportado',
          data: base.yearlySnapshots.map((r) => Math.round(r.aportadoAcum)),
        },
        {
          label: 'Intereses netos',
          data: base.yearlySnapshots.map((r) => Math.round(r.interesesAcum)),
        },
      ],
      autoSkipX: labels.length > 12,
      maxRotationX: 45,
    });
  }
}
