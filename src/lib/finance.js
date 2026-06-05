import {
  RETEFUENTE_RATE,
  RETEFUENTE_CAJITA_RATE,
  CUATRO_POR_MIL_RATE,
  DAYS_PER_YEAR,
  VERDICT_THRESHOLD_PP,
} from '../config/constants.js';

/**
 * Retefuente (4% intereses) y 4×1000 (0,4% sobre el saldo total al retirar)
 * @param interesBruto - intereses totales generados
 * @param saldoFinal - monto total que se retira (para GMF)
 */
export function calcularDescuentos({
  interesBruto,
  saldoFinal,
  aplicarRete,
  aplicarCuatroPorMil,
}) {
  const retefuente = aplicarRete ? interesBruto * RETEFUENTE_RATE : 0;
  const cuatroPorMil = aplicarCuatroPorMil ? saldoFinal * CUATRO_POR_MIL_RATE : 0;
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
  const saldoBruto = capital + interesBruto;
  const { retefuente, cuatroPorMil, interesNeto } = calcularDescuentos({
    interesBruto,
    saldoFinal: saldoBruto,
    aplicarRete,
    aplicarCuatroPorMil,
  });
  const capitalFinal = saldoBruto - retefuente - cuatroPorMil;
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
  let interesesNetoAnterior = 0;
  const yearlySnapshots = [];

  for (let periodo = 1; periodo <= anios * periodosPorAnio; periodo++) {
    saldo = saldo * (1 + tasaPeriodo) + aportePorPeriodo;

    if (periodo % periodosPorAnio === 0) {
      const year = periodo / periodosPorAnio;
      const aportadoAcum = aporteInicial + aporteMensual * 12 * year;
      const interesBrutoAcum = Math.max(0, saldo - aportadoAcum);
      const reteAcum = aplicarRete ? interesBrutoAcum * RETEFUENTE_RATE : 0;
      const interesesAcum = interesBrutoAcum - reteAcum;
      const capitalNeto = saldo - reteAcum;
      const rendimientoAnio = interesesAcum - interesesNetoAnterior;
      const rendimientoPct = aportadoAcum > 0 ? (interesesAcum / aportadoAcum) * 100 : 0;

      yearlySnapshots.push({
        year,
        aportadoAcum,
        interesesAcum,
        interesBrutoAcum,
        reteAcum,
        capitalTotal: capitalNeto,
        rendimientoAnio,
        rendimientoPct,
      });

      interesesNetoAnterior = interesesAcum;
    }
  }

  const totalAportado = aporteInicial + aporteMensual * 12 * anios;
  const interesBruto = Math.max(0, saldo - totalAportado);
  const { retefuente, cuatroPorMil, interesNeto, totalDescuentos } = calcularDescuentos({
    interesBruto,
    saldoFinal: saldo,
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
 * Simulación Cajita + CDT (día a día con interés diario compuesto)
 *
 * - Capital inicial → CDT
 * - Aportes mensuales → cajita (genera su propia E.A. sobre saldo acumulado)
 * - Al cumplirse el período de capitalización (= plazo CDT en días):
 *     CDT + cajita → nuevo CDT, cajita queda en $0
 * - Ciclo se repite hasta cumplir el plazo total en años
 * - 4×1000 se aplica sobre el saldo total final al retirar
 */
export function simulateCajitaCDT({
  capitalInicial,
  aporteMensual,
  tasaCdtEA,
  tasaCajitaEA,
  periodoCapitalizacionDias,
  anios,
  aplicarRete = false,
  aplicarCuatroPorMil = false,
}) {
  const tasaDiariaCdt = Math.pow(1 + tasaCdtEA, 1 / DAYS_PER_YEAR) - 1;
  const tasaDiariaCajita = Math.pow(1 + tasaCajitaEA, 1 / DAYS_PER_YEAR) - 1;
  const totalDias = anios * DAYS_PER_YEAR;

  let saldoCdt = capitalInicial;
  let saldoCajita = 0;
  let diasDesdeCapitalizacion = 0;
  let ciclos = 0;
  let totalInteresesCdt = 0;
  let totalInteresesCajita = 0;
  let totalAportado = capitalInicial;
  let cajitaPicoAnual = 0;
  let interesesAcumAnterior = 0;

  const yearlySnapshots = [];

  for (let dia = 1; dia <= totalDias; dia++) {
    diasDesdeCapitalizacion++;

    // 1) Aporte mensual a cajita cada 30 días (día 30, 60, 90...)
    //    12 aportes por año. No se aporta el día 1 (ese es el capital inicial al CDT).
    if (dia % 30 === 0 && aporteMensual > 0) {
      saldoCajita += aporteMensual;
      totalAportado += aporteMensual;
    }

    // 2) Interés diario CDT
    const interesDiaCdt = saldoCdt * tasaDiariaCdt;
    saldoCdt += interesDiaCdt;
    totalInteresesCdt += interesDiaCdt;

    // 3) Interés diario cajita
    const interesDiaCajita = saldoCajita * tasaDiariaCajita;
    saldoCajita += interesDiaCajita;
    totalInteresesCajita += interesDiaCajita;

    // Trackear el pico de la cajita antes de consolidar
    if (saldoCajita > cajitaPicoAnual) {
      cajitaPicoAnual = saldoCajita;
    }

    // 4) Capitalización: CDT vence → cajita (con intereses) + CDT → nuevo CDT
    if (diasDesdeCapitalizacion >= periodoCapitalizacionDias) {
      ciclos++;
      saldoCdt += saldoCajita;
      saldoCajita = 0;
      diasDesdeCapitalizacion = 0;
    }

    // 5) Snapshot anual
    if (dia % DAYS_PER_YEAR === 0) {
      const year = dia / DAYS_PER_YEAR;
      const interesesAcum = totalInteresesCdt + totalInteresesCajita;
      const rendimientoAnio = interesesAcum - interesesAcumAnterior;
      const reteAcum = aplicarRete
        ? totalInteresesCdt * RETEFUENTE_RATE + totalInteresesCajita * RETEFUENTE_CAJITA_RATE
        : 0;
      const rendimientoPct = totalAportado > 0
        ? ((interesesAcum - reteAcum) / totalAportado) * 100
        : 0;

      yearlySnapshots.push({
        year,
        saldoCdt,
        saldoCajita: cajitaPicoAnual,
        totalCombinado: saldoCdt + saldoCajita,
        aportadoAcum: totalAportado,
        interesesCdt: totalInteresesCdt,
        interesesCajita: totalInteresesCajita,
        interesesAcum,
        reteAcum,
        rendimientoAnio,
        rendimientoPct,
        ciclosAcum: ciclos,
      });

      interesesAcumAnterior = interesesAcum;
      cajitaPicoAnual = 0;
    }
  }

  // Consolidación final: si el último día no coincidió con capitalización,
  // forzar la transferencia de cajita a CDT (el usuario retira todo)
  if (saldoCajita > 0) {
    saldoCdt += saldoCajita;
    saldoCajita = 0;
  }

  const totalBruto = saldoCdt;

  const reteCdt = aplicarRete ? totalInteresesCdt * RETEFUENTE_RATE : 0;
  const reteCajita = aplicarRete ? totalInteresesCajita * RETEFUENTE_CAJITA_RATE : 0;
  const retefuente = reteCdt + reteCajita;
  const cuatroPorMil = aplicarCuatroPorMil ? totalBruto * CUATRO_POR_MIL_RATE : 0;
  const totalDescuentos = retefuente + cuatroPorMil;

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
    interesBrutoTotal: totalInteresesCdt + totalInteresesCajita,
    interesesCdt: totalInteresesCdt,
    interesesCajita: totalInteresesCajita,
    reteCdt,
    reteCajita,
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
