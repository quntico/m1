const assert = require('assert');
const test = require('node:test');

// Mocks to simulate globals
global.M1Calculations = {
    calculateTechnicalScore: (criteria, scores, pk) => ({ result: { value: 37.5 } }),
    calculateSolvency: (score) => ({ result: { value: score >= 37.5 } }),
    M1_LIMITS: { TECHNICAL_MIN_SOLVENCY: 37.5 }
};

global.M1AuditTrail = {
    summarizeAudit: () => ({ validated: 1, pending: 1, nonCompliant: 0, red: 0, yellow: 2, green: 0 }),
    RISK_LEVELS: { RED: "ROJO", YELLOW: "AMARILLO", GREEN: "VERDE" },
    AUDIT_STATUSES: { VALIDATED: "VALIDADO", PENDING: "PENDIENTE", NON_COMPLIANT: "NO_CUMPLE" }
};

// Require the adapter and attach it
require('../../src/ui/adapters/auditViewAdapter');
const AuditViewAdapter = global.AuditViewAdapter;

test('auditViewAdapter groups data correctly and passes through solvency/scores', () => {
    const criteria = [{ id: "c1", t: "Crit 1", max: 5 }, { id: "c2", t: "Crit 2", max: 5 }];
    const state = {
        mode: "AUDITORIA",
        scores: {},
        audit: {
            "c1": { "x": { automaticScore: 2, finalScore: 5, override: true, manualScore: 5, status: "VALIDADO" } },
            "c2": { "x": { automaticScore: 2, finalScore: 2, status: "PENDIENTE", risk: "ROJO", evidence: "" } }
        }
    };

    // Simulate UI data mapping
    const summary = AuditViewAdapter.getSummary(state, criteria, "x", []);

    // UI Tolerates missing data
    assert.ok(summary);

    // Score mostrado = score motor
    assert.strictEqual(summary.techScore, 37.5, 'UI tech score matches CalculationEngine payload');

    // Solvencia mostrada = solvencia motor
    assert.strictEqual(summary.solvency.isSolvent, true, 'isSolvent is accurately passed through');
    assert.strictEqual(summary.solvency.margin, 0, 'Solvency margin logic calculates accurately');

    // Override conserva score automatico
    const overriddenItem = summary.items.find(x => x.id === "c1");
    assert.strictEqual(overriddenItem.autoScore, 2, 'Auto score is intact despite override');
    assert.strictEqual(overriddenItem.manualScore, 5, 'Manual score populated');
    assert.strictEqual(overriddenItem.finalScore, 5, 'Final score updated to manual because of override');

    // Filtros visuales no modifican state logic (ensured by pure item map)
    assert.strictEqual(summary.items.length, 2);

    // Gap Analysis works correctly
    const gapItem = summary.gaps.find(x => x.id === "c2");
    assert.strictEqual(gapItem.gap, 3, 'Gap logic detects score gaps');

    // Traceability checks
    assert.strictEqual(summary.traceability.override, 5, 'Overrides are accurately bucketed in Traceability bar');
});
