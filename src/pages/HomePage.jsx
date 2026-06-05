import { useState } from 'react';
import { compareShortVsLong } from '../lib/finance.js';
import { pct } from '../utils/format.js';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import { NumberInput, parseOptionalNumber } from '../components/ui/Field.jsx';
import Metric from '../components/ui/Metric.jsx';
import { CardBody } from '../components/ui/Card.jsx';

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

const HOME_CARDS = [
  {
    path: ROUTES.CDT,
    icon: '📋',
    title: 'Calculadora CDT',
    desc: 'Capital, plazo, tasa E.A. → interés neto y capital final',
    className: 'home-card--blue',
  },
  {
    path: ROUTES.COMPUESTO,
    icon: '📈',
    title: 'Interés compuesto',
    desc: 'Aportes periódicos, capitalización, modo cajita + CDT',
    className: 'home-card--green',
  },
  {
    path: ROUTES.COMPARAR,
    icon: '⚡',
    title: 'Comparar CDTs',
    desc: 'Varios bancos al mismo horizonte — encuentra la mejor opción',
    className: 'home-card--amber',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [tCorto, setTCorto] = useState('');
  const [dCorto, setDCorto] = useState('');
  const [tLargo, setTLargo] = useState('');

  const rCorto = parseOptionalNumber(tCorto);
  const dCortoVal = parseOptionalNumber(dCorto);
  const rLargo = parseOptionalNumber(tLargo);

  let comparison = null;
  if (rCorto !== null && dCortoVal !== null && rLargo !== null) {
    const { eaCorto, eaLargo, diffPp, verdict } = compareShortVsLong(
      rCorto / 100,
      dCortoVal,
      rLargo / 100
    );
    comparison = { eaCorto, eaLargo, diffPp, verdict };
  }

  const copy = comparison ? VERDICT_COPY[comparison.verdict] : null;
  const diffClass =
    comparison && comparison.diffPp > 0.05
      ? 'grn'
      : comparison && comparison.diffPp < -0.05
        ? 'red'
        : 'amb';

  return (
    <section className="panel active">
      <div className="home-hero">
        <h1 className="home-hero__title">
          Simulador financiero <span className="home-hero__accent">CDT Pro</span>
        </h1>
        <p className="home-hero__sub">
          Herramientas para calcular, comparar y proyectar tus inversiones en CDT en Colombia.
          Retefuente, 4×1000 y tasas reales.
        </p>
      </div>

      <div className="home-cards">
        {HOME_CARDS.map((card) => (
          <button
            key={card.path}
            className={`home-card ${card.className}`}
            type="button"
            onClick={() => navigate(card.path)}
          >
            <span className="home-card__icon">{card.icon}</span>
            <span className="home-card__title">{card.title}</span>
            <span className="home-card__desc">{card.desc}</span>
          </button>
        ))}
      </div>

      <section className="section-spaced" aria-labelledby="analysis-heading">
        <article className="card">
          <div className="ch">
            <h2 id="analysis-heading" className="ch-title">
              <div className="ch-icon" aria-hidden="true">
                ⚖️
              </div>
              ¿CDT corto o largo? Análisis y comparador
            </h2>
          </div>
          <CardBody>
            <div className="analysis-grid">
              <div className="ana-card corto">
                <h3>
                  CDT corto (≤ 180 días) <span className="pill">RENOVABLE</span>
                </h3>
                <ul>
                  <li>
                    <strong>Crees que las tasas van a subir</strong> en los próximos meses
                  </li>
                  <li>
                    Necesitas <strong>liquidez antes del año</strong> y no puedes amarrar el
                    capital
                  </li>
                  <li>
                    La tasa corta, <strong>convertida a E.A., supera</strong> la del CDT largo
                  </li>
                  <li>
                    Quieres <strong>flexibilidad</strong> para reubicar si surge mejor opción
                  </li>
                </ul>
              </div>
              <div className="ana-card largo">
                <h3>
                  CDT largo (&gt; 180 días) <span className="pill">ESTABLE</span>
                </h3>
                <ul>
                  <li>
                    <strong>Crees que las tasas van a bajar</strong> — aseguras la tasa actual
                  </li>
                  <li>
                    No necesitas el dinero y quieres{' '}
                    <strong>planificación sin sorpresas</strong>
                  </li>
                  <li>
                    La tasa larga ya <strong>supera la equivalente E.A. del corto</strong>
                  </li>
                  <li>
                    Prefieres <strong>menos trámites</strong> y renovaciones automáticas
                  </li>
                </ul>
              </div>
            </div>

            <hr className="dv" />
            <p className="fb-title fb-title--section">Comparador: tasa corta vs tasa larga</p>
            <div className="fb-wrap">
              <p className="fb-title">Fórmula de conversión a E.A.</p>
              <div className="fb-row">
                <div>
                  <p className="fb-eq-label">CDT a 90 días (nominal):</p>
                  <p className="fb-eq">E.A. = (1 + r/4)⁴ − 1</p>
                </div>
                <div>
                  <p className="fb-eq-label">CDT a N días (nominal):</p>
                  <p className="fb-eq">E.A. = (1 + r × N/365)^(365/N) − 1</p>
                </div>
              </div>
              <p className="fb-note">
                Si la E.A. equivalente del CDT corto supera la del largo → conviene renovar el
                corto. Si no → el largo asegura mejor rendimiento sin riesgo de reinversión.
              </p>
            </div>

            <div className="cmp-inputs">
              <NumberInput
                id="cmp-tcorto"
                label="Tasa CDT corto (% nominal)"
                value={tCorto}
                onChange={setTCorto}
                placeholder="11"
                step="0.01"
              />
              <NumberInput
                id="cmp-dcorto"
                label="Plazo CDT corto (días)"
                value={dCorto}
                onChange={setDCorto}
                placeholder="90"
                min={1}
                max={364}
              />
              <NumberInput
                id="cmp-tlargo"
                label="Tasa CDT largo (% E.A.)"
                value={tLargo}
                onChange={setTLargo}
                placeholder="12"
                step="0.01"
              />
            </div>

            <div className="cmp-metrics">
              <Metric
                label="Tasa corto E.A. equiv."
                value={comparison ? pct(comparison.eaCorto * 100) : '—'}
                valueClass="grn"
                sub={
                  comparison
                    ? `${dCortoVal} días → equiv. anual`
                    : 'completa los campos'
                }
              />
              <Metric
                label="Tasa largo E.A."
                value={comparison ? pct(comparison.eaLargo * 100) : '—'}
                valueClass="pri"
                sub="referencia del CDT largo"
              />
              <Metric
                label="Diferencia"
                value={
                  comparison
                    ? (comparison.diffPp >= 0 ? '+' : '') + pct(comparison.diffPp)
                    : '—'
                }
                valueClass={comparison ? diffClass : ''}
                sub={copy ? copy.diffSub : '—'}
              />
            </div>

            <div className={`${copy ? copy.className : 'verdict v-igual'}${copy ? ' is-visible' : ''}`}>
              <div className="verdict-icon" aria-hidden="true">
                {copy ? copy.icon : '⚖️'}
              </div>
              <div>
                <div className="verdict-title">{copy ? copy.title : '—'}</div>
                <div className="verdict-sub">
                  {copy
                    ? copy.sub(comparison.eaCorto, comparison.eaLargo, comparison.diffPp)
                    : '—'}
                </div>
              </div>
            </div>
          </CardBody>
        </article>
      </section>
    </section>
  );
}
