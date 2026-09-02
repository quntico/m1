"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  STATUS,
  calculateLiquidityRatio,
  calculateDebtRatio,
  calculateHumanResourcesScore,
  calculateFinancialCapacityScore,
  calculateExperienceScore,
  calculateSpecialtyScore,
  calculateAutoScores,
  calculateEconomicScore,
  calculateTotalScore,
  calculateTechnicalGapToMax,
  calculatePointsNeededForSolvency,
  calculateTechnicalProgressPercent,
  applyPercentageVariation,
  calculateScoreGap,
  calculateScoreAtRatio,
  calculateDifference,
  buildReport,
  calculateMaxPriceForTargetTotal,
  calculateMarginOfSafety
} = require("../../src/calculations/m1Calculations");

const criteria = [
  { id: "q_a", g: "quality", max: 4 },
  { id: "q_b", g: "quality", max: 2 },
  { id: "q_c", g: "quality", max: 1 },
  { id: "q_d", g: "quality", max: 0.5 },
  { id: "q_e", g: "quality", max: 4 },
  { id: "q_f", g: "quality", max: 1 },
  { id: "q_g", g: "quality", max: 2.5 },
  { id: "c_a", g: "capacity", max: 6 },
  { id: "c_b", g: "capacity", max: 6 },
  { id: "c_c", g: "capacity", max: 0.5 },
  { id: "c_d", g: "capacity", max: 0.5 },
  { id: "c_e", g: "capacity", max: 4 },
  { id: "e_a", g: "experience", max: 6 },
  { id: "e_b", g: "experience", max: 6 },
  { id: "e_c", g: "experience", max: 3 },
  { id: "k_a", g: "contracts", max: 3 }
];

test("calcula RRHH normal con desglose y marca regla academica por validar", () => {
  const calculation = calculateHumanResourcesScore({
    minimumStaff: true,
    experienceYears: 5,
    requiredYears: 5,
    academic: "doctorado",
    software: true
  });

  assert.equal(calculation.result, 6);
  assert.equal(calculation.breakdown.experience, 1);
  assert.equal(calculation.status, STATUS.REQUIRES_VALIDATION);
});

test("calcula RRHH en cero cuando falta plantilla minima", () => {
  const calculation = calculateHumanResourcesScore({
    minimumStaff: false,
    experienceYears: 10,
    requiredYears: 5,
    academic: "doctorado",
    software: true
  });

  assert.equal(calculation.result, 0);
});

test("valida division entre cero en liquidez", () => {
  const calculation = calculateLiquidityRatio({
    currentAssets: 100,
    currentLiabilities: 0
  });

  assert.equal(calculation.result, null);
  assert.equal(calculation.status, STATUS.REQUIRES_VALIDATION);
  assert.ok(calculation.warnings.includes("DIVISION_BY_ZERO"));
});

test("valida division entre cero en endeudamiento", () => {
  const calculation = calculateDebtRatio({
    totalLiabilities: 100,
    totalAssets: 0
  });

  assert.equal(calculation.result, null);
  assert.equal(calculation.status, STATUS.REQUIRES_VALIDATION);
});

test("calcula capacidad financiera maxima", () => {
  const calculation = calculateFinancialCapacityScore({
    workingCapital: 300,
    threeMonthNeed: 100,
    currentAssets: 200,
    currentLiabilities: 100,
    totalLiabilities: 50,
    totalAssets: 100
  });

  assert.equal(calculation.result, 6);
  assert.equal(calculation.breakdown.workingCapitalScore, 4);
});

test("calcula capacidad financiera minima", () => {
  const calculation = calculateFinancialCapacityScore({
    workingCapital: 0,
    threeMonthNeed: 100,
    currentAssets: 50,
    currentLiabilities: 100,
    totalLiabilities: 60,
    totalAssets: 100
  });

  assert.equal(calculation.result, 0);
});

test("calcula experiencia y especialidad, pero exige evidencia validada", () => {
  const experience = calculateExperienceScore({ rsu500: true, electrical: true, steel: true, industrial: true });
  const specialty = calculateSpecialtyScore({ design500: true, operated1825: true, oemMexico: 3, oemInternational: 10 });

  assert.equal(experience.result, 6);
  assert.equal(specialty.result, 6);
  assert.equal(experience.status, STATUS.REQUIRES_VALIDATION);
  assert.equal(specialty.status, STATUS.REQUIRES_VALIDATION);
});

test("calcula automaticos de Consorcio X compatibles con la UI actual", () => {
  const calculation = calculateAutoScores({
    hr: { minimumStaff: true, experienceYears: 5, requiredYears: 5, academic: "doctorado", software: true },
    finance: { workingCapital: 100, threeMonthNeed: 100, currentAssets: 100, currentLiabilities: 100, totalLiabilities: 50, totalAssets: 100 },
    extras: { disabilityPct: 5, mipyme: true, oemLetter: true, cdrLetter: true, complianceContracts: 9 },
    exp: { rsu500: true, electrical: true, steel: true, industrial: true },
    spec: { design500: true, operated1825: true, oemMexico: 3, oemInternational: 10 }
  });

  assert.deepEqual(calculation.scores, {
    c_a: 6,
    c_b: 6,
    c_c: 0.5,
    c_d: 0.5,
    c_e: 4,
    e_a: 6,
    e_b: 6,
    e_c: 3,
    k_a: 3
  });
});

test("calcula economica M1 para valores historicos", () => {
  const calculation = calculateEconomicScore({
    solvent: true,
    lowestSolventPrice: 318000000,
    proposalPrice: 425409715.32
  });

  assert.equal(calculation.result, 37.375733);
  assert.equal(calculation.units, "points");
});

test("maneja precio cero sin division directa", () => {
  const calculation = calculateEconomicScore({
    solvent: true,
    lowestSolventPrice: 318000000,
    proposalPrice: 0
  });

  assert.equal(calculation.result, 0);
  assert.equal(calculation.status, STATUS.REQUIRES_VALIDATION);
});

test("suma puntaje total", () => {
  assert.equal(calculateTotalScore({ technicalScore: 48, economicScore: 37.375733 }).result, 85.375733);
});

test("genera reporte completo con menor precio solvente y ranking", () => {
  const scores = Object.fromEntries(criteria.map((criterion) => [
    criterion.id,
    { gh: 0, pro: 0, x: 0 }
  ]));
  scores.q_a.gh = 4;
  scores.q_b.gh = 2;
  scores.q_c.gh = 1;
  scores.q_d.gh = 0.5;
  scores.q_e.gh = 4;
  scores.q_f.gh = 1;
  scores.q_g.gh = 2.5;
  scores.c_a.gh = 4.5;
  scores.c_b.gh = 6;
  scores.c_c.gh = 0;
  scores.c_d.gh = 0.5;
  scores.c_e.gh = 4;
  scores.e_a.gh = 6;
  scores.e_b.gh = 6;
  scores.e_c.gh = 3;
  scores.k_a.gh = 3;
  scores.q_a.x = 4;
  scores.q_b.x = 2;
  scores.q_c.x = 1;
  scores.q_d.x = 0.5;
  scores.q_e.x = 4;
  scores.q_f.x = 1;
  scores.q_g.x = 2.5;
  scores.c_a.x = 6;
  scores.c_b.x = 6;
  scores.c_c.x = 0.5;
  scores.c_d.x = 0.5;
  scores.c_e.x = 4;
  scores.e_a.x = 6;
  scores.e_b.x = 6;
  scores.e_c.x = 3;
  scores.k_a.x = 3;

  const report = buildReport({
    companies: {
      gh: { name: "GH", price: 425409715.32 },
      pro: { name: "PROGONZA + INARVI", price: 384946522.04 },
      x: { name: "CONSORCIO X", price: 318000000 }
    },
    scores
  }, criteria);

  assert.equal(report.low, 318000000);
  assert.equal(report.arr.find((participant) => participant.key === "gh").technical, 48);
  assert.equal(report.arr.find((participant) => participant.key === "x").total, 100);
  assert.equal(report.ordered[0].key, "x");
});

test("calcula precio maximo y margen bajo supuesto documentado", () => {
  const maxPrice = calculateMaxPriceForTargetTotal({
    technicalScore: 48,
    targetTotal: 90,
    lowestSolventPrice: 318000000
  });
  const margin = calculateMarginOfSafety({
    currentPrice: 318000000,
    maxWinningPrice: maxPrice.result
  });

  assert.equal(maxPrice.result, 378571428.57);
  assert.equal(maxPrice.status, STATUS.REQUIRES_VALIDATION);
  assert.equal(margin.result, 60571428.57);
});

test("calcula brechas, avance y variaciones de escenario fuera de la UI", () => {
  assert.equal(calculateTechnicalGapToMax(48).result, 2);
  assert.equal(calculatePointsNeededForSolvency(35.4).result, 2.1);
  assert.equal(calculateTechnicalProgressPercent(25).result, 50);
  assert.equal(calculateTechnicalProgressPercent(60).result, 100);
  assert.equal(applyPercentageVariation(1000, -10).result, 900);
  assert.equal(calculateScoreGap({ currentScore: 3, maxScore: 4 }).result, 1);
  assert.equal(calculateScoreAtRatio({ maxScore: 4, ratio: 0.9 }).result, 3.6);
  assert.equal(calculateDifference({ value: 90, baseline: 98 }).result, -8);
});
