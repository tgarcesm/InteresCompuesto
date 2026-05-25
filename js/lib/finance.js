import {
  RETEFUENTE_RATE,
  CUATRO_POR_MIL_RATE,
  DAYS_PER_YEAR,
  VERDICT_THRESHOLD_PP,
} from '../config/constants.js';

/** Retefuente (4% intereses) y 4×1000 (0,4% movimientos) */
export function calcularDescuentos({
  interesBruto,
  montoMovimientos,
  aplicarRete,
  aplicarCuatroPorMil,
}) {
  const retefuente = aplicarRete ? interesBruto * RETEFUENTE_RATE : 0;
  const cuatroPorMil = aplicarCuatroPorMil ? montoMovimientos * CUATRO_POR_MIL_RATE : 0;
  const interesNeto = interesBruto - retefuente;

  return {
    retefuente,
    cuatroPorMil,
    interesNeto,
    totalDescuentos: retefuente + cuatroPorMil,
  };
}

/**
 * Interés CDT: Capital × [(1 + TEA)^(días/365) − 1]
 */
export function calculateCDT({
  capital,
  dias,
  tasaEA,
  aplicarRete,
  aplicarCuatroPorMil = false,
}) {
  const interesBruto = capital * (Math.pow(1 + tasaEA, dias / DAYS_PER_YEAR) - 1);
  const { retefuente, cuatroPorMil, interesNeto } = calcularDescuentos({
    interesBruto,
    montoMovimientos: capital,
    aplicarRete,
    aplicarCuatroPorMil,
  });
  const capitalFinal = capital + interesNeto - cuatroPorMil;
  const tasaNetaEA =
    dias > 0 && capital > 0
      ? (Math.pow(capitalFinal / capital, DAYS_PER_YEAR / dias) - 1) * 100
      : 0;
  const rendimientoNetoPct = capital > 0 ? ((capitalFinal - capital) / capital) * 100 : 0;

  return {
    interesBruto,
    retefuente,
    cuatroPorMil,
    interesNeto,
    capitalFinal,
    tasaNetaEA,
    rendimientoNetoPct,
  };
}

/**
 * Convierte tasa nominal de plazo N días a E.A.
 * E.A. = (1 + r × N/365)^(365/N) − 1
 */
export function nominalToEffectiveAnnual(tasaNominal, dias) {
  if (dias <= 0) return 0;
  return Math.pow(1 + tasaNominal * dias / DAYS_PER_YEAR, DAYS_PER_YEAR / dias) - 1;
}

/**
 * Compara CDT corto (nominal) vs largo (E.A.)
 * @returns {{ eaCorto: number, eaLargo: number, diffPp: number, verdict: 'corto'|'largo'|'igual' }}
 */
export function compareShortVsLong(tasaCortoNominal, diasCorto, tasaLargoEA) {
  const eaCorto = nominalToEffectiveAnnual(tasaCortoNominal, diasCorto);
  const diffPp = (eaCorto - tasaLargoEA) * 100;

  let verdict = 'igual';
  if (diffPp > VERDICT_THRESHOLD_PP) verdict = 'corto';
  else if (diffPp < -VERDICT_THRESHOLD_PP) verdict = 'largo';

  return { eaCorto, eaLargo: tasaLargoEA, diffPp, verdict };
}

/**
 * Proyecta un CDT al horizonte en años (misma fórmula que calculateCDT)
 */
export function projectInvestment(
  { capital, tasaEA, aplicarRete, aplicarCuatroPorMil = false },
  anios
) {
  return calculateCDT({
    capital,
    dias: anios * DAYS_PER_YEAR,
    tasaEA,
    aplicarRete,
    aplicarCuatroPorMil,
  });
}

/**
 * Interés compuesto con aportes periódicos
 * @param {{ aporteInicial: number, aporteMensual: number, tasaEA: number, anios: number, periodosPorAnio: number }}
 */
export function calculateCompoundInterest({
  aporteInicial,
  aporteMensual,
  tasaEA,
  anios,
  periodosPorAnio,
  aplicarRete = false,
  aplicarCuatroPorMil = false,
}) {
  const tasaPeriodo = Math.pow(1 + tasaEA, 1 / periodosPorAnio) - 1;
  const aportePorPeriodo = (aporteMensual * 12) / periodosPorAnio;

  let saldo = aporteInicial;
  const yearlySnapshots = [];

  for (let periodo = 1; periodo <= anios * periodosPorAnio; periodo++) {
    saldo = saldo * (1 + tasaPeriodo) + aportePorPeriodo;

    if (periodo % periodosPorAnio === 0) {
      const year = periodo / periodosPorAnio;
      const aportadoAcum = aporteInicial + aporteMensual * 12 * year;
      const interesBrutoAcum = Math.max(0, saldo - aportadoAcum);
      const { interesNeto, retefuente, cuatroPorMil } = calcularDescuentos({
        interesBruto: interesBrutoAcum,
        montoMovimientos: aportadoAcum,
        aplicarRete,
        aplicarCuatroPorMil,
      });
      const capitalNeto = saldo - retefuente - cuatroPorMil;
      yearlySnapshots.push({
        year,
        aportadoAcum,
        interesesAcum: interesNeto,
        interesBrutoAcum,
        capitalTotal: capitalNeto,
        rendimientoPct: aportadoAcum > 0 ? (interesNeto / aportadoAcum) * 100 : 0,
      });
    }
  }

  const totalAportado = aporteInicial + aporteMensual * 12 * anios;
  const interesBruto = Math.max(0, saldo - totalAportado);
  const { retefuente, cuatroPorMil, interesNeto, totalDescuentos } = calcularDescuentos({
    interesBruto,
    montoMovimientos: totalAportado,
    aplicarRete,
    aplicarCuatroPorMil,
  });
  const capitalFinal = saldo - totalDescuentos;
  const rendimientoTotalPct =
    totalAportado > 0 ? ((capitalFinal - totalAportado) / totalAportado) * 100 : 0;

  return {
    capitalFinal,
    saldoBruto: saldo,
    totalAportado,
    interesBruto,
    retefuente,
    cuatroPorMil,
    totalIntereses: interesNeto,
    rendimientoTotalPct,
    yearlySnapshots,
  };
}

/**
 * Simulación Cajita + CDT (mes a mes con interés diario compuesto)
 *
 * - Capital inicial → CDT
 * - Aportes mensuales → cajita (genera su propia tasa E.A.)
 * - Al vencer el CDT (cada plazoCdtDias), se capitaliza: CDT + cajita → nuevo CDT
 * - Ciclo se repite hasta cumplir el plazo total en años
 */
export function simulateCajitaCDT({
  capitalInicial,
  aporteMensual,
  tasaCdtEA,
  tasaCajitaEA,
  plazoCdtDias,
  anios,
  aplicarRete = false,
  aplicarCuatroPorMil = false,
}) {
  const tasaDiariaCdt = Math.pow(1 + tasaCdtEA, 1 / DAYS_PER_YEAR) - 1;
  const tasaDiariaCajita = Math.pow(1 + tasaCajitaEA, 1 / DAYS_PER_YEAR) - 1;
  const totalDias = anios * DAYS_PER_YEAR;

  let saldoCdt = capitalInicial;
  let saldoCajita = 0;
  let diasDesdeInicioCdt = 0;
  let ciclos = 0;
  let totalInteresesCdt = 0;
  let totalInteresesCajita = 0;
  let totalAportado = capitalInicial;
  let diaActual = 0;

  const yearlySnapshots = [];
  let saldoCdtInicioAnio = saldoCdt;
  let saldoCajitaInicioAnio = saldoCajita;

  while (diaActual < totalDias) {
    diaActual++;
    diasDesdeInicioCdt++;

    const interesDiaCdt = saldoCdt * tasaDiariaCdt;
    saldoCdt += interesDiaCdt;
    totalInteresesCdt += interesDiaCdt;

    const interesDiaCajita = saldoCajita * tasaDiariaCajita;
    saldoCajita += interesDiaCajita;
    totalInteresesCajita += interesDiaCajita;

    // Aporte mensual a cajita (cada 30 días aprox)
    if (diaActual % 30 === 0 && aporteMensual > 0) {
      saldoCajita += aporteMensual;
      totalAportado += aporteMensual;
    }

    // Vencimiento del CDT → capitalización
    if (diasDesdeInicioCdt >= plazoCdtDias) {
      ciclos++;
      const totalCapitalizar = saldoCdt + saldoCajita;
      saldoCdt = totalCapitalizar;
      saldoCajita = 0;
      diasDesdeInicioCdt = 0;
    }

    // Snapshot anual
    if (diaActual % DAYS_PER_YEAR === 0) {
      const year = diaActual / DAYS_PER_YEAR;
      yearlySnapshots.push({
        year,
        saldoCdt,
        saldoCajita,
        totalCombinado: saldoCdt + saldoCajita,
        aportadoAcum: totalAportado,
        interesesCdt: totalInteresesCdt,
        interesesCajita: totalInteresesCajita,
        ciclosAcum: ciclos,
      });
    }
  }

  // Snapshot final si no cae justo en múltiplo de 365
  const totalBruto = saldoCdt + saldoCajita;
  const interesBrutoTotal = totalInteresesCdt + totalInteresesCajita;
  const { retefuente, cuatroPorMil, totalDescuentos } = calcularDescuentos({
    interesBruto: interesBrutoTotal,
    montoMovimientos: totalAportado,
    aplicarRete,
    aplicarCuatroPorMil,
  });
  const capitalFinal = totalBruto - totalDescuentos;
  const rendimientoTotalPct =
    totalAportado > 0 ? ((capitalFinal - totalAportado) / totalAportado) * 100 : 0;

  return {
    ciclos,
    saldoCdt,
    saldoCajita,
    totalCombinado: totalBruto,
    capitalFinal,
    totalAportado,
    interesBrutoTotal,
    interesesCdt: totalInteresesCdt,
    interesesCajita: totalInteresesCajita,
    retefuente,
    cuatroPorMil,
    rendimientoTotalPct,
    yearlySnapshots,
  };
}

/**
 * Escenarios de tasa a partir de una E.A. base y margen ± (puntos porcentuales)
 * @returns {{ bajo: number, base: number, alto: number } | null}
 */
export function buildRateScenarios(tasaEA, varianzaPp) {
  if (varianzaPp == null || varianzaPp <= 0) return null;
  const delta = varianzaPp / 100;
  return {
    bajo: Math.max(0, tasaEA - delta),
    base: tasaEA,
    alto: tasaEA + delta,
  };
}
