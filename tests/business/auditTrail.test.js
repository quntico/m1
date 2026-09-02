"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MODES,
  AUDIT_STATUSES,
  RISK_LEVELS,
  createAuditRecord,
  ensureAuditState,
  hasValidatedEvidence,
  resolveCriterionScore,
  syncAuditScores,
  updateAuditRecord,
  summarizeAudit
} = require("../../src/business/auditTrail");

const criteria = [
  { id: "c_a", max: 6, auto: "hr", fatal: true, at: "AT3" },
  { id: "q_a", max: 4, fatal: true, at: "AT9A" }
];

test("crea registros de auditoria con campos obligatorios", () => {
  const record = createAuditRecord();

  assert.equal(record.automaticScore, 0);
  assert.equal(record.finalScore, 0);
  assert.equal(record.status, AUDIT_STATUSES.PENDING);
  assert.equal(record.risk, RISK_LEVELS.YELLOW);
  assert.equal(record.override, false);
});

test("inicializa auditoria migrando docs y overrides existentes", () => {
  const state = {
    scores: { c_a: { x: 3 }, q_a: { x: 4 } },
    docs: { c_a: { done: true, owner: "Revisor", note: "AT3 folio 1" } },
    override: { c_a: { x: true } }
  };

  ensureAuditState(state, criteria, ["x"]);

  assert.equal(state.audit.c_a.x.status, AUDIT_STATUSES.VALIDATED);
  assert.equal(state.audit.c_a.x.responsible, "Revisor");
  assert.equal(state.audit.c_a.x.evidence, "AT3 folio 1");
  assert.equal(state.audit.c_a.x.override, true);
  assert.equal(state.audit.c_a.x.manualScore, 3);
});

test("detecta evidencia validada completa", () => {
  const record = createAuditRecord({
    evidence: "AT3 folio 1",
    origin: "AT3",
    responsible: "Revisor",
    date: "2026-09-01T00:00:00.000Z",
    status: AUDIT_STATUSES.VALIDATED
  });

  assert.equal(hasValidatedEvidence(record), true);
});

test("en auditoria no otorga puntaje automatico sin evidencia validada", () => {
  const record = createAuditRecord({
    automaticScore: 6,
    status: AUDIT_STATUSES.PENDING
  });

  const resolved = resolveCriterionScore({
    mode: MODES.AUDIT,
    criterion: criteria[0],
    record,
    automaticScore: 6,
    currentScore: 6
  });

  assert.equal(resolved.score, 0);
  assert.equal(resolved.status, AUDIT_STATUSES.PENDING);
  assert.ok(resolved.warnings.includes("VALIDATED_EVIDENCE_REQUIRED"));
});

test("en auditoria otorga puntaje automatico cuando hay evidencia completa", () => {
  const record = createAuditRecord({
    automaticScore: 6,
    evidence: "CV y cedula",
    origin: "AT3",
    responsible: "Revisor",
    date: "2026-09-01T00:00:00.000Z",
    status: AUDIT_STATUSES.VALIDATED
  });

  const resolved = resolveCriterionScore({
    mode: MODES.AUDIT,
    criterion: criteria[0],
    record,
    automaticScore: 6,
    currentScore: 0
  });

  assert.equal(resolved.score, 6);
  assert.equal(resolved.status, AUDIT_STATUSES.VALIDATED);
});

test("override manual conserva automatico pero exige motivo y evidencia", () => {
  const invalid = createAuditRecord({
    automaticScore: 6,
    override: true,
    manualScore: 5,
    status: AUDIT_STATUSES.VALIDATED,
    evidence: "AT3",
    origin: "AT3",
    responsible: "Revisor",
    date: "2026-09-01T00:00:00.000Z"
  });

  const resolvedInvalid = resolveCriterionScore({
    mode: MODES.AUDIT,
    criterion: criteria[0],
    record: invalid,
    automaticScore: 6,
    currentScore: 6
  });

  assert.equal(resolvedInvalid.score, 0);
  assert.ok(resolvedInvalid.warnings.includes("OVERRIDE_REASON_REQUIRED"));

  const valid = updateAuditRecord(invalid, { overrideReason: "Ajuste validado por dictamen tecnico" });
  const resolvedValid = resolveCriterionScore({
    mode: MODES.AUDIT,
    criterion: criteria[0],
    record: valid,
    automaticScore: 6,
    currentScore: 6
  });

  assert.equal(resolvedValid.score, 5);
  assert.equal(valid.automaticScore, 6);
  assert.equal(valid.manualScore, 5);
});

test("sincroniza puntajes finales segun modo", () => {
  const state = {
    mode: MODES.AUDIT,
    scores: { c_a: { x: 6 }, q_a: { x: 4 } },
    docs: {},
    override: {},
    audit: {}
  };

  ensureAuditState(state, criteria, ["x"]);
  state.audit.c_a.x = updateAuditRecord(state.audit.c_a.x, {
    evidence: "AT3 validado",
    origin: "AT3",
    responsible: "Auditor",
    status: AUDIT_STATUSES.VALIDATED
  });

  syncAuditScores({
    state,
    criteria,
    participantKeys: ["x"],
    automaticScoresByCriterion: { c_a: 6 }
  });

  assert.equal(state.scores.c_a.x, 6);
  assert.equal(state.scores.q_a.x, 0);
});

test("auditoria no destruye el score automatico base al bloquear por falta de evidencia", () => {
  const state = {
    mode: MODES.AUDIT,
    scores: { q_a: { gh: 4 } },
    docs: {},
    override: {},
    audit: {}
  };

  ensureAuditState(state, [criteria[1]], ["gh"]);
  syncAuditScores({
    state,
    criteria: [criteria[1]],
    participantKeys: ["gh"],
    automaticScoresByCriterion: {}
  });
  syncAuditScores({
    state,
    criteria: [criteria[1]],
    participantKeys: ["gh"],
    automaticScoresByCriterion: {}
  });

  assert.equal(state.audit.q_a.gh.automaticScore, 4);
  assert.equal(state.scores.q_a.gh, 0);
});

test("simulacion restaura score base cuando no hay override", () => {
  const state = {
    mode: MODES.AUDIT,
    scores: { q_a: { gh: 4 } },
    docs: {},
    override: {},
    audit: {}
  };

  ensureAuditState(state, [criteria[1]], ["gh"]);
  syncAuditScores({
    state,
    criteria: [criteria[1]],
    participantKeys: ["gh"],
    automaticScoresByCriterion: {}
  });
  state.mode = MODES.SIMULATION;
  state.scores.q_a.gh = state.audit.q_a.gh.automaticScore;
  syncAuditScores({
    state,
    criteria: [criteria[1]],
    participantKeys: ["gh"],
    automaticScoresByCriterion: {}
  });

  assert.equal(state.scores.q_a.gh, 4);
});

test("simulacion usa historico como baseline aunque el score persistido venga de auditoria", () => {
  const historicalCriterion = { id: "q_a", max: 4, fatal: true, at: "AT9A", hist: { gh: 4 } };
  const state = {
    mode: MODES.SIMULATION,
    scores: { q_a: { gh: 0 } },
    docs: {},
    override: {},
    audit: {}
  };

  ensureAuditState(state, [historicalCriterion], ["gh"]);
  syncAuditScores({
    state,
    criteria: [historicalCriterion],
    participantKeys: ["gh"],
    automaticScoresByCriterion: {}
  });

  assert.equal(state.audit.q_a.gh.automaticScore, 4);
  assert.equal(state.scores.q_a.gh, 4);
});

test("resume estados y riesgos de auditoria", () => {
  const state = {
    scores: { c_a: { x: 0 }, q_a: { x: 0 } },
    docs: {},
    override: {},
    audit: {}
  };
  ensureAuditState(state, criteria, ["x"]);
  state.audit.c_a.x.status = AUDIT_STATUSES.VALIDATED;
  state.audit.c_a.x.risk = RISK_LEVELS.GREEN;
  state.audit.q_a.x.status = AUDIT_STATUSES.NON_COMPLIANT;
  state.audit.q_a.x.risk = RISK_LEVELS.RED;

  assert.deepEqual(summarizeAudit(state, criteria, "x"), {
    validated: 1,
    pending: 0,
    nonCompliant: 1,
    red: 1,
    yellow: 0,
    green: 1
  });
});
