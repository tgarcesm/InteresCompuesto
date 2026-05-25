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

  const periodoDias = readNumber(document.getElementById('cp-freq'), 30);
  const periodosPorAnio = Math.round(365 / periodoDias);

  return {
    aporteInicial: readNumber(document.getElementById('cp-ini'), 0),
    aporteMensual: readNumber(document.getElementById('cp-men'), 0),
    tasaEA: tasa / 100,
    anios,
    periodosPorAnio,
    periodoDias,
    varianzaPp: readOptionalNumber(document.getElementById('cp-varianza')),
    aplicarRete: getCpReteOn(),
    aplicarCuatroPorMil: getCpGmfOn(),
  };
}

function readCajitaInputs() {
  const tasa = readOptionalNumber(document.getElementById('cp-tasa'));
  const anios = readOptionalNumber(document.getElementById('cp-anios'));
  const tasaCajita = readOptionalNumber(document.getElementById('cp-tasa-cajita'));
  const periodoDias = readOptionalNumber(document.getElementById('cp-freq'));

  if (tasa === null || anios === null || tasaCajita === null || periodoDias === null) return null;

  return {
    capitalInicial: readNumber(document.getElementById('cp-ini'), 0),
    aporteMensual: readNumber(document.getElementById('cp-men'), 0),
    tasaCdtEA: tasa / 100,
    tasaCajitaEA: tasaCajita / 100,
    periodoCapitalizacionDias: periodoDias,
    anios,
    varianzaPp: readOptionalNumber(document.getElementById('cp-varianza')),
    aplicarRete: getCpReteOn(),
    aplicarCuatroPorMil: getCpGmfOn(),
  };
}

function findInflectionYear(snapshots) {
  for (const row of snapshots) {
    const intereses = row.interesesAcum ?? (row.interesesCdt + row.interesesCajita);
    if (intereses >= row.aportadoAcum) return row.year;
  }
  return null;
}

function renderMainTable(snapshots, isCajita, showRete = false, snapshotsBajo = null, snapshotsAlto = null) {
  const inflection = findInflectionYear(snapshots);
  const hasVarianza = snapshotsBajo && snapshotsAlto;

  const reteHeader = showRete ? '<th>Retefuente acum.</th>' : '';
  const varHeaders = hasVarianza ? '<th>Capital bajo</th><th>Capital alto</th>' : '';

  const header = `<table class="proj-table">
    <thead><tr>
      <th>Año</th>
      <th>Total aportado</th>
      ${hasVarianza ? '<th>Capital base</th>' : '<th>Capital total</th>'}
      ${varHeaders}
      <th>Ganancia del año</th>
      <th>Ganancia acumulada</th>
      ${reteHeader}
      <th>Rendimiento %</th>
    </tr></thead><tbody>`;

  const rows = snapshots.map((row, i) => {
    const interesesAcum = isCajita
      ? row.interesesCdt + row.interesesCajita
      : row.interesesAcum;
    const capital = isCajita ? row.totalCombinado : row.capitalTotal;
    const highlight = row.year === inflection ? ' class="row-inflection"' : '';
    const reteCol = showRete
      ? `<td style="color:var(--red)">− ${fmt(row.reteAcum)}</td>`
      : '';

    let varCols = '';
    if (hasVarianza) {
      const capBajo = isCajita ? snapshotsBajo[i]?.totalCombinado : snapshotsBajo[i]?.capitalTotal;
      const capAlto = isCajita ? snapshotsAlto[i]?.totalCombinado : snapshotsAlto[i]?.capitalTotal;
      varCols = `<td style="color:var(--red)">${fmt(capBajo ?? 0)}</td><td style="color:var(--green)">${fmt(capAlto ?? 0)}</td>`;
    }

    return `<tr${highlight}>
      <td>${row.year}</td>
      <td>${fmt(row.aportadoAcum)}</td>
      <td style="font-weight:600">${fmt(capital)}</td>
      ${varCols}
      <td style="color:var(--green)">${fmt(row.rendimientoAnio)}</td>
      <td style="color:var(--green);font-weight:600">${fmt(interesesAcum)}</td>
      ${reteCol}
      <td style="font-weight:600">${pct(row.rendimientoPct)}</td>
    </tr>`;
  }).join('');

  const footer = '</tbody></table>';

  const inflectionNote = inflection
    ? `<p class="inflection-note">📍 Año ${inflection}: los intereses superan lo aportado — tu dinero trabaja más que tú.</p>`
    : '';

  return header + rows + footer + inflectionNote;
}

function renderDetailTable(snapshots) {
  const header = `<table class="proj-table proj-table--detail">
    <thead><tr>
      <th>Año</th>
      <th>CDT</th>
      <th>Cajita (pico)</th>
      <th>Ciclos</th>
      <th>Int. CDT</th>
      <th>Int. Cajita</th>
    </tr></thead><tbody>`;

  const rows = snapshots.map((row) => `<tr>
    <td>${row.year}</td>
    <td>${fmt(row.saldoCdt)}</td>
    <td>${fmt(row.saldoCajita)}</td>
    <td>${row.ciclosAcum}</td>
    <td style="color:var(--green)">${fmt(row.interesesCdt)}</td>
    <td style="color:var(--amber)">${fmt(row.interesesCajita)}</td>
  </tr>`).join('');

  return header + rows + '</tbody></table>';
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
      const interesNeto = r.totalIntereses ?? (r.interesBrutoTotal - (r.retefuente || 0));
      return `<div class="metric metric--scenario metric--${key}">
        <div class="m-label">${labels[key]} (${pct(r.tasaEA * 100)} E.A.)</div>
        <div class="m-val">${fmt(r.capitalFinal)}</div>
        <div class="m-sub">Interés neto: ${fmt(interesNeto)}</div>
        <div class="m-sub">Rendimiento: ${pct(r.rendimientoTotalPct)}</div>
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
  const freqLabel = document.getElementById('cp-freq-label');
  if (freqLabel) {
    freqLabel.textContent = active
      ? 'Plazo CDT / capitalización (días)'
      : 'Período de capitalización (días)';
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

  const btnDetail = document.getElementById('btn-toggle-detail');
  const detailTable = document.getElementById('cp-tabla-detail');
  btnDetail?.addEventListener('click', () => {
    const showing = !detailTable.hidden;
    detailTable.hidden = showing;
    btnDetail.textContent = showing ? '▶ Ver detalle técnico' : '▼ Ocultar detalle técnico';
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
    alert('Completa tasa E.A. del CDT, tasa cajita, período de capitalización y años.');
    return;
  }

  // Validación varianza
  const rateScenarios = buildRateScenarios(inputs.tasaCdtEA, inputs.varianzaPp);
  if (rateScenarios && rateScenarios.bajo < 0.01) {
    const continuar = confirm(
      `Advertencia: con esa varianza, el escenario bajo sería ${pct(rateScenarios.bajo * 100)} E.A. (menor a 1%). ¿Continuar?`
    );
    if (!continuar) return;
  }

  const result = simulateCajitaCDT(inputs);

  // Calcular escenarios bajo/alto (solo varía la tasa CDT, no la cajita)
  let scenarioBajo = null;
  let scenarioAlto = null;
  if (rateScenarios) {
    scenarioBajo = simulateCajitaCDT({ ...inputs, tasaCdtEA: rateScenarios.bajo });
    scenarioAlto = simulateCajitaCDT({ ...inputs, tasaCdtEA: rateScenarios.alto });
  }

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
  document.getElementById('cj-rete-cdt-wrap').hidden = !showRete;
  document.getElementById('cj-rete-cajita-wrap').hidden = !showRete;
  document.getElementById('cj-rete-total-wrap').hidden = !showRete;
  document.getElementById('cj-gmf-wrap').hidden = !showGmf;
  if (showRete) {
    document.getElementById('cj-rete-cdt').textContent = '− ' + fmt(result.reteCdt);
    document.getElementById('cj-rete-cajita').textContent = '− ' + fmt(result.reteCajita);
    document.getElementById('cj-rete-total').textContent = '− ' + fmt(result.retefuente);
  }
  if (showGmf) document.getElementById('cj-gmf').textContent = '− ' + fmt(result.cuatroPorMil);

  // Bloque de varianza (tarjetas bajo/base/alto)
  if (rateScenarios) {
    renderVarianceBlock({
      bajo: { ...scenarioBajo, tasaEA: rateScenarios.bajo },
      base: { ...result, tasaEA: rateScenarios.base },
      alto: { ...scenarioAlto, tasaEA: rateScenarios.alto },
    });
  } else {
    renderVarianceBlock(null);
  }

  // Tabla
  const tablaEl = document.getElementById('cp-tabla');
  tablaEl.innerHTML = renderMainTable(
    result.yearlySnapshots, true, getCpReteOn(),
    scenarioBajo?.yearlySnapshots, scenarioAlto?.yearlySnapshots
  );
  const detailWrap = document.getElementById('detail-toggle-wrap');
  const detailEl = document.getElementById('cp-tabla-detail');
  if (detailWrap) detailWrap.hidden = false;
  if (detailEl) {
    detailEl.innerHTML = renderDetailTable(result.yearlySnapshots);
    detailEl.hidden = true;
  }
  const btnDt = document.getElementById('btn-toggle-detail');
  if (btnDt) btnDt.textContent = '▶ Ver detalle técnico';

  document.getElementById('res-cp')?.classList.add('on');
  document.getElementById('cp-chart-sec')?.classList.add('on');
  document.getElementById('results-cp-block')?.classList.add('has-result');

  // Gráfica
  const canvas = document.getElementById('cpC');
  const labels = result.yearlySnapshots.map((r) => 'Año ' + r.year);
  compoundChart = destroyChart(compoundChart);

  document.getElementById('cp-chart-legend-base').hidden = true;
  document.getElementById('cp-chart-legend-var').hidden = true;

  if (rateScenarios) {
    compoundChart = createScenarioLineChart(canvas, {
      labels,
      datasets: [
        {
          label: `Bajo (${pct(rateScenarios.bajo * 100)})`,
          data: scenarioBajo.yearlySnapshots.map((r) => Math.round(r.totalCombinado)),
          color: CHART_SCENARIO_COLORS.bajo,
          dashed: true,
        },
        {
          label: 'Capital base',
          data: result.yearlySnapshots.map((r) => Math.round(r.totalCombinado)),
          color: '#1a56db',
        },
        {
          label: `Alto (${pct(rateScenarios.alto * 100)})`,
          data: scenarioAlto.yearlySnapshots.map((r) => Math.round(r.totalCombinado)),
          color: CHART_SCENARIO_COLORS.alto,
          dashed: true,
        },
        {
          label: 'Total aportado',
          data: result.yearlySnapshots.map((r) => Math.round(r.aportadoAcum)),
          color: '#6b7280',
          dashed: true,
        },
      ],
      autoSkipX: labels.length > 12,
      maxRotationX: 45,
    });
  } else {
    compoundChart = createScenarioLineChart(canvas, {
      labels,
      datasets: [
        {
          label: 'Capital total (CDT + cajita)',
          data: result.yearlySnapshots.map((r) => Math.round(r.totalCombinado)),
          color: '#059669',
        },
        {
          label: 'Total aportado',
          data: result.yearlySnapshots.map((r) => Math.round(r.aportadoAcum)),
          color: '#6b7280',
        },
        {
          label: 'Intereses CDT acum.',
          data: result.yearlySnapshots.map((r) => Math.round(r.interesesCdt)),
          color: '#1a56db',
          yAxisID: 'y2',
        },
        {
          label: 'Intereses cajita acum.',
          data: result.yearlySnapshots.map((r) => Math.round(r.interesesCajita)),
          color: '#d97706',
          yAxisID: 'y2',
        },
      ],
      autoSkipX: labels.length > 12,
      maxRotationX: 45,
    });
  }
}

function calcStandardMode() {
  const inputs = readCompoundInputs();
  if (!inputs) {
    alert('Ingresa la tasa E.A. y los años para proyectar el interés compuesto.');
    return;
  }

  const rateScenarios = buildRateScenarios(inputs.tasaEA, inputs.varianzaPp);
  if (rateScenarios && rateScenarios.bajo < 0.01) {
    const continuar = confirm(
      `Advertencia: con esa varianza, el escenario bajo sería ${pct(rateScenarios.bajo * 100)} E.A. (menor a 1%). ¿Continuar?`
    );
    if (!continuar) return;
  }

  document.getElementById('cp-metrics-standard').hidden = false;
  document.getElementById('cp-metrics-cajita').hidden = true;
  document.getElementById('cp-results-label').textContent = 'Resultados interés compuesto';

  const base = calculateCompoundInterest(inputs);

  document.getElementById('cp-ap').textContent = fmt(base.totalAportado);
  document.getElementById('cp-int').textContent = fmt(base.totalIntereses);
  document.getElementById('cp-fin').textContent = fmt(base.capitalFinal);
  document.getElementById('cp-rend').textContent = pct(base.rendimientoTotalPct);
  updateCpDeductions(base);

  let scenarios = null;
  let scenarioBajo = null;
  let scenarioAlto = null;
  if (rateScenarios) {
    scenarioBajo = calculateCompoundInterest({ ...inputs, tasaEA: rateScenarios.bajo });
    scenarioAlto = calculateCompoundInterest({ ...inputs, tasaEA: rateScenarios.alto });
    scenarios = {
      bajo: { ...scenarioBajo, tasaEA: rateScenarios.bajo },
      base: { ...base, tasaEA: rateScenarios.base },
      alto: { ...scenarioAlto, tasaEA: rateScenarios.alto },
    };
  }

  document.getElementById('cp-tabla').innerHTML = renderMainTable(
    base.yearlySnapshots, false, getCpReteOn(),
    scenarioBajo?.yearlySnapshots, scenarioAlto?.yearlySnapshots
  );
  const detailWrapStd = document.getElementById('detail-toggle-wrap');
  if (detailWrapStd) detailWrapStd.hidden = true;
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
          dashed: true,
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
          dashed: true,
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
