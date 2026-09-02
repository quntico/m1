"use strict";

(function initM1AuditTrail(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.M1AuditTrail = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildM1AuditTrail() {
  const MODES = Object.freeze({
    SIMULATION: "SIMULACION",
    AUDIT: "AUDITORIA"
  });

  const AUDIT_STATUSES = Object.freeze({
    VALIDATED: "VALIDADO",
    PENDING: "PENDIENTE",
    NON_COMPLIANT: "NO_CUMPLE"
  });

  const RISK_LEVELS = Object.freeze({
    GREEN: "VERDE",
    YELLOW: "AMARILLO",
    RED: "ROJO"
  });

  function nowIso() {
    return new Date().toISOString();
  }

  function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function createAuditRecord({
    automaticScore = 0,
    finalScore = 0,
    evidence = "",
    origin = "",
    responsible = "",
    date = "",
    status = AUDIT_STATUSES.PENDING,
    notes = "",
    override = false,
    overrideReason = "",
    manualScore = null,
    risk = RISK_LEVELS.YELLOW
  } = {}) {
    return {
      automaticScore,
      finalScore,
      evidence,
      origin,
      responsible,
      date,
      status,
      notes,
      override,
      overrideReason,
      manualScore,
      risk
    };
  }

  function ensureAuditState(state, criteria, participantKeys) {
    state.mode = state.mode || MODES.SIMULATION;
    state.audit = state.audit || {};

    criteria.forEach((criterion) => {
      state.audit[criterion.id] = state.audit[criterion.id] || {};

      participantKeys.forEach((participantKey) => {
        const legacyDoc = state.docs?.[criterion.id] || {};
        const legacyOverride = Boolean(state.override?.[criterion.id]?.[participantKey]);
        const legacyScore = toNumber(
          criterion.hist?.[participantKey],
          toNumber(state.scores?.[criterion.id]?.[participantKey])
        );
        const current = state.audit[criterion.id][participantKey] || {};

        state.audit[criterion.id][participantKey] = createAuditRecord({
          automaticScore: "automaticScore" in current ? current.automaticScore : legacyScore,
          finalScore: "finalScore" in current ? current.finalScore : legacyScore,
          evidence: current.evidence ?? legacyDoc.note ?? "",
          origin: current.origin ?? criterion.at ?? "",
          responsible: current.responsible ?? legacyDoc.owner ?? "",
          date: current.date ?? "",
          status: current.status ?? (legacyDoc.done ? AUDIT_STATUSES.VALIDATED : AUDIT_STATUSES.PENDING),
          notes: current.notes ?? legacyDoc.note ?? "",
          override: "override" in current ? Boolean(current.override) : legacyOverride,
          overrideReason: current.overrideReason ?? "",
          manualScore: current.manualScore ?? (legacyOverride ? legacyScore : null),
          risk: current.risk ?? (criterion.fatal ? RISK_LEVELS.RED : RISK_LEVELS.YELLOW)
        });
      });
    });

    return state;
  }

  function hasValidatedEvidence(record) {
    return Boolean(record) &&
      record.status === AUDIT_STATUSES.VALIDATED &&
      hasText(record.evidence) &&
      hasText(record.origin) &&
      hasText(record.responsible) &&
      hasText(record.date);
  }

  function hasValidOverride(record) {
    return Boolean(record) &&
      record.override === true &&
      record.manualScore !== null &&
      hasText(record.overrideReason) &&
      hasText(record.date);
  }

  function resolveCriterionScore({ mode, criterion, record, automaticScore, currentScore }) {
    const scoreLimit = toNumber(criterion.max);
    const normalizedAutomatic = Math.min(scoreLimit, Math.max(0, toNumber(automaticScore)));
    const normalizedCurrent = Math.min(scoreLimit, Math.max(0, toNumber(currentScore)));
    const normalizedManual = Math.min(scoreLimit, Math.max(0, toNumber(record?.manualScore)));

    if (mode !== MODES.AUDIT) {
      return {
        score: record?.override ? normalizedManual : normalizedAutomatic,
        status: record?.status || AUDIT_STATUSES.PENDING,
        risk: record?.risk || RISK_LEVELS.YELLOW,
        warnings: []
      };
    }

    if (!record) {
      return {
        score: 0,
        status: AUDIT_STATUSES.PENDING,
        risk: RISK_LEVELS.RED,
        warnings: ["AUDIT_RECORD_MISSING"]
      };
    }

    if (record.override) {
      if (!hasValidOverride(record)) {
        return {
          score: 0,
          status: AUDIT_STATUSES.PENDING,
          risk: RISK_LEVELS.RED,
          warnings: ["OVERRIDE_REASON_REQUIRED"]
        };
      }

      if (!hasValidatedEvidence(record)) {
        return {
          score: 0,
          status: AUDIT_STATUSES.PENDING,
          risk: RISK_LEVELS.RED,
          warnings: ["VALIDATED_EVIDENCE_REQUIRED_FOR_OVERRIDE"]
        };
      }

      return {
        score: normalizedManual,
        status: record.status,
        risk: record.risk,
        warnings: []
      };
    }

    if (record.status === AUDIT_STATUSES.NON_COMPLIANT) {
      return {
        score: 0,
        status: AUDIT_STATUSES.NON_COMPLIANT,
        risk: RISK_LEVELS.RED,
        warnings: ["REQUIREMENT_NOT_MET"]
      };
    }

    if (!hasValidatedEvidence(record)) {
      return {
        score: 0,
        status: AUDIT_STATUSES.PENDING,
        risk: record.risk === RISK_LEVELS.GREEN ? RISK_LEVELS.YELLOW : record.risk,
        warnings: ["VALIDATED_EVIDENCE_REQUIRED"]
      };
    }

    return {
      score: normalizedAutomatic,
      status: AUDIT_STATUSES.VALIDATED,
      risk: record.risk,
      warnings: []
    };
  }

  function syncAuditScores({ state, criteria, participantKeys, automaticScoresByCriterion }) {
    ensureAuditState(state, criteria, participantKeys);

    criteria.forEach((criterion) => {
      participantKeys.forEach((participantKey) => {
        const record = state.audit[criterion.id][participantKey];
        const automaticScore = participantKey === "x" && criterion.auto
          ? automaticScoresByCriterion[criterion.id] ?? 0
          : toNumber(
            criterion.hist?.[participantKey],
            toNumber(record.automaticScore, toNumber(state.scores?.[criterion.id]?.[participantKey]))
          );
        const currentScore = toNumber(state.scores?.[criterion.id]?.[participantKey]);

        record.automaticScore = automaticScore;
        if (!record.override) {
          record.manualScore = null;
        }

        const resolved = resolveCriterionScore({
          mode: state.mode,
          criterion,
          record,
          automaticScore,
          currentScore
        });

        record.finalScore = resolved.score;
        record.status = resolved.status;
        record.risk = resolved.risk;
        record.warnings = resolved.warnings;
        state.scores[criterion.id][participantKey] = resolved.score;
      });
    });

    return state;
  }

  function updateAuditRecord(record, patch) {
    const updated = {
      ...record,
      ...patch
    };

    if (patch.status === AUDIT_STATUSES.VALIDATED || patch.override === true || "manualScore" in patch) {
      updated.date = patch.date || updated.date || nowIso();
    }

    return createAuditRecord(updated);
  }

  function summarizeAudit(state, criteria, participantKey) {
    const records = criteria.map((criterion) => state.audit?.[criterion.id]?.[participantKey]).filter(Boolean);

    return {
      validated: records.filter((record) => record.status === AUDIT_STATUSES.VALIDATED).length,
      pending: records.filter((record) => record.status === AUDIT_STATUSES.PENDING).length,
      nonCompliant: records.filter((record) => record.status === AUDIT_STATUSES.NON_COMPLIANT).length,
      red: records.filter((record) => record.risk === RISK_LEVELS.RED).length,
      yellow: records.filter((record) => record.risk === RISK_LEVELS.YELLOW).length,
      green: records.filter((record) => record.risk === RISK_LEVELS.GREEN).length
    };
  }

  return {
    MODES,
    AUDIT_STATUSES,
    RISK_LEVELS,
    createAuditRecord,
    ensureAuditState,
    hasValidatedEvidence,
    hasValidOverride,
    resolveCriterionScore,
    syncAuditScores,
    updateAuditRecord,
    summarizeAudit
  };
});
