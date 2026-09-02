"use strict";

(function initM1Calculations(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.M1Calculations = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildM1Calculations() {
  const STATUS = Object.freeze({
    OK: "OK",
    REQUIRES_VALIDATION: "REQUIERE_VALIDACION",
    INVALID_INPUT: "ENTRADA_INVALIDA"
  });

  const CONFIDENCE = Object.freeze({
    HIGH: "alta",
    MEDIUM: "media",
    LOW: "baja"
  });

  const M1_LIMITS = Object.freeze({
    TECHNICAL_MAX: 50,
    TECHNICAL_SOLVENCY_MIN: 37.5,
    ECONOMIC_MAX: 50,
    TOTAL_MAX: 100,
    FINANCIAL_CAPACITY_MAX: 6,
    TECHNICAL_SECTIONS: Object.freeze({
      quality: 15,
      capacity: 17,
      experience: 15,
      contracts: 3
    })
  });

  const ACADEMIC_POINTS = Object.freeze({
    none: 0,
    lic: 2,
    maestria: 3,
    doctorado: 4
  });

  function result({
    id,
    formula,
    inputs,
    value,
    units,
    sourceRule,
    confidence = CONFIDENCE.HIGH,
    status = STATUS.OK,
    warnings = [],
    breakdown = null
  }) {
    return {
      id,
      formula,
      inputs,
      result: value,
      units,
      sourceRule,
      confidence,
      status,
      warnings,
      breakdown
    };
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function roundTo(value, decimals = 6) {
    if (!isFiniteNumber(value)) {
      return value;
    }

    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, toNumber(value)));
  }

  function sumScores(criteria, scores, participantKey, groupId = null) {
    return criteria
      .filter((criterion) => !groupId || criterion.g === groupId)
      .reduce((total, criterion) => total + toNumber(scores?.[criterion.id]?.[participantKey]), 0);
  }

  function calculateWorkingCapital({ currentAssets, currentLiabilities }) {
    const assets = toNumber(currentAssets);
    const liabilities = toNumber(currentLiabilities);

    return result({
      id: "financial.workingCapital",
      formula: "capital_trabajo = activo_circulante - pasivo_circulante",
      inputs: { currentAssets, currentLiabilities },
      value: roundTo(assets - liabilities, 2),
      units: "MXN",
      sourceRule: "M1 capacidad financiera"
    });
  }

  function calculateLiquidityRatio({ currentAssets, currentLiabilities }) {
    const assets = toNumber(currentAssets);
    const liabilities = toNumber(currentLiabilities);

    if (liabilities === 0) {
      return result({
        id: "financial.liquidityRatio",
        formula: "liquidez = activo_circulante / pasivo_circulante",
        inputs: { currentAssets, currentLiabilities },
        value: null,
        units: "ratio",
        sourceRule: "M1 capacidad financiera: liquidez >= 1",
        confidence: CONFIDENCE.LOW,
        status: STATUS.REQUIRES_VALIDATION,
        warnings: ["DIVISION_BY_ZERO", "REQUIRES_RULE_FOR_ZERO_LIABILITIES"]
      });
    }

    return result({
      id: "financial.liquidityRatio",
      formula: "liquidez = activo_circulante / pasivo_circulante",
      inputs: { currentAssets, currentLiabilities },
      value: roundTo(assets / liabilities),
      units: "ratio",
      sourceRule: "M1 capacidad financiera: liquidez >= 1"
    });
  }

  function calculateDebtRatio({ totalLiabilities, totalAssets }) {
    const liabilities = toNumber(totalLiabilities);
    const assets = toNumber(totalAssets);

    if (assets === 0) {
      return result({
        id: "financial.debtRatio",
        formula: "endeudamiento = pasivo_total / activo_total",
        inputs: { totalLiabilities, totalAssets },
        value: null,
        units: "ratio",
        sourceRule: "M1 capacidad financiera: endeudamiento <= 50%",
        confidence: CONFIDENCE.LOW,
        status: STATUS.REQUIRES_VALIDATION,
        warnings: ["DIVISION_BY_ZERO", "REQUIRES_RULE_FOR_ZERO_ASSETS"]
      });
    }

    return result({
      id: "financial.debtRatio",
      formula: "endeudamiento = pasivo_total / activo_total",
      inputs: { totalLiabilities, totalAssets },
      value: roundTo(liabilities / assets),
      units: "ratio",
      sourceRule: "M1 capacidad financiera: endeudamiento <= 50%"
    });
  }

  function calculateHumanResourcesScore(hr = {}) {
    const minimumStaff = Boolean(hr.minimumStaff);
    const requiredYears = Math.max(1, toNumber(hr.requiredYears, 1));
    const experienceYears = Math.max(0, toNumber(hr.experienceYears));
    const experience = minimumStaff ? Math.min(1, experienceYears / requiredYears) : 0;
    const academic = minimumStaff ? ACADEMIC_POINTS[hr.academic] || 0 : 0;
    const software = minimumStaff && Boolean(hr.software) ? 1 : 0;

    return result({
      id: "technical.capacity.humanResources",
      formula: "rrhh = gate_plantilla_minima * (min(1, anios_acreditados / anios_requeridos) + preparacion + software)",
      inputs: { hr },
      value: roundTo(experience + academic + software),
      units: "points",
      sourceRule: "M1 recursos humanos /6",
      confidence: CONFIDENCE.MEDIUM,
      status: STATUS.REQUIRES_VALIDATION,
      warnings: ["ACADEMIC_DISTRIBUTION_REQUIRES_VALIDATION"],
      breakdown: { experience, academic, software }
    });
  }

  function calculateFinancialCapacityScore(finance = {}) {
    const workingCapital = toNumber(finance.workingCapital);
    const threeMonthNeed = toNumber(finance.threeMonthNeed);
    const liquidity = calculateLiquidityRatio({
      currentAssets: finance.currentAssets,
      currentLiabilities: finance.currentLiabilities
    });
    const debt = calculateDebtRatio({
      totalLiabilities: finance.totalLiabilities,
      totalAssets: finance.totalAssets
    });
    const workingCapitalScore = workingCapital >= threeMonthNeed && threeMonthNeed > 0 ? 4 : 0;
    const liquidityScore = liquidity.result !== null && liquidity.result >= 1 ? 1 : 0;
    const debtScore = debt.result !== null && debt.result <= 0.5 ? 1 : 0;
    const warnings = [...liquidity.warnings, ...debt.warnings];

    return result({
      id: "technical.capacity.financial",
      formula: "capacidad_financiera = capital_trabajo>=necesidad_3_meses(0|4) + liquidez>=1(0|1) + endeudamiento<=0.5(0|1)",
      inputs: { finance },
      value: roundTo(workingCapitalScore + liquidityScore + debtScore),
      units: "points",
      sourceRule: "M1 capacidad financiera /6",
      confidence: warnings.length ? CONFIDENCE.MEDIUM : CONFIDENCE.HIGH,
      status: warnings.length ? STATUS.REQUIRES_VALIDATION : STATUS.OK,
      warnings,
      breakdown: {
        workingCapitalScore,
        liquidityScore,
        debtScore,
        liquidityRatio: liquidity.result ?? 0,
        debtRatio: debt.result ?? 0
      }
    });
  }

  function calculateExperienceScore(exp = {}) {
    return result({
      id: "technical.experience",
      formula: "experiencia = RSU500(0|3) + electrica_automatizacion(0|1) + acero(0|1) + naves(0|1)",
      inputs: { exp },
      value: (exp.rsu500 ? 3 : 0) + (exp.electrical ? 1 : 0) + (exp.steel ? 1 : 0) + (exp.industrial ? 1 : 0),
      units: "points",
      sourceRule: "M1 experiencia /6",
      confidence: CONFIDENCE.MEDIUM,
      status: STATUS.REQUIRES_VALIDATION,
      warnings: ["CONTRACT_EVIDENCE_REQUIRED"]
    });
  }

  function calculateSpecialtyScore(spec = {}) {
    return result({
      id: "technical.specialty",
      formula: "especialidad = diseno_construccion_arranque_500(0|2) + operacion_1825_dias(0|2) + OEM_3_MX_10_INT(0|2)",
      inputs: { spec },
      value:
        (spec.design500 ? 2 : 0) +
        (spec.operated1825 ? 2 : 0) +
        (toNumber(spec.oemMexico) >= 3 && toNumber(spec.oemInternational) >= 10 ? 2 : 0),
      units: "points",
      sourceRule: "M1 especialidad /6",
      confidence: CONFIDENCE.MEDIUM,
      status: STATUS.REQUIRES_VALIDATION,
      warnings: ["OEM_REFERENCES_MUST_BE_VALIDATED"]
    });
  }

  function calculateAutoScores(state = {}) {
    const hr = calculateHumanResourcesScore(state.hr);
    const financial = calculateFinancialCapacityScore(state.finance);
    const experience = calculateExperienceScore(state.exp);
    const specialty = calculateSpecialtyScore(state.spec);
    const extras = state.extras || {};

    const scores = {
      c_a: hr.result,
      c_b: financial.result,
      c_c: toNumber(extras.disabilityPct) >= 5 ? 0.5 : 0,
      c_d: extras.mipyme ? 0.5 : 0,
      c_e: extras.oemLetter ? 4 : 0,
      e_a: experience.result,
      e_b: specialty.result,
      e_c: extras.cdrLetter ? 3 : 0,
      k_a: clamp(extras.complianceContracts, 0, 3)
    };

    return {
      scores,
      details: { hr, financial, experience, specialty },
      warnings: [
        ...hr.warnings,
        ...financial.warnings,
        ...experience.warnings,
        ...specialty.warnings
      ]
    };
  }

  function calculateTechnicalScore(criteria, scores, participantKey) {
    return result({
      id: "technical.total",
      formula: "total_tecnico = suma(puntajes_criterios)",
      inputs: { participantKey },
      value: roundTo(sumScores(criteria, scores, participantKey)),
      units: "points",
      sourceRule: "M1 evaluacion tecnica max 50, solvencia minima 37.50"
    });
  }

  function calculateGroupScore(criteria, scores, participantKey, groupId) {
    return result({
      id: `technical.group.${groupId}`,
      formula: "subtotal_grupo = suma(puntajes_criterios_del_grupo)",
      inputs: { participantKey, groupId },
      value: roundTo(sumScores(criteria, scores, participantKey, groupId)),
      units: "points",
      sourceRule: "M1 evaluacion tecnica por grupo"
    });
  }

  function calculateSolvency(technicalScore) {
    return result({
      id: "technical.solvency",
      formula: "solvente = total_tecnico >= 37.50",
      inputs: { technicalScore },
      value: toNumber(technicalScore) >= M1_LIMITS.TECHNICAL_SOLVENCY_MIN,
      units: "boolean",
      sourceRule: "M1 minimo tecnico para solvencia"
    });
  }

  function findLowestSolventPrice(participants) {
    const prices = participants
      .filter((participant) => participant.solvent && participant.price > 0)
      .map((participant) => participant.price);

    return result({
      id: "economic.lowestSolventPrice",
      formula: "PSPMB = min(precio de proposiciones solventes)",
      inputs: { participants },
      value: prices.length ? Math.min(...prices) : 0,
      units: "MXN",
      sourceRule: "M1 evaluacion economica: solo propuestas solventes",
      status: prices.length ? STATUS.OK : STATUS.REQUIRES_VALIDATION,
      confidence: prices.length ? CONFIDENCE.HIGH : CONFIDENCE.LOW,
      warnings: prices.length ? [] : ["NO_SOLVENT_PRICES"]
    });
  }

  function calculateEconomicScore({ solvent, lowestSolventPrice, proposalPrice }) {
    const price = toNumber(proposalPrice);
    const low = toNumber(lowestSolventPrice);

    if (!solvent || !low || !price) {
      return result({
        id: "economic.score",
        formula: "PPAj = 50 * (PSPMB / PPj)",
        inputs: { solvent, lowestSolventPrice, proposalPrice },
        value: 0,
        units: "points",
        sourceRule: "M1 evaluacion economica",
        status: price === 0 ? STATUS.REQUIRES_VALIDATION : STATUS.OK,
        confidence: price === 0 ? CONFIDENCE.LOW : CONFIDENCE.HIGH,
        warnings: price === 0 ? ["DIVISION_BY_ZERO_OR_EMPTY_PRICE"] : []
      });
    }

    if (price < 0 || low < 0) {
      return result({
        id: "economic.score",
        formula: "PPAj = 50 * (PSPMB / PPj)",
        inputs: { solvent, lowestSolventPrice, proposalPrice },
        value: 0,
        units: "points",
        sourceRule: "M1 evaluacion economica",
        status: STATUS.INVALID_INPUT,
        confidence: CONFIDENCE.LOW,
        warnings: ["NEGATIVE_PRICE"]
      });
    }

    return result({
      id: "economic.score",
      formula: "PPAj = 50 * (PSPMB / PPj)",
      inputs: { solvent, lowestSolventPrice, proposalPrice },
      value: roundTo(M1_LIMITS.ECONOMIC_MAX * low / price),
      units: "points",
      sourceRule: "M1 evaluacion economica"
    });
  }

  function calculateTotalScore({ technicalScore, economicScore }) {
    return result({
      id: "score.total",
      formula: "PTj = TPT + TPE",
      inputs: { technicalScore, economicScore },
      value: roundTo(toNumber(technicalScore) + toNumber(economicScore)),
      units: "points",
      sourceRule: "M1 puntaje final max 100"
    });
  }

  function calculateTechnicalGapToMax(technicalScore) {
    return result({
      id: "technical.gapToMax",
      formula: "brecha_maxima = max(0, 50 - total_tecnico)",
      inputs: { technicalScore },
      value: roundTo(Math.max(0, M1_LIMITS.TECHNICAL_MAX - toNumber(technicalScore))),
      units: "points",
      sourceRule: "M1 evaluacion tecnica max 50"
    });
  }

  function calculatePointsNeededForSolvency(technicalScore) {
    return result({
      id: "technical.pointsNeededForSolvency",
      formula: "faltante_solvencia = max(0, 37.50 - total_tecnico)",
      inputs: { technicalScore },
      value: roundTo(Math.max(0, M1_LIMITS.TECHNICAL_SOLVENCY_MIN - toNumber(technicalScore))),
      units: "points",
      sourceRule: "M1 minimo tecnico para solvencia"
    });
  }

  function calculateTechnicalProgressPercent(technicalScore) {
    return result({
      id: "technical.progressPercent",
      formula: "avance_tecnico = min(100, (total_tecnico / 50) * 100)",
      inputs: { technicalScore },
      value: roundTo(Math.min(100, toNumber(technicalScore) / M1_LIMITS.TECHNICAL_MAX * 100)),
      units: "percent",
      sourceRule: "M1 evaluacion tecnica max 50"
    });
  }

  function applyPercentageVariation(baseValue, percentageVariation) {
    return result({
      id: "price.percentageVariation",
      formula: "valor_ajustado = valor_base * (1 + variacion_porcentual / 100)",
      inputs: { baseValue, percentageVariation },
      value: roundTo(toNumber(baseValue) * (1 + toNumber(percentageVariation) / 100), 2),
      units: "MXN",
      sourceRule: "M1 escenarios de sensibilidad"
    });
  }

  function buildReport(state, criteria) {
    const arr = Object.entries(state.companies).map(([key, company]) => {
      const technical = calculateTechnicalScore(criteria, state.scores, key).result;
      return {
        key,
        name: company.name,
        price: toNumber(company.price),
        technical,
        solvent: calculateSolvency(technical).result
      };
    });
    const low = findLowestSolventPrice(arr).result;

    arr.forEach((participant) => {
      participant.economic = calculateEconomicScore({
        solvent: participant.solvent,
        lowestSolventPrice: low,
        proposalPrice: participant.price
      }).result;
      participant.total = calculateTotalScore({
        technicalScore: participant.technical,
        economicScore: participant.economic
      }).result;
    });

    return {
      arr,
      low,
      ordered: [...arr].sort((a, b) => b.total - a.total)
    };
  }

  function calculateMaxPriceForTargetTotal({ technicalScore, targetTotal, lowestSolventPrice }) {
    const requiredEconomicScore = toNumber(targetTotal) - toNumber(technicalScore);

    if (requiredEconomicScore <= 0) {
      return result({
        id: "price.maxForTargetTotal",
        formula: "precio_maximo = (50 * PSPMB) / (puntaje_objetivo - puntaje_tecnico)",
        inputs: { technicalScore, targetTotal, lowestSolventPrice },
        value: null,
        units: "MXN",
        sourceRule: "M1 inteligencia de precio derivada de PPAj",
        confidence: CONFIDENCE.LOW,
        status: STATUS.REQUIRES_VALIDATION,
        warnings: ["TARGET_ALREADY_REACHED_WITH_TECHNICAL_SCORE"]
      });
    }

    return result({
      id: "price.maxForTargetTotal",
      formula: "precio_maximo = (50 * PSPMB) / (puntaje_objetivo - puntaje_tecnico)",
      inputs: { technicalScore, targetTotal, lowestSolventPrice },
      value: roundTo(M1_LIMITS.ECONOMIC_MAX * toNumber(lowestSolventPrice) / requiredEconomicScore, 2),
      units: "MXN",
      sourceRule: "M1 inteligencia de precio derivada de PPAj",
      confidence: CONFIDENCE.MEDIUM,
      status: STATUS.REQUIRES_VALIDATION,
      warnings: ["ASSUMES_LOWEST_SOLVENT_PRICE_REMAINS_CONSTANT"]
    });
  }

  function calculateMarginOfSafety({ currentPrice, maxWinningPrice }) {
    return result({
      id: "price.marginOfSafety",
      formula: "margen_seguridad = precio_maximo_para_ganar - precio_actual",
      inputs: { currentPrice, maxWinningPrice },
      value: roundTo(toNumber(maxWinningPrice) - toNumber(currentPrice), 2),
      units: "MXN",
      sourceRule: "M1 inteligencia de precio",
      confidence: CONFIDENCE.MEDIUM
    });
  }

  function calculateScoreGap({ currentScore, maxScore }) {
    return result({
      id: "score.gap",
      formula: "brecha = max(0, puntaje_maximo - puntaje_actual)",
      inputs: { currentScore, maxScore },
      value: roundTo(Math.max(0, toNumber(maxScore) - toNumber(currentScore))),
      units: "points",
      sourceRule: "M1 analisis de brechas"
    });
  }

  function calculateScoreAtRatio({ maxScore, ratio }) {
    return result({
      id: "score.atRatio",
      formula: "puntaje_objetivo = puntaje_maximo * factor",
      inputs: { maxScore, ratio },
      value: roundTo(toNumber(maxScore) * toNumber(ratio)),
      units: "points",
      sourceRule: "M1 escenarios tecnicos"
    });
  }

  function calculateDifference({ value, baseline }) {
    return result({
      id: "score.difference",
      formula: "diferencia = valor - base",
      inputs: { value, baseline },
      value: roundTo(toNumber(value) - toNumber(baseline)),
      units: "points",
      sourceRule: "M1 comparativo competitivo"
    });
  }

  return {
    STATUS,
    CONFIDENCE,
    M1_LIMITS,
    ACADEMIC_POINTS,
    roundTo,
    clamp,
    calculateWorkingCapital,
    calculateLiquidityRatio,
    calculateDebtRatio,
    calculateHumanResourcesScore,
    calculateFinancialCapacityScore,
    calculateExperienceScore,
    calculateSpecialtyScore,
    calculateAutoScores,
    calculateTechnicalScore,
    calculateGroupScore,
    calculateSolvency,
    findLowestSolventPrice,
    calculateEconomicScore,
    calculateTotalScore,
    calculateTechnicalGapToMax,
    calculatePointsNeededForSolvency,
    calculateTechnicalProgressPercent,
    applyPercentageVariation,
    buildReport,
    calculateMaxPriceForTargetTotal,
    calculateMarginOfSafety,
    calculateScoreGap,
    calculateScoreAtRatio,
    calculateDifference
  };
});
