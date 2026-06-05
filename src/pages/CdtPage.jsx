import { useState } from 'react';
import { calculateCDT } from '../lib/finance.js';
import { fmt, pct } from '../utils/format.js';
import { DAYS_PER_YEAR } from '../config/constants.js';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import { Card } from '../components/ui/Card.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import Metric from '../components/ui/Metric.jsx';
import { MoneyInput, NumberInput, parseOptionalNumber } from '../components/ui/Field.jsx';

export default function CdtPage() {
  const navigate = useNavigate();
  const [capital, setCapital] = useState('');
  const [dias, setDias] = useState('');
  const [tasa, setTasa] = useState('');
  const [aplicarRete, setAplicarRete] = useState(true);
  const [aplicarGmf, setAplicarGmf] = useState(false);
  const [result, setResult] = useState(null);
  const [inputDias, setInputDias] = useState(null);

  const diasNum = parseOptionalNumber(dias);
  const diasHint =
    diasNum === null
      ? 'Ej: 365 días ≈ 1 año'
      : `≈ ${(diasNum / DAYS_PER_YEAR).toFixed(2)} año(s)`;

  function handleCalc() {
    const cap = parseOptionalNumber(capital);
    const d = parseOptionalNumber(dias);
    const t = parseOptionalNumber(tasa);

    if (cap === null || d === null || t === null) {
      alert('Completa capital, plazo y tasa E.A. para calcular el CDT.');
      return;
    }

    const r = calculateCDT({
      capital: cap,
      dias: d,
      tasaEA: t / 100,
      aplicarRete,
      aplicarCuatroPorMil: aplicarGmf,
    });

    setResult(r);
    setInputDias({ capital: cap, dias: d, tasa: t });
  }

  return (
    <section className="panel active" aria-labelledby="cdt-heading">
      <header className="ph">
        <h1 id="cdt-heading" className="ph-title">
          Calculadora de CDT
        </h1>
        <p className="ph-sub">
          Capital, plazo, tasa E.A. → interés bruto/neto, retefuente, 4×1000 y capital final
        </p>
      </header>

      <div className="cdt-layout">
        <Card icon="📋" title="Parámetros del CDT">
          <MoneyInput
            id="cdt-capital"
            label="Capital inicial ($)"
            value={capital}
            onChange={setCapital}
            placeholder="10000000"
          />
          <div className="g2">
            <NumberInput
              id="cdt-dias"
              label="Plazo (días)"
              value={dias}
              onChange={setDias}
              placeholder="365"
              min={1}
              hint={diasHint}
            />
            <NumberInput
              id="cdt-tasa"
              label="Tasa E.A. (%)"
              value={tasa}
              onChange={setTasa}
              placeholder="12"
              step="0.01"
              min={0}
            />
          </div>
          <div className="tax-toggles">
            <Toggle
              on={aplicarRete}
              onChange={setAplicarRete}
              title="Descontar retefuente"
              subtitle="4% sobre intereses"
            />
            <Toggle
              on={aplicarGmf}
              onChange={setAplicarGmf}
              title="Descontar 4×1000"
              subtitle="0,4% sobre el capital (GMF)"
            />
          </div>
          <button className="btn btn-full" type="button" onClick={handleCalc}>
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
            Calcular CDT
          </button>
        </Card>

        <div>
          <div className={`rs${result ? ' on' : ''}`}>
            <div className="g4">
              <Metric
                label="Capital inicial"
                value={result ? fmt(inputDias.capital) : '—'}
                valueClass="pri"
              />
              <Metric label="Interés bruto" value={result ? fmt(result.interesBruto) : '—'} />
              <Metric
                label="Retefuente (4%)"
                value={result && aplicarRete ? '− ' + fmt(result.retefuente) : '$0'}
                valueClass="red"
                hidden={!result || !aplicarRete}
              />
              <Metric
                label="4×1000 (GMF)"
                value={result && aplicarGmf ? '− ' + fmt(result.cuatroPorMil) : '$0'}
                valueClass="red"
                hidden={!result || !aplicarGmf}
              />
              <Metric
                label="Interés neto"
                value={result ? fmt(result.interesNeto) : '—'}
                valueClass="grn"
                badge={
                  result ? (
                    <div className="m-badge mb-g">
                      ▲ <span>{pct(result.rendimientoNetoPct)}</span>
                    </div>
                  ) : null
                }
              />
              <Metric
                label="Tasa neta E.A."
                value={result ? pct(result.tasaNetaEA) : '—'}
                valueClass="amb"
              />
              <Metric
                label="Capital final neto"
                value={result ? fmt(result.capitalFinal) : '—'}
                valueClass="pri"
              />
            </div>
            {result && inputDias && (
              <div className="ss">
                <span>
                  Plazo: <strong>{inputDias.dias} días</strong> (
                  {(inputDias.dias / DAYS_PER_YEAR).toFixed(2)} años)
                </span>
                <span>
                  Tasa: <strong>{pct(inputDias.tasa)} E.A.</strong>
                </span>
                <span>
                  Retefuente:{' '}
                  <strong>{aplicarRete ? fmt(result.retefuente) : 'No'}</strong>
                </span>
                <span>
                  4×1000: <strong>{aplicarGmf ? fmt(result.cuatroPorMil) : 'No'}</strong>
                </span>
                <span>
                  Rend. neto: <strong>{pct(result.rendimientoNetoPct)}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="cdt-compare-banner">
            <div className="cdt-compare-banner__icon">⚖️</div>
            <div className="cdt-compare-banner__text">
              <strong>¿Tienes varias opciones de CDT?</strong>
              <p>Compara hasta 5 CDTs lado a lado y encuentra la mejor rentabilidad.</p>
            </div>
            <button
              className="btn btn-compare"
              type="button"
              onClick={() => navigate(ROUTES.COMPARAR)}
            >
              Comparar CDTs →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
