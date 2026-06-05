import { fmt, pct } from '../../utils/format.js';

function findInflectionYear(snapshots, isCajita) {
  for (const row of snapshots) {
    const intereses = isCajita
      ? row.interesesCdt + row.interesesCajita
      : row.interesesAcum;
    if (intereses >= row.aportadoAcum) return row.year;
  }
  return null;
}

export function MainProjectionTable({
  snapshots,
  isCajita,
  showRete,
  snapshotsBajo,
  snapshotsAlto,
}) {
  const inflection = findInflectionYear(snapshots, isCajita);
  const hasVarianza = snapshotsBajo && snapshotsAlto;

  return (
    <div className="tw">
      <table className="proj-table">
        <thead>
          <tr>
            <th>Año</th>
            <th>Total aportado</th>
            <th>{hasVarianza ? 'Capital base' : 'Capital total'}</th>
            {hasVarianza && (
              <>
                <th>Capital bajo</th>
                <th>Capital alto</th>
              </>
            )}
            <th>Ganancia del año</th>
            <th>Ganancia acumulada</th>
            {showRete && <th>Retefuente acum.</th>}
            <th>Rendimiento %</th>
          </tr>
        </thead>
        <tbody>
          {snapshots.map((row, i) => {
            const interesesAcum = isCajita
              ? row.interesesCdt + row.interesesCajita
              : row.interesesAcum;
            const capital = isCajita ? row.totalCombinado : row.capitalTotal;
            const capBajo = hasVarianza
              ? isCajita
                ? snapshotsBajo[i]?.totalCombinado
                : snapshotsBajo[i]?.capitalTotal
              : null;
            const capAlto = hasVarianza
              ? isCajita
                ? snapshotsAlto[i]?.totalCombinado
                : snapshotsAlto[i]?.capitalTotal
              : null;

            return (
              <tr key={row.year} className={row.year === inflection ? 'row-inflection' : ''}>
                <td>{row.year}</td>
                <td>{fmt(row.aportadoAcum)}</td>
                <td style={{ fontWeight: 600 }}>{fmt(capital)}</td>
                {hasVarianza && (
                  <>
                    <td style={{ color: 'var(--red)' }}>{fmt(capBajo ?? 0)}</td>
                    <td style={{ color: 'var(--green)' }}>{fmt(capAlto ?? 0)}</td>
                  </>
                )}
                <td style={{ color: 'var(--green)' }}>{fmt(row.rendimientoAnio)}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt(interesesAcum)}</td>
                {showRete && (
                  <td style={{ color: 'var(--red)' }}>− {fmt(row.reteAcum)}</td>
                )}
                <td style={{ fontWeight: 600 }}>{pct(row.rendimientoPct)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {inflection && (
        <p className="inflection-note">
          📍 Año {inflection}: los intereses superan lo aportado — tu dinero trabaja más que tú.
        </p>
      )}
    </div>
  );
}

export function DetailProjectionTable({ snapshots }) {
  return (
    <div className="tw">
      <table className="proj-table proj-table--detail">
        <thead>
          <tr>
            <th>Año</th>
            <th>CDT</th>
            <th>Cajita (pico)</th>
            <th>Ciclos</th>
            <th>Int. CDT</th>
            <th>Int. Cajita</th>
          </tr>
        </thead>
        <tbody>
          {snapshots.map((row) => (
            <tr key={row.year}>
              <td>{row.year}</td>
              <td>{fmt(row.saldoCdt)}</td>
              <td>{fmt(row.saldoCajita)}</td>
              <td>{row.ciclosAcum}</td>
              <td style={{ color: 'var(--green)' }}>{fmt(row.interesesCdt)}</td>
              <td style={{ color: 'var(--amber)' }}>{fmt(row.interesesCajita)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
