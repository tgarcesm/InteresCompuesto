import { useMemo, useState } from 'react';
import {
  calculateCompoundInterest,
  buildRateScenarios,
  simulateCajitaCDT,
} from '../lib/finance.js';
import { fmt, pct } from '../utils/format.js';
import { CHART_SCENARIO_COLORS } from '../config/constants.js';
import { Card, CardBody } from '../components/ui/Card.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import Metric from '../components/ui/Metric.jsx';
import {
  MoneyInput,
  NumberInput,
  parseNumber,
  parseOptionalNumber,
} from '../components/ui/Field.jsx';
import { MainProjectionTable, DetailProjectionTable } from '../components/compound/ProjectionTable.jsx';
import StackedBarChart from '../components/charts/StackedBarChart.jsx';
import ScenarioLineChart from '../components/charts/ScenarioLineChart.jsx';

const SCENARIO_LABELS = { bajo: 'Escenario bajo', base: 'Escenario base', alto: 'Escenario alto' };

export default function CompoundPage() {
  const [aporteIni, setAporteIni] = useState('');
  const [aporteMen, setAporteMen] = useState('');
  const [tasa, setTasa] = useState('');
  const [anios, setAnios] = useState('');
  const [freq, setFreq] = useState('30');
  const [cajitaOn, setCajitaOn] = useState(false);
  const [tasaCajita, setTasaCajita] = useState('');
  const [aplicarRete, setAplicarRete] = useState(false);
  const [aplicarGmf, setAplicarGmf] = useState(false);
  const [varianza, setVarianza] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [projection, setProjection] = useState(null);

  const menLabel = cajitaOn ? 'Aportes mensuales a cajita ($)' : 'Aportes mensuales ($)';
  const freqLabel = cajitaOn
    ? 'Plazo CDT / capitalización (días)'
    : 'Período de capitalización (días)';

  function handleProject() {
    if (cajitaOn) {
      runCajitaMode();
    } else {
      runStandardMode();
    }
  }

  function runCajitaMode() {
    const tasaVal = parseOptionalNumber(tasa);
    const aniosVal = parseOptionalNumber(anios);
    const tasaCajitaVal = parseOptionalNumber(tasaCajita);
    const periodoDias = parseOptionalNumber(freq);

    if (tasaVal === null || aniosVal === null || tasaCajitaVal === null || periodoDias === null) {
      alert('Completa tasa E.A. del CDT, tasa cajita, período de capitalización y años.');
      return;
    }

    const inputs = {
      capitalInicial: parseNumber(aporteIni, 0),
      aporteMensual: parseNumber(aporteMen, 0),
      tasaCdtEA: tasaVal / 100,
      tasaCajitaEA: tasaCajitaVal / 100,
      periodoCapitalizacionDias: periodoDias,
      anios: aniosVal,
      varianzaPp: parseOptionalNumber(varianza),
      aplicarRete,
      aplicarCuatroPorMil: aplicarGmf,
    };

    const rateScenarios = buildRateScenarios(inputs.tasaCdtEA, inputs.varianzaPp);
    if (rateScenarios && rateScenarios.bajo < 0.01) {
      const continuar = confirm(
        `Advertencia: con esa varianza, el escenario bajo sería ${pct(rateScenarios.bajo * 100)} E.A. (menor a 1%). ¿Continuar?`
      );
      if (!continuar) return;
    }

    const result = simulateCajitaCDT(inputs);
    let scenarioBajo = null;
    let scenarioAlto = null;
    if (rateScenarios) {
      scenarioBajo = simulateCajitaCDT({ ...inputs, tasaCdtEA: rateScenarios.bajo });
      scenarioAlto = simulateCajitaCDT({ ...inputs, tasaCdtEA: rateScenarios.alto });
    }

    const scenarios = rateScenarios
      ? {
          bajo: { ...scenarioBajo, tasaEA: rateScenarios.bajo },
          base: { ...result, tasaEA: rateScenarios.base },
          alto: { ...scenarioAlto, tasaEA: rateScenarios.alto },
        }
      : null;

    setShowDetail(false);
    setProjection({
      mode: 'cajita',
      result,
      scenarios,
      rateScenarios,
      scenarioBajo,
      scenarioAlto,
      aplicarRete,
    });
  }

  function runStandardMode() {
    const tasaVal = parseOptionalNumber(tasa);
    const aniosVal = parseOptionalNumber(anios);

    if (tasaVal === null || aniosVal === null) {
      alert('Ingresa la tasa E.A. y los años para proyectar el interés compuesto.');
      return;
    }

    const periodoDias = parseNumber(freq, 30);
    const inputs = {
      aporteInicial: parseNumber(aporteIni, 0),
      aporteMensual: parseNumber(aporteMen, 0),
      tasaEA: tasaVal / 100,
      anios: aniosVal,
      periodosPorAnio: Math.round(365 / periodoDias),
      periodoDias,
      varianzaPp: parseOptionalNumber(varianza),
      aplicarRete,
      aplicarCuatroPorMil: aplicarGmf,
    };

    const rateScenarios = buildRateScenarios(inputs.tasaEA, inputs.varianzaPp);
    if (rateScenarios && rateScenarios.bajo < 0.01) {
      const continuar = confirm(
        `Advertencia: con esa varianza, el escenario bajo sería ${pct(rateScenarios.bajo * 100)} E.A. (menor a 1%). ¿Continuar?`
      );
      if (!continuar) return;
    }

    const base = calculateCompoundInterest(inputs);
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

    setProjection({
      mode: 'standard',
      result: base,
      scenarios,
      rateScenarios,
      scenarioBajo,
      scenarioAlto,
      aplicarRete,
    });
  }

  const chartConfig = useMemo(() => {
    if (!projection) return null;

    const { mode, result, scenarios, rateScenarios, scenarioBajo, scenarioAlto } = projection;
    const labels = result.yearlySnapshots.map((r) => 'Año ' + r.year);
    const chartOpts = {
      autoSkipX: labels.length > 12,
      maxRotationX: 45,
    };

    if (mode === 'cajita') {
      if (rateScenarios) {
        return {
          type: 'line',
          config: {
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
            ...chartOpts,
          },
          legendBase: false,
          legendVar: false,
        };
      }
      return {
        type: 'line',
        config: {
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
          ...chartOpts,
        },
        legendBase: false,
        legendVar: false,
      };
    }

    if (scenarios) {
      return {
        type: 'line',
        config: {
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
          ...chartOpts,
        },
        legendBase: false,
        legendVar: true,
      };
    }

    return {
      type: 'bar',
      config: {
        labels,
        datasets: [
          {
            label: 'Capital aportado',
            data: result.yearlySnapshots.map((r) => Math.round(r.aportadoAcum)),
          },
          {
            label: 'Intereses netos',
            data: result.yearlySnapshots.map((r) => Math.round(r.interesesAcum)),
          },
        ],
        ...chartOpts,
      },
      legendBase: true,
      legendVar: false,
    };
  }, [projection]);

  const result = projection?.result;
  const isCajita = projection?.mode === 'cajita';

  return (
    <section className="panel active" aria-labelledby="compuesto-heading">
      <header className="ph">
        <h1 id="compuesto-heading" className="ph-title">
          Interés compuesto
        </h1>
        <p className="ph-sub">
          Proyecta el crecimiento de tu inversión con aportes, capitalización y descuentos reales
        </p>
      </header>

      <div className="cp-cards-row">
        <Card icon="💰" title="Inversión">
          <MoneyInput
            id="cp-ini"
            label="Aporte inicial ($)"
            value={aporteIni}
            onChange={setAporteIni}
            placeholder="1000000"
          />
          <MoneyInput
            id="cp-men"
            label={menLabel}
            value={aporteMen}
            onChange={setAporteMen}
            placeholder="100000"
          />
          <div className="g2">
            <NumberInput
              id="cp-tasa"
              label="Tasa E.A. (%)"
              value={tasa}
              onChange={setTasa}
              placeholder="8"
              step="0.01"
              min={0}
            />
            <NumberInput
              id="cp-anios"
              label="Años"
              value={anios}
              onChange={setAnios}
              placeholder="5"
              min={1}
              max={50}
            />
          </div>
        </Card>

        <Card icon="🔄" title="Capitalización">
          <NumberInput
            id="cp-freq"
            label={freqLabel}
            value={freq}
            onChange={setFreq}
            placeholder="30"
            min={1}
            hint="30 = mensual · 90 = trimestral · 180 = semestral · 365 = anual"
          />
          <Toggle
            on={cajitaOn}
            onChange={setCajitaOn}
            title="Modo cajita + CDT"
            subtitle="Aportes van a cajita; al capitalizar se reinvierte todo en CDT"
          />
          {cajitaOn && (
            <div className="cajita-fields">
              <NumberInput
                id="cp-tasa-cajita"
                label="Tasa cajita E.A. (%)"
                value={tasaCajita}
                onChange={setTasaCajita}
                placeholder="3"
                step="0.01"
                min={0}
              />
              <p className="hint">
                La cajita dura lo que el período de capitalización. Al vencer: cajita + CDT →
                nuevo CDT.
              </p>
            </div>
          )}
        </Card>

        <Card icon="🏛️" title="Impuestos y escenarios">
          <div className="tax-toggles">
            <Toggle
              on={aplicarRete}
              onChange={setAplicarRete}
              title="Descontar retefuente"
              subtitle="4% sobre intereses generados"
            />
            <Toggle
              on={aplicarGmf}
              onChange={setAplicarGmf}
              title="Descontar 4×1000"
              subtitle="0,4% sobre el saldo total al retirar"
            />
          </div>
          <NumberInput
            id="cp-varianza"
            label={
              <>
                Varianza de tasa (± % E.A.) <span className="opt-tag">Opcional</span>
              </>
            }
            value={varianza}
            onChange={setVarianza}
            placeholder="1.5"
            step="0.01"
            min={0}
            hint="Muestra escenarios bajo, base y alto"
            optional
          />
        </Card>
      </div>

      <button className="btn btn-full btn-proyectar" type="button" onClick={handleProject}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Proyectar inversión
      </button>

      <div className={`results-block${result ? ' has-result' : ''}`}>
        <p className="results-block__label">
          {isCajita ? 'Resultados cajita + CDT' : 'Resultados interés compuesto'}
        </p>
        <div className={`rs${result ? ' on' : ''}`}>
          {!isCajita && (
            <div className="g4">
              <Metric
                label="Total aportado"
                value={result ? fmt(result.totalAportado) : '—'}
                valueClass="pri"
              />
              <Metric
                label="Interés neto"
                value={result ? fmt(result.totalIntereses) : '—'}
                valueClass="grn"
              />
              <Metric
                label="Retefuente"
                value={result && result.retefuente > 0 ? '− ' + fmt(result.retefuente) : '—'}
                valueClass="red"
                hidden={!result || result.retefuente <= 0}
              />
              <Metric
                label="4×1000"
                value={result && result.cuatroPorMil > 0 ? '− ' + fmt(result.cuatroPorMil) : '—'}
                valueClass="red"
                hidden={!result || result.cuatroPorMil <= 0}
              />
              <Metric
                label="Capital final neto"
                value={result ? fmt(result.capitalFinal) : '—'}
                valueClass="pri"
              />
              <Metric
                label="Rendimiento"
                value={result ? pct(result.rendimientoTotalPct) : '—'}
                valueClass="amb"
              />
            </div>
          )}
          {isCajita && result && (
            <div className="g4">
              <Metric label="Ciclos CDT" value={result.ciclos} valueClass="pri" />
              <Metric label="Total aportado" value={fmt(result.totalAportado)} />
              <Metric label="Intereses CDT" value={fmt(result.interesesCdt)} valueClass="grn" />
              <Metric
                label="Intereses cajita"
                value={fmt(result.interesesCajita)}
                valueClass="amb"
                style={{ borderColor: '#fcd34d' }}
              />
              <Metric label="Saldo CDT final" value={fmt(result.saldoCdt)} valueClass="pri" />
              <Metric label="Saldo cajita final" value={fmt(result.saldoCajita)} />
              <Metric
                label="Rete CDT (4%)"
                value={'− ' + fmt(result.reteCdt)}
                valueClass="red"
                hidden={result.retefuente <= 0}
              />
              <Metric
                label="Rete cajita (7%)"
                value={'− ' + fmt(result.reteCajita)}
                valueClass="red"
                hidden={result.retefuente <= 0}
              />
              <Metric
                label="Total retefuente"
                value={'− ' + fmt(result.retefuente)}
                valueClass="red"
                hidden={result.retefuente <= 0}
              />
              <Metric
                label="4×1000"
                value={'− ' + fmt(result.cuatroPorMil)}
                valueClass="red"
                hidden={result.cuatroPorMil <= 0}
              />
              <Metric label="Capital final neto" value={fmt(result.capitalFinal)} valueClass="pri" />
              <Metric label="Rendimiento" value={pct(result.rendimientoTotalPct)} valueClass="amb" />
            </div>
          )}
        </div>
        {!result && (
          <p className="results-empty">Ingresa los datos y pulsa «Proyectar inversión»</p>
        )}
      </div>

      {projection?.scenarios && (
        <div className="variance-sec">
          <p className="slabel">Escenarios por varianza de tasa</p>
          <div className="g3">
            {['bajo', 'base', 'alto'].map((key) => {
              const r = projection.scenarios[key];
              const interesNeto = r.totalIntereses ?? r.interesBrutoTotal - (r.retefuente || 0);
              return (
                <div key={key} className={`metric metric--scenario metric--${key}`}>
                  <div className="m-label">
                    {SCENARIO_LABELS[key]} ({pct(r.tasaEA * 100)} E.A.)
                  </div>
                  <div className="m-val">{fmt(r.capitalFinal)}</div>
                  <div className="m-sub">Interés neto: {fmt(interesNeto)}</div>
                  <div className="m-sub">Rendimiento: {pct(r.rendimientoTotalPct)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result && (
        <div className="rs section-spaced on">
          <article className="card">
            <div className="ch">
              <div className="ch-title">
                <div className="ch-icon" aria-hidden="true">
                  📊
                </div>
                Evolución del capital
              </div>
            </div>
            <CardBody>
              {chartConfig?.legendBase && (
                <div className="legend">
                  <span>
                    <span className="ldot" style={{ background: '#1a56db' }} />
                    Capital aportado
                  </span>
                  <span>
                    <span className="ldot" style={{ background: '#059669' }} />
                    Intereses netos
                  </span>
                </div>
              )}
              {chartConfig?.legendVar && (
                <p className="hint">Capital neto según escenario de tasa</p>
              )}
              <div className="chart-box chart-box--tall">
                {chartConfig?.type === 'bar' ? (
                  <StackedBarChart
                    config={chartConfig.config}
                    ariaLabel="Crecimiento del capital con interés compuesto"
                  />
                ) : (
                  <ScenarioLineChart
                    config={chartConfig.config}
                    ariaLabel="Crecimiento del capital con interés compuesto"
                  />
                )}
              </div>
              <hr className="dv" />
              <p className="slabel">Proyección anual</p>
              <MainProjectionTable
                snapshots={result.yearlySnapshots}
                isCajita={isCajita}
                showRete={projection.aplicarRete}
                snapshotsBajo={projection.scenarioBajo?.yearlySnapshots}
                snapshotsAlto={projection.scenarioAlto?.yearlySnapshots}
              />
              {isCajita && (
                <div className="detail-toggle-wrap">
                  <button
                    className="btn-link"
                    type="button"
                    onClick={() => setShowDetail((s) => !s)}
                  >
                    {showDetail ? '▼ Ocultar detalle técnico' : '▶ Ver detalle técnico'}
                  </button>
                  {showDetail && <DetailProjectionTable snapshots={result.yearlySnapshots} />}
                </div>
              )}
            </CardBody>
          </article>
        </div>
      )}
    </section>
  );
}
