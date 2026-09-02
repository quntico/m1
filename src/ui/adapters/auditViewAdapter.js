"use strict";

(function initAuditViewAdapter(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.AuditViewAdapter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildAuditViewAdapter() {

    function getSummary(state, criteria, participantKey, groups) {
        if (!state || !state.audit) return null;

        // 1. Core data extraction
        const techScoreResult = typeof M1Calculations !== "undefined"
            ? M1Calculations.calculateTechnicalScore(criteria, state.scores, participantKey).result
            : { value: 0 };
        const solvencyResult = typeof M1Calculations !== "undefined"
            ? M1Calculations.calculateSolvency(techScoreResult.value).result
            : { value: false };
        const auditSummary = typeof M1AuditTrail !== "undefined"
            ? M1AuditTrail.summarizeAudit(state, criteria, participantKey)
            : null;

        let overridesCount = 0;
        let riskCount = 0;

        // 2. Map items for Matrix
        const items = criteria.map(c => {
            const a = state.audit[c.id]?.[participantKey] || {};
            const groupName = groups?.find(g => g.id === c.g)?.name || c.g;

            const isRedRisk = a.risk === (typeof M1AuditTrail !== "undefined" ? M1AuditTrail.RISK_LEVELS.RED : "ROJO");
            if (a.override) overridesCount++;
            if (isRedRisk) riskCount++;

            return {
                id: c.id,
                criterio: c.t,
                rubro: groupName,
                maxScore: c.max,
                autoScore: a.automaticScore || 0,
                manualScore: a.manualScore || 0,
                finalScore: a.finalScore || 0,
                evidence: a.evidence || "Sin documento",
                status: a.status || "PENDIENTE",
                risk: a.risk || "AMARILLO",
                override: Boolean(a.override),
                overrideReason: a.overrideReason || "",
                date: a.date || "",
                responsible: a.responsible || "",
                notes: a.notes || "",
                origin: a.origin || c.at || "",
                gap: Math.max(0, c.max - (a.finalScore || 0))
            };
        });

        // 3. Gap Analysis
        const gaps = items.filter(x => x.gap > 0).sort((a, b) => b.gap - a.gap);

        // 4. Traceability segmentation
        let scoresValidated = 0;
        let scoresPending = 0;
        let scoresOverride = 0;
        let scoresUnsupported = 0;

        const STATUS_VALIDATED = typeof M1AuditTrail !== "undefined" ? M1AuditTrail.AUDIT_STATUSES.VALIDATED : "VALIDADO";
        const STATUS_PENDING = typeof M1AuditTrail !== "undefined" ? M1AuditTrail.AUDIT_STATUSES.PENDING : "PENDIENTE";

        items.forEach(x => {
            if (x.override) {
                scoresOverride += x.finalScore;
            } else if (x.status === STATUS_VALIDATED) {
                scoresValidated += x.finalScore;
            } else if (x.status === STATUS_PENDING) {
                scoresPending += x.finalScore;
            } else {
                scoresUnsupported += x.finalScore;
            }
        });

        const MIN_SOLVENCY = typeof M1Calculations !== "undefined" ? M1Calculations.M1_LIMITS.TECHNICAL_MIN_SOLVENCY : 37.5;

        return {
            participant: participantKey,
            mode: state.mode || "AUDITORIA",
            techScore: techScoreResult.value,
            solvency: {
                isSolvent: solvencyResult.value,
                margin: solvencyResult.value ? techScoreResult.value - MIN_SOLVENCY : 0,
                missing: !solvencyResult.value ? MIN_SOLVENCY - techScoreResult.value : 0,
                min: MIN_SOLVENCY
            },
            auditSummary,
            overridesCount,
            riskCount,
            items,
            gaps,
            traceability: {
                total: techScoreResult.value,
                validated: scoresValidated,
                pending: scoresPending,
                override: scoresOverride,
                unsupported: scoresUnsupported
            }
        };
    }

    return { getSummary };
});
