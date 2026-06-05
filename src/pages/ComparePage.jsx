import { useMemo, useState } from 'react';
import { projectInvestment } from '../lib/finance.js';
import { fmt, pct } from '../utils/format.js';
import { CardBody } from '../components/ui/Card.jsx';
import {
  MoneyInput,
  NumberInput,
  TextInput,
  parseNumber,
  parseOptionalNumber,
} from '../components/ui/Field.jsx';
import StackedBarChart from '../components/charts/StackedBarChart.jsx';

function sortData(data, orden) {
  const sorted = [...data];
  if (orden === 'rend') sorted.sort((a, b) => b.interesNeto - a.interesNeto);
  else if (orden === 'tasa') sorted.sort((a, b) => b.tasaNetaEA - a.tasaNetaEA);
  else sorted.sort((a, b) => b.capitalFinal - a.capitalFinal);
  return sorted;
}

export default function ComparePage() {
  const [investments, setInvestments] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [capital, setCapital] = useState('');
  const [dias, setDias] = useState('');
  const [tasa, setTasa] = useState('');
  const [rete, setRete] = useState('1');
  const [anio, setAnio] = useState('1');
  const [orden, setOrden] = useState('rend');

  function toggleAddForm() {
    setAddOpen((o) => !o);
  }

  function addInvestment() {
    const tasaVal = parseOptionalNumber(tasa);
    if (tasaVal === null) {
      alert('Ingresa la tasa E.A. del CDT.');
      return;
    }

    const inv = {
      nombre: nombre.trim() || `CDT ${investments.length + 1}`,
      capital: parseNumber(capital, 0),
      dias: parseNumber(dias, 360),
      tasa: tasaVal / 100,
      rete: rete === '1',
    };

    setInvestments((prev) => [...prev, inv]);
    setAddOpen(false);
    setNombre('');
  }

  function removeInvestment(index) {
    setInvestments((prev) => prev.filter((_, i) => i !== index));
  }

  const data = useMemo(() => {
    if (investments.length === 0) return [];

    const anios = parseInt(anio, 10) || 1;
    const projected = investments.map((inv) => ({
      ...inv,
      ...projectInvestment(
        { capital: inv.capital, tasaEA: inv.tasa, aplicarRete: inv.rete },
        anios
      ),
    }));

    return sortData(
      projected.map((d) => ({
        ...d,
        intB: d.interesBruto,
        reteV: d.retefuente,
        intN: d.interesNeto,
        capF: d.capitalFinal,
        tNetaEA: d.tasaNetaEA,
      })),
      orden
    );
  }, [investments, anio, orden]);

  const chartConfig = useMemo(() => {
    if (data.length === 0) return null;
    return {
      labels: data.map((d) => d.nombre),
      datasets: [
        { label: 'Capital inicial', data: data.map((d) => d.capital) },
        { label: 'Interés neto', data: data.map((d) => Math.round(d.intN)) },
      ],
    };
  }, [data]);

  return (
    <section className="panel active" aria-labelledby="comparar-heading">
      <header className="ph ph-row">
        <div>
          <h1 id="comparar-heading" className="ph-title">
            Comparar inversiones
          </h1>
          <p className="ph-sub">
            Proyecta múltiples CDTs al mismo horizonte y encuentra la mejor opción
          </p>
        </div>
        <button className="btn-out" type="button" onClick={toggleAddForm}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar CDT
        </button>
      </header>

      <div className={`add-p${addOpen ? ' open' : ''}`}>
        <p className="slabel slabel--spaced">Nueva inversión</p>
        <div className="g3">
          <TextInput
            id="inv-nom"
            label="Nombre / banco"
            value={nombre}
            onChange={setNombre}
            placeholder="Ej: Bancolombia 360d"
          />
          <MoneyInput
            id="inv-cap"
            label="Capital ($)"
            value={capital}
            onChange={setCapital}
            placeholder="10000000"
          />
          <NumberInput
            id="inv-dias"
            label="Plazo (días)"
            value={dias}
            onChange={setDias}
            placeholder="360"
            min={1}
          />
        </div>
        <div className="g2 g2-mt">
          <NumberInput
            id="inv-tasa"
            label="Tasa E.A. (%)"
            value={tasa}
            onChange={setTasa}
            placeholder="12"
            step="0.01"
          />
          <div className="field">
            <label htmlFor="inv-rete">Retefuente</label>
            <select id="inv-rete" value={rete} onChange={(e) => setRete(e.target.value)}>
              <option value="1">Aplica (4%)</option>
              <option value="0">No aplica</option>
            </select>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn" type="button" onClick={addInvestment}>
            Agregar
          </button>
          <button className="btn-gh" type="button" onClick={toggleAddForm}>
            Cancelar
          </button>
        </div>
      </div>

      <article className="card">
        <CardBody>
          <div className="frow">
            <div className="field">
              <label htmlFor="f-anio">Proyectar a</label>
              <select id="f-anio" value={anio} onChange={(e) => setAnio(e.target.value)}>
                <option value="1">Año 1</option>
                <option value="2">Año 2</option>
                <option value="3">Año 3</option>
                <option value="5">Año 5</option>
                <option value="10">Año 10</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-orden">Ordenar por</label>
              <select id="f-orden" value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="rend">Mayor rendimiento neto</option>
                <option value="tasa">Mayor tasa neta</option>
                <option value="cap">Mayor capital final</option>
              </select>
            </div>
          </div>

          {investments.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📊</span>
              Agrega tu primer CDT para comenzar a comparar.
            </div>
          ) : (
            <>
              <div id="inv-lista">
                {investments.map((inv, i) => (
                  <div key={i} className="inv-card">
                    <div>
                      <div className="inv-name">
                        {inv.nombre}{' '}
                        <span className="badge bd-gy">{inv.dias} días</span>
                        {!inv.rete && <span className="badge bd-bl">sin rete</span>}
                      </div>
                      <div className="inv-meta">
                        {fmt(inv.capital)} &nbsp;·&nbsp; {pct(inv.tasa * 100)} E.A.
                      </div>
                    </div>
                    <button
                      className="btn-del"
                      type="button"
                      title="Eliminar"
                      onClick={() => removeInvestment(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <hr className="dv" />

              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Inversión</th>
                      <th>Capital</th>
                      <th>Interés bruto</th>
                      <th>Retefuente</th>
                      <th>Interés neto</th>
                      <th>Tasa neta E.A.</th>
                      <th>Capital final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => {
                      const best = i === 0 && data.length > 1;
                      return (
                        <tr key={d.nombre + i} className={best ? 'best-row' : ''}>
                          <td>
                            {d.nombre}
                            {best && <span className="badge bd-gn">mejor</span>}
                          </td>
                          <td>{fmt(d.capital)}</td>
                          <td>{fmt(d.intB)}</td>
                          <td style={{ color: 'var(--red)' }}>−{fmt(d.reteV)}</td>
                          <td className={best ? 'best' : ''}>{fmt(d.intN)}</td>
                          <td className={best ? 'best' : ''}>{pct(d.tNetaEA)}</td>
                          <td className={best ? 'best' : ''}>{fmt(d.capF)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="chart-wrap">
                <div className="legend">
                  <span>
                    <span className="ldot" style={{ background: '#1a56db' }} />
                    Capital inicial
                  </span>
                  <span>
                    <span className="ldot" style={{ background: '#059669' }} />
                    Interés neto
                  </span>
                </div>
                <div className="chart-box">
                  <StackedBarChart
                    config={chartConfig}
                    ariaLabel="Comparación capital por inversión"
                  />
                </div>
              </div>
            </>
          )}
        </CardBody>
      </article>
    </section>
  );
}
