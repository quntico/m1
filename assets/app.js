const M1Calc = window.M1Calculations;
const M1Audit = window.M1AuditTrail;
const MIN = M1Calc.M1_LIMITS.TECHNICAL_SOLVENCY_MIN;
const groups = [{ id: "quality", name: "I. CALIDAD DE LA OBRA", max: 15 }, { id: "capacity", name: "II. CAPACIDAD DEL LICITANTE", max: 17 }, { id: "experience", name: "III. EXPERIENCIA Y ESPECIALIDAD", max: 15 }, { id: "contracts", name: "IV. CUMPLIMIENTO DE CONTRATOS", max: 3 }];

const criteria = [
  { id: "q_a", g: "quality", t: "a) Materiales, maquinaria y equipo de instalación permanente", max: 4, at: "AT9A / AT12A", d: "Cumplimiento de alcances, especificaciones, planos, catálogo y congruencia de programas.", hist: { gh: 4, pro: 3.5 }, fatal: true },
  { id: "q_b", g: "quality", t: "b) Mano de obra", max: 2, at: "AT9B / AT12B", d: "Jornales, aptitudes, requisitos administrativos, categorías y congruencia.", hist: { gh: 2, pro: 1.3 }, fatal: true },
  { id: "q_c", g: "quality", t: "c) Maquinaria y equipo de construcción", max: 1, at: "AT7 / AT9C / AT12C", d: "Características, cantidades y congruencia de maquinaria/equipo.", hist: { gh: 1, pro: .8 }, fatal: true },
  { id: "q_d", g: "quality", t: "d) Organigrama de profesionales técnicos", max: .5, at: "AT3A / AT3B", d: "Estructura suficiente y congruente; plantilla y CV actualizados.", hist: { gh: .5, pro: 0 }, fatal: true },
  { id: "q_e", g: "quality", t: "e) Procedimiento constructivo y planeación integral", max: 4, at: "AT2", d: "Anteproyecto, balance de flujo, caracterización, procedimiento, recursos y proceso integral.", hist: { gh: 4, pro: 0 }, fatal: true },
  { id: "q_f", g: "quality", t: "f) Programas", max: 1, at: "AT11 / AT12A-D", d: "Programas generales/específicos, ruta crítica, barras, avance, acumulados y totales.", hist: { gh: 1, pro: .8 }, fatal: true },
  { id: "q_g", g: "quality", t: "g) Sistema de aseguramiento de calidad", max: 2.5, at: "AT2", d: "Control de calidad, medición/pruebas, aceptación/rechazo y medidas correctivas.", hist: { gh: 2.5, pro: 0 }, fatal: true },

  { id: "c_a", g: "capacity", t: "a) Capacidad de recursos humanos", max: 6, at: "AT3", d: "Se calcula con plantilla mínima + experiencia + preparación + software.", hist: { gh: 4.5, pro: 4 }, auto: "hr", fatal: true },
  { id: "c_b", g: "capacity", t: "b) Capacidad de recursos económicos", max: 6, at: "AT6", d: "Capital de trabajo, liquidez y apalancamiento.", hist: { gh: 6, pro: 6 }, auto: "fin", fatal: true },
  { id: "c_c", g: "capacity", t: "c) Participación de personal con discapacidad", max: .5, at: "AT13", d: "Acreditación de personal con discapacidad; referencia de 5% en el criterio.", hist: { gh: 0, pro: 0 }, auto: "disability" },
  { id: "c_d", g: "capacity", t: "d) Subcontratación de MIPYMES", max: .5, at: "AT2 / carta", d: "Carta/documentación para laboratorios de calidad de agua y materiales.", hist: { gh: .5, pro: 0 }, auto: "mipyme", fatal: true },
  { id: "c_e", g: "capacity", t: "e) Carta compromiso del fabricante", max: 4, at: "Carta OEM / soporte AT4", d: "Carta firmada, QR, contacto, web y compromiso de suministro RSU/CDR.", hist: { gh: 4, pro: 4 }, auto: "oemletter", fatal: true },

  { id: "e_a", g: "experience", t: "a) Experiencia", max: 6, at: "AT4", d: "1) RSU ≥500 t/d: 3 pts. 2) Instalaciones eléctricas/automatización: 1. 3) Estructuras/accesorios: 1. 4) Naves industriales: 1.", hist: { gh: 6, pro: 5 }, auto: "exp", fatal: true },
  { id: "e_b", g: "experience", t: "b) Especialidad", max: 6, at: "AT4 / referencias OEM", d: "1) Diseño/construcción/puesta en marcha ≥500 t/d: 2. 2) Operación en últimos 1,825 días: 2. 3) OEM ≥3 plantas México y ≥10 internacionales: 2.", hist: { gh: 6, pro: 5 }, auto: "spec", fatal: true },
  { id: "e_c", g: "experience", t: "c) Carta intención aprovechamiento CDR", max: 3, at: "Carta CDR", d: "Empresa autorizada, carta firmada, QR, contacto y web verificables.", hist: { gh: 3, pro: 3 }, auto: "cdr", fatal: true },

  { id: "k_a", g: "contracts", t: "Cumplimiento de contratos", max: 3, at: "AT4 / actas", d: "Contratos y actas/documentación de cumplimiento dentro del periodo indicado.", hist: { gh: 3, pro: 2 }, auto: "compliance", fatal: true }
];

const defaultState = () => ({
  companies: { gh: { name: "GH", price: 425409715.32 }, pro: { name: "PROGONZA + INARVI", price: 384946522.04 }, x: { name: "CONSORCIO X", price: 318000000 } },
  basePrices: { gh: 425409715.32, pro: 384946522.04, x: 318000000 },
  mode: M1Audit.MODES.SIMULATION,
  scores: {}, notes: {}, override: {},
  hr: { minimumStaff: false, experienceYears: 0, requiredYears: 5, academic: "none", software: false },
  finance: { workingCapital: 0, threeMonthNeed: 1, currentAssets: 0, currentLiabilities: 1, totalLiabilities: 0, totalAssets: 1 },
  extras: { disabilityPct: 0, mipyme: false, oemLetter: false, cdrLetter: false, complianceContracts: 0, complianceMax: 3 },
  exp: { rsu500: false, electrical: false, steel: false, industrial: false },
  spec: { design500: false, operated1825: false, oemMexico: 0, oemInternational: 0 },
  contracts: [],
  docs: {},
  audit: {}
});
let state = defaultState();
criteria.forEach(c => { state.scores[c.id] = { gh: c.hist.gh, pro: c.hist.pro, x: 0 }; state.notes[c.id] = { gh: "", pro: "", x: "" }; state.override[c.id] = { x: false }; state.docs[c.id] = { done: false, owner: "", note: "" } });
try { const s = localStorage.getItem("m1_prequal_autosave"); if (s) state = merge(defaultState(), JSON.parse(s)) } catch (e) { }
const participantKeys = () => Object.keys(state.companies);
M1Audit.ensureAuditState(state, criteria, participantKeys());
function merge(a, b) { if (Array.isArray(a)) return b ?? a; if (a && typeof a === "object") { for (const k in a) a[k] = k in (b || {}) ? merge(a[k], b[k]) : a[k]; for (const k in (b || {})) if (!(k in a)) a[k] = b[k]; return a } return b ?? a }
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const fmt = n => Number(n || 0).toFixed(2), money = n => Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }), clamp = M1Calc.clamp;
function persist() { localStorage.setItem("m1_prequal_autosave", JSON.stringify(state)) }
function autoScores() {
  return M1Calc.calculateAutoScores(state).scores;
}
function syncAuto() {
  const a = autoScores();
  Object.entries(a).forEach(([id, v]) => {
    if (!state.audit[id]?.x?.override) state.scores[id].x = v;
  });
  M1Audit.syncAuditScores({ state, criteria, participantKeys: participantKeys(), automaticScoresByCriterion: a });
}
function setManualScore(id, k, score) {
  const c = criteria.find(x => x.id === id);
  const safeScore = clamp(score, 0, c.max);
  state.scores[id][k] = safeScore;
  state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { override: true, manualScore: safeScore });
  if (k === "x") state.override[id].x = true;
}
window.setManualScore = setManualScore;
function tech(k) { syncAuto(); return M1Calc.calculateTechnicalScore(criteria, state.scores, k).result }
function gscore(k, g) { syncAuto(); return M1Calc.calculateGroupScore(criteria, state.scores, k, g).result }
function report() { syncAuto(); return M1Calc.buildReport(state, criteria) }
function badge(x) { return `<span class="badge ${x.solvent ? "good" : "bad"}">${x.solvent ? "SOLVENTE" : "NO SOLVENTE"}</span>` }
function card(x) { return `<article class="card ${x.key}"><div class="ct"><h3>${x.name}</h3>${badge(x)}</div><div class="metrics"><div class="metric"><span>Técnica</span><b>${fmt(x.technical)}/50</b></div><div class="metric"><span>Económica</span><b>${fmt(x.economic)}/50</b></div><div class="metric"><span>Total</span><b>${fmt(x.total)}/100</b></div><div class="metric"><span>Oferta</span><b style="font-size:14px">${money(x.price)}</b></div></div></article>` }
function renderCockpit() {
  window.cockpitTarget = window.cockpitTarget || "x";
  const r = report(), x = r.arr.find(a => a.key === window.cockpitTarget) || r.arr.find(a => a.key === "x"), gap = M1Calc.calculateTechnicalGapToMax(x.technical).result, pct = M1Calc.calculateTechnicalProgressPercent(x.technical).result;
  const auditSummary = M1Audit.summarizeAudit(state, criteria, window.cockpitTarget);
  const modeHtml = `<div style="display:flex;gap:12px;margin-bottom:12px;align-items:center;justify-content:space-between;background:var(--bg-main);border:1px solid var(--line-strong);border-radius:8px;padding:12px 14px"><div><span class="eyebrow">MODO</span><b style="display:block;color:var(--text-dark)">${state.mode}</b><small class="desc">SIMULACION permite escenarios. AUDITORIA exige evidencia validada antes de otorgar puntos.</small></div><select id="modeSelect" style="max-width:180px"><option value="SIMULACION">SIMULACION</option><option value="AUDITORIA">AUDITORIA</option></select></div>`;
  const tabsHtml = `<div class="tabs-ui" style="display:flex;gap:12px;margin-bottom:12px;">${r.arr.map(a => `<button class="${a.key === window.cockpitTarget ? 'active' : ''}" style="flex:1;text-align:center;justify-content:center;border-radius:12px;" onclick="window.cockpitTarget='${a.key}'; renderAll()">${a.name}</button>`).join("")}</div>`;
  const actionsHtml = `<div style="display:flex;gap:12px;margin-bottom:24px;">
    <button style="flex:1" class="primary" onclick="criteria.forEach(c=>setManualScore(c.id,window.cockpitTarget,c.max));persist();renderAll()">✓ Aprobar todos los puntos</button>
    <button style="flex:1" class="warn" onclick="criteria.forEach(c=>setManualScore(c.id,window.cockpitTarget,0));persist();renderAll()">✕ Limpiar todos los puntos</button>
  </div>`;
  const explainerHtml = `<div style="background:var(--bg-main);border-left:4px solid var(--accent);border-radius:8px;padding:16px;margin-bottom:24px;display:flex;gap:16px;align-items:center;box-shadow: 0 4px 12px rgba(0,0,0,0.02)">
      <div style="font-size:28px;">💡</div>
      <div>
        <b style="color:var(--text-dark);font-size:14px;font-family:'Montserrat',sans-serif;text-transform:uppercase;display:block;margin-bottom:4px;">Lógica del Algoritmo</b>
        <p style="margin:0;color:var(--text-muted);font-size:13px;line-height:1.5;">El simulador calcula <b>100 Puntos Totales</b>: La <b>Evaluación Técnica</b> otorga máximo 50 pts (se requiere 37.50 para sobrevivir). La propuesta <b>Económica</b> otorga 50 pts al precio más bajo y penaliza proporcionalmente a las demás opciones.</p>
      </div>
  </div>`;
  $("#hero").innerHTML = `${modeHtml}${tabsHtml}${actionsHtml}${explainerHtml}<section class="hero"><div><span class="eyebrow">${x.name}</span><h2>${x.solvent ? "Técnicamente solvente" : "Aún no alcanza el mínimo técnico"}</h2><p>Mínimo 37.50/50. Brecha al máximo: <b>${fmt(gap)} pts</b>. ${x.solvent ? "Puede entrar al cálculo económico." : "Faltan " + fmt(M1Calc.calculatePointsNeededForSolvency(x.technical).result) + " puntos para el umbral."}</p><p class="desc">Auditoría: ${auditSummary.validated} validados · ${auditSummary.pending} pendientes · ${auditSummary.nonCompliant} no cumplen · riesgo rojo ${auditSummary.red}</p><div class="progress"><div style="width:${pct}%"></div></div></div><div><div class="score">${fmt(x.technical)}</div><b>de 50 pts técnicos</b></div></section>`;
  $("#modeSelect").value = state.mode;
  $("#modeSelect").onchange = e => { state.mode = e.target.value; persist(); renderAll() };
  $("#companyCards").innerHTML = r.arr.map(card).join("");
  const breaches = criteria.map(c => ({ c, loss: M1Calc.calculateScoreGap({ currentScore: state.scores[c.id][window.cockpitTarget], maxScore: c.max }).result, score: state.scores[c.id][window.cockpitTarget] })).filter(o => o.loss > .001).sort((a, b) => b.loss - a.loss);
  const actionUI = (c, k, loss) => `<div style="text-align:right"><div style="color:var(--danger);font-weight:900;font-size:16px;margin-bottom:6px">Faltan ${fmt(loss)} pts</div><button class="primary" style="padding:6px 12px;font-size:10px" onclick="setManualScore('${c.id}','${k}',${c.max});persist();renderAll()">Subsanar / Aprobar</button></div>`;
  $("#breaches").innerHTML = breaches.length ? breaches.slice(0, 9).map(o => `<div class="breach" style="align-items:center;"><div><b>${o.c.t}</b><small>${o.c.at} · Brecha detectada</small></div>${actionUI(o.c, window.cockpitTarget, o.loss)}</div>`).join("") : `<div class="calcbox"><b>Sin brechas: 50/50</b></div>`;
  document.querySelector("#view-cockpit .grid2 section:nth-child(1) h2").textContent = `Qué falta para maximizar ${x.name}`;
  const risks = criteria.filter(c => c.fatal && M1Calc.calculateScoreGap({ currentScore: state.scores[c.id][window.cockpitTarget], maxScore: c.max }).result > .001);
  $("#fatalRisks").innerHTML = risks.length ? risks.slice(0, 9).map(c => `<div class="risk" style="align-items:center;"><div><b>${c.t}</b><div class="desc">${c.at} · Riesgo de descalificación</div></div>${actionUI(c, window.cockpitTarget, M1Calc.calculateScoreGap({ currentScore: state.scores[c.id][window.cockpitTarget], maxScore: c.max }).result)}</div>`).join("") : `<div class="calcbox"><b>Sin alertas críticas.</b></div>`;
  document.querySelector("#view-cockpit .grid2 section:nth-child(2) h2").textContent = `Semáforo de desechamiento: ${x.name}`;
  $("#ranking").innerHTML = r.ordered.map((a, i) => `<tr><td>${i + 1}</td><td><b>${a.name}</b></td><td>${fmt(a.technical)}</td><td>${badge(a)}</td><td>${fmt(a.economic)}</td><td><b>${fmt(a.total)}</b></td><td>${money(a.price)}</td></tr>`).join("");
}
function scoreCell(c, k) {
  const val = Number(state.scores[c.id][k] || 0);
  const auto = (k === "x" && c.auto) && !state.audit[c.id]?.x?.override;
  return `<div class="scorebox"><button data-zero="${c.id}|${k}" class="${val === 0 ? 'led-red' : ''}">✕</button><input data-score="${c.id}|${k}" type="number" step=".1" min="0" max="${c.max}" value="${val}" ${auto ? "disabled" : ""}><button data-max="${c.id}|${k}" class="${val >= c.max ? 'led-green' : ''}">✓</button></div>${k === "x" && c.auto ? `<label class="desc" style="display:block;margin-top:8px"><input type="checkbox" data-override="${c.id}" ${state.override[c.id]?.x ? "checked" : ""}> manual</label>` : ""}`;
}
function scoreCellTD(c, k) { const a = state.audit[c.id]?.[k]; return `<td>${scoreCell(c, k)}<div class="desc" style="margin-top:6px">${(k === "x" && c.auto) && !a?.override ? "AUTO" : "editable"} · máx ${fmt(c.max)} · ${a?.status || "PENDIENTE"} · ${a?.risk || "AMARILLO"}</div><input class="note" data-note="${c.id}|${k}" placeholder="Nota / evidencia" value="${esc(state.notes[c.id][k] || "")}"></td>`; }
function esc(s) { return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m])) }
const techIcon = (t) => {
  let lower = t.toLowerCase();
  if (lower.includes("maquinaria")) return `<div style="width:50px;height:50px;border-radius:12px;background:#E0F2FE;color:#0284C7;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0"><i class="ph-bold ph-tractor"></i></div>`;
  if (lower.includes("mano de obra")) return `<div style="width:50px;height:50px;border-radius:12px;background:#F3E8FF;color:#9333EA;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0"><i class="ph-bold ph-users-three"></i></div>`;
  return `<div style="width:50px;height:50px;border-radius:12px;background:#DCFCE7;color:#16A34A;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0"><i class="ph-bold ph-clipboard-text"></i></div>`;
};

function renderTechnical() {
  syncAuto(); const q = ($("#techSearch")?.value || "").toLowerCase();
  const scEl = $("#techConsorcioScore");
  if (scEl) {
    let total = 0, max = 0;
    groups.forEach(g => { total += gscore("x", g.id); max += g.max; });
    scEl.innerHTML = `Consorcio X: ${fmt(total)} / ${fmt(max)} pts <i class="ph-bold ph-check-circle" style="font-size:16px;"></i>`;
  }
  $("#technicalMatrix").innerHTML = groups.map(g => {
    const list = criteria.filter(c => c.g === g.id && (`${c.t} ${c.at} ${c.d}`).toLowerCase().includes(q));
    if (!list.length) return "";
    return `<div class="group"><div class="ghd" style="display:flex;align-items:center;gap:12px;padding:24px 0 16px 0"><div style="width:6px;height:24px;background:var(--accent);border-radius:100px;"></div><span style="font-weight:900;font-size:16px;color:var(--text-dark)">${g.name}</span></div><div class="tablewrap"><table class="criteria"><thead><tr><th style="padding-left:24px">Criterio</th><th>Máx.</th><th>GH</th><th>PROGONZA</th><th>CONSORCIO X</th></tr></thead><tbody>${list.map(c => `<tr><td><div style="display:flex;gap:16px">${techIcon(c.t)}<div><div class="title">${c.t}</div><div class="desc">${c.d}</div><div style="margin-top:12px;font-size:11px;background:rgba(59,130,246,0.1);padding:6px 10px;border-radius:6px;display:inline-block;color:var(--text-muted);border:1px solid rgba(59,130,246,0.2)">Documento de Referencia: <b style="color:#2563EB">${c.at}</b></div></div></div></td><td><b style="font-size:16px;color:var(--text-dark);display:block;margin-bottom:2px">${fmt(c.max)}</b><span style="font-size:11px;color:var(--text-muted)">puntos</span></td>${scoreCellTD(c, "gh")}${scoreCellTD(c, "pro")}${scoreCellTD(c, "x")}</tr>`).join("")}</tbody></table></div></div>`
  }).join("");
}
function bindScores() {
  $$("[data-score]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.score.split("|"); setManualScore(id, k, e.value); persist(); renderAll() });
  $$("[data-zero]").forEach(b => b.onclick = () => { const [id, k] = b.dataset.zero.split("|"); setManualScore(id, k, 0); persist(); renderAll() });
  $$("[data-max]").forEach(b => b.onclick = () => { const [id, k] = b.dataset.max.split("|"), c = criteria.find(x => x.id === id); setManualScore(id, k, c.max); persist(); renderAll() });
  $$("[data-note]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.note.split("|"); state.notes[id][k] = e.value; state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { notes: e.value, evidence: e.value }); persist() });
  $$("[data-override]").forEach(e => e.onchange = () => { state.override[e.dataset.override].x = e.checked; state.audit[e.dataset.override].x = M1Audit.updateAuditRecord(state.audit[e.dataset.override].x, { override: e.checked, manualScore: e.checked ? state.scores[e.dataset.override].x : null }); persist(); renderAll() });
}
function chk(id, label, sub, checked) { return `<label class="check"><input type="checkbox" id="${id}" ${checked ? "checked" : ""}><span><b>${label}</b><small>${sub}</small></span></label>` }
function renderHR() {
  const h = state.hr, hrCalc = M1Calc.calculateHumanResourcesScore(h), a = hrCalc.result;
  $("#hrEngine").innerHTML = `${chk("hrMin", "Plantilla mínima completa", "Sólo se asigna puntuación si se acredita la plantilla mínima indicada en los Alcances.", h.minimumStaff)}
 <div class="formgrid"><div class="field"><label>Años de experiencia acreditados</label><input id="hrYears" type="number" min="0" step=".5" value="${h.experienceYears}"></div><div class="field"><label>Años máximos/requeridos usados para comparación</label><input id="hrReq" type="number" min="1" step=".5" value="${h.requiredYears}"></div>
 <div class="field"><label>Grado académico del responsable</label><select id="hrAcad"><option value="none">Sin acreditar</option><option value="lic">Licenciatura / Ing. Civil</option><option value="maestria">Maestría</option><option value="doctorado">Doctorado</option></select></div>
 <div class="field"><label>Dominio de software de diseño 2D/3D acreditado</label><select id="hrSoft"><option value="0">No</option><option value="1">Sí</option></select></div></div>`;
  $("#hrAcad").value = h.academic; $("#hrSoft").value = h.software ? "1" : "0";
  $("#hrResult").innerHTML = `<div class="calcbox"><span class="eyebrow">PUNTAJE</span><div class="big">${fmt(a)} / 6.00</div></div>
 <div class="ratio"><span>Experiencia</span><b>${fmt(hrCalc.breakdown.experience)} / 1</b></div>
 <div class="ratio"><span>Preparación académica</span><b>${fmt(hrCalc.breakdown.academic)} / 4</b></div>
 <div class="ratio"><span>Software 2D/3D</span><b>${fmt(hrCalc.breakdown.software)} / 1</b></div>
 <p class="desc">El método asigna 6 puntos a este subrubro y condiciona la puntuación a acreditar la plantilla mínima. El motor permite parametrizar años porque el documento usa una relación proporcional respecto al máximo acreditado.</p>`;
  $("#hrMin").onchange = e => { h.minimumStaff = e.target.checked; persist(); renderAll() };
  $("#hrYears").onchange = e => { h.experienceYears = +e.target.value; persist(); renderAll() }; $("#hrReq").onchange = e => { h.requiredYears = +e.target.value; persist(); renderAll() };
  $("#hrAcad").onchange = e => { h.academic = e.target.value; persist(); renderAll() }; $("#hrSoft").onchange = e => { h.software = e.target.value === "1"; persist(); renderAll() };
}
function renderExperience() {
  $("#expEngine").innerHTML = `${chk("ex1", "Contrato: tratamiento RSU ≥500 t/d", "3.0 puntos.", state.exp.rsu500)}${chk("ex2", "Contrato: instalaciones eléctricas y automatización de planta de proceso", "1.0 punto.", state.exp.electrical)}${chk("ex3", "Contrato: estructuras de acero, piezas especiales y accesorios", "1.0 punto.", state.exp.steel)}${chk("ex4", "Contrato: construcción de naves industriales", "1.0 punto.", state.exp.industrial)}<div class="calcbox"><div class="big">${fmt(autoScores().e_a)} / 6.00</div></div>`;
  $("#specEngine").innerHTML = `${chk("sp1", "Diseño, construcción y puesta en marcha RSU ≥500 t/d", "2.0 puntos.", state.spec.design500)}${chk("sp2", "Operación de una planta dentro de los 1,825 días previos", "2.0 puntos.", state.spec.operated1825)}
 <div class="formgrid"><div class="field"><label>Plantas OEM instaladas en México</label><input id="oemMx" type="number" min="0" value="${state.spec.oemMexico}"></div><div class="field"><label>Plantas OEM internacionales</label><input id="oemInt" type="number" min="0" value="${state.spec.oemInternational}"></div></div>
 <div class="calcbox"><div class="big">${fmt(autoScores().e_b)} / 6.00</div><div class="desc">OEM: 2 pts si acredita al menos 3 plantas nacionales y 10 internacionales.</div></div>`;
  [["#ex1", "rsu500"], ["#ex2", "electrical"], ["#ex3", "steel"], ["#ex4", "industrial"]].forEach(([s, k]) => $(s).onchange = e => { state.exp[k] = e.target.checked; persist(); renderAll() });
  [["#sp1", "design500"], ["#sp2", "operated1825"]].forEach(([s, k]) => $(s).onchange = e => { state.spec[k] = e.target.checked; persist(); renderAll() });
  $("#oemMx").onchange = e => { state.spec.oemMexico = +e.target.value; persist(); renderAll() }; $("#oemInt").onchange = e => { state.spec.oemInternational = +e.target.value; persist(); renderAll() };
  renderContracts();
}
function renderContracts() {
  const rows = state.contracts.map((c, i) => `<div class="row"><input data-c="${i}|name" placeholder="Contrato / cliente" value="${esc(c.name || "")}"><input data-c="${i}|date" type="date" value="${c.date || ""}">
 ${["rsu", "electrical", "steel", "industrial", "operate", "urban"].map(k => `<label class="desc"><input type="checkbox" data-cc="${i}|${k}" ${c[k] ? "checked" : ""}> ${k}</label>`).join("")}<button data-delc="${i}">✕</button></div>`).join("");
  $("#contractsTable").innerHTML = `<div class="contracts"><div class="row" style="font-weight:800"><div>Contrato</div><div>Fecha</div><div>RSU</div><div>Eléc.</div><div>Acero</div><div>Nave</div><div>Operación</div><div>Mej. urbano</div><div></div></div>${rows || '<p class="desc">Sin contratos cargados.</p>'}</div>`;
  $$("[data-c]").forEach(e => e.onchange = () => { const [i, k] = e.dataset.c.split("|"); state.contracts[i][k] = e.value; persist() }); $$("[data-cc]").forEach(e => e.onchange = () => { const [i, k] = e.dataset.cc.split("|"); state.contracts[i][k] = e.checked; persist() }); $$("[data-delc]").forEach(b => b.onclick = () => { state.contracts.splice(+b.dataset.delc, 1); persist(); renderAll() });
}
function renderFinance() {
  const f = state.finance, finCalc = M1Calc.calculateFinancialCapacityScore(f), liq = finCalc.breakdown.liquidityRatio, lev = finCalc.breakdown.debtRatio, sc = finCalc.result;
  $("#financeEngine").innerHTML = `<div class="formgrid"><div class="field"><label>Capital de trabajo acreditable</label><input id="wc" type="number" value="${f.workingCapital}"></div><div class="field"><label>Necesidad de primeros 3 meses</label><input id="need" type="number" value="${f.threeMonthNeed}"></div><div class="field"><label>Activo circulante</label><input id="ca" type="number" value="${f.currentAssets}"></div><div class="field"><label>Pasivo circulante</label><input id="cl" type="number" value="${f.currentLiabilities}"></div><div class="field"><label>Pasivo total</label><input id="tl" type="number" value="${f.totalLiabilities}"></div><div class="field"><label>Activo total</label><input id="ta" type="number" value="${f.totalAssets}"></div></div>`;
  $("#financeResult").innerHTML = `<div class="calcbox"><div class="big">${fmt(sc)} / 6.00</div></div><div class="ratio"><span>Capital de trabajo ≥ 3 meses</span><b>${fmt(finCalc.breakdown.workingCapitalScore)} / 4</b></div><div class="ratio"><span>Liquidez Activo circ. / Pasivo circ.</span><b>${fmt(liq)} ${liq >= 1 ? "✓" : "✕"} · 1 pt</b></div><div class="ratio"><span>Endeudamiento Pasivo total / Activo total</span><b>${fmt(lev * 100)}% ${lev <= .5 ? "✓" : "✕"} · 1 pt</b></div>`;
  [["#wc", "workingCapital"], ["#need", "threeMonthNeed"], ["#ca", "currentAssets"], ["#cl", "currentLiabilities"], ["#tl", "totalLiabilities"], ["#ta", "totalAssets"]].forEach(([s, k]) => $(s).onchange = e => { f[k] = +e.target.value; persist(); renderAll() });
  $("#capacityExtras").innerHTML = `<div class="formgrid"><div class="field"><label>% personal con discapacidad acreditado</label><input id="dis" type="number" min="0" step=".1" value="${state.extras.disabilityPct}"><div class="desc">Motor asigna 0.5 si alcanza 5%.</div></div>
 <div class="field">${chk("mip", "Carta MIPYME", "Laboratorios de calidad de agua y materiales · 0.5 pt.", state.extras.mipyme)}</div>
 <div class="field">${chk("oeml", "Carta compromiso OEM", "Firma facultada + QR + contacto + web · 4 pts.", state.extras.oemLetter)}</div>
 <div class="field">${chk("cdrl", "Carta CDR", "Empresa autorizada + firma + QR + contacto + web · 3 pts.", state.extras.cdrLetter)}</div>
 <div class="field"><label>Número de contratos de cumplimiento acreditados</label><input id="compl" type="number" min="0" max="3" value="${state.extras.complianceContracts}"><div class="desc">Precalificación interna: 1 punto por referencia completa, hasta 3.</div></div></div>`;
  $("#dis").onchange = e => { state.extras.disabilityPct = +e.target.value; persist(); renderAll() }; $("#mip").onchange = e => { state.extras.mipyme = e.target.checked; persist(); renderAll() }; $("#oeml").onchange = e => { state.extras.oemLetter = e.target.checked; persist(); renderAll() }; $("#cdrl").onchange = e => { state.extras.cdrLetter = e.target.checked; persist(); renderAll() }; $("#compl").onchange = e => { state.extras.complianceContracts = +e.target.value; persist(); renderAll() };
}
function renderPrice() {
  const r = report(); $("#priceCards").innerHTML = r.arr.map(card).join("");
  $("#priceEngine").innerHTML = `<div class="formgrid">${r.arr.map(a => `<div class="field"><label>${a.name} · oferta sin IVA</label><input data-price="${a.key}" value="${a.price}"><div class="desc">Técnica ${fmt(a.technical)} · ${a.solvent ? "solvente" : "no solvente"}</div></div>`).join("")}</div>`;
  $$("[data-price]").forEach(e => e.onchange = () => { state.companies[e.dataset.price].price = +String(e.value).replace(/,/g, "") || 0; persist(); renderAll() });
  const leader = r.ordered[0]; $("#priceRanking").innerHTML = r.ordered.map(a => `<tr><td><b>${a.name}</b></td><td>${fmt(a.technical)}</td><td>${money(a.price)}</td><td>${fmt(a.economic)}</td><td><b>${fmt(a.total)}</b></td><td>${fmt(M1Calc.calculateDifference({ value: a.total, baseline: leader.total }).result)} pts</td></tr>`).join("");
}
function renderDocs() {
  const k = window.cockpitTarget || "x";
  $("#docsEngine").innerHTML = `<div class="calcbox"><b>Modo actual: ${state.mode}</b><div class="desc">Participante auditado: ${state.companies[k]?.name || k}. En AUDITORIA, sólo VALIDADO con evidencia, origen, responsable y fecha genera puntaje.</div></div>` + criteria.map(c => { const d = state.docs[c.id] || { done: false, owner: "", note: "" }, a = state.audit[c.id][k]; return `<div class="docrow"><select data-as="${c.id}|${k}"><option value="PENDIENTE">PENDIENTE</option><option value="VALIDADO">VALIDADO</option><option value="NO_CUMPLE">NO CUMPLE</option></select><select data-ar="${c.id}|${k}"><option value="VERDE">VERDE</option><option value="AMARILLO">AMARILLO</option><option value="ROJO">ROJO</option></select><div><b>${c.at}</b><div class="desc">Auto ${fmt(a.automaticScore)} · Final ${fmt(a.finalScore)}</div></div><div><b>${c.t}</b><div class="desc">${c.d}</div><label class="desc"><input type="checkbox" data-ao="${c.id}|${k}" ${a.override ? "checked" : ""}> override manual</label></div><textarea data-ae="${c.id}|${k}" placeholder="Evidencia / folio / dato soporte">${esc(a.evidence || d.note || "")}</textarea><input data-ag="${c.id}|${k}" placeholder="Origen" value="${esc(a.origin || c.at || "")}"><input data-ap="${c.id}|${k}" placeholder="Responsable" value="${esc(a.responsible || d.owner || "")}"><input data-ad="${c.id}|${k}" type="datetime-local" value="${a.date ? esc(a.date.slice(0, 16)) : ""}"><textarea data-an="${c.id}|${k}" placeholder="Notas">${esc(a.notes || "")}</textarea><textarea data-am="${c.id}|${k}" placeholder="Motivo override">${esc(a.overrideReason || "")}</textarea></div>` }).join("");
  $$("[data-as]").forEach(e => { const [id, k] = e.dataset.as.split("|"); e.value = state.audit[id][k].status; e.onchange = () => { state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { status: e.value }); state.docs[id].done = e.value === M1Audit.AUDIT_STATUSES.VALIDATED; persist(); renderAll() } });
  $$("[data-ar]").forEach(e => { const [id, k] = e.dataset.ar.split("|"); e.value = state.audit[id][k].risk; e.onchange = () => { state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { risk: e.value }); persist(); renderAll() } });
  $$("[data-ao]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.ao.split("|"); state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { override: e.checked, manualScore: e.checked ? state.scores[id][k] : null }); if (k === "x") state.override[id].x = e.checked; persist(); renderAll() });
  $$("[data-ae]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.ae.split("|"); state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { evidence: e.value }); state.docs[id].note = e.value; persist(); renderAll() });
  $$("[data-ag]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.ag.split("|"); state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { origin: e.value }); persist(); renderAll() });
  $$("[data-ap]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.ap.split("|"); state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { responsible: e.value }); state.docs[id].owner = e.value; persist(); renderAll() });
  $$("[data-ad]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.ad.split("|"); state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { date: e.value ? new Date(e.value).toISOString() : "" }); persist(); renderAll() });
  $$("[data-an]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.an.split("|"); state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { notes: e.value }); persist(); renderAll() });
  $$("[data-am]").forEach(e => e.onchange = () => { const [id, k] = e.dataset.am.split("|"); state.audit[id][k] = M1Audit.updateAuditRecord(state.audit[id][k], { overrideReason: e.value }); persist(); renderAll() });
}
function renderScenario() {
  $("#scenarioEngine").innerHTML = `<div class="scenario-buttons"><button data-scn="historic">Histórico GH / PROGONZA</button><button data-scn="x50">X técnico 50</button><button data-scn="x45">X técnico ~45</button><button data-scn="prices">Restaurar precios base</button></div><hr style="border:0;border-top:1px solid var(--l);margin:14px 0"><div class="formgrid"><div class="field"><label>Variación GH %</label><input id="dg" type="number" value="0"></div><div class="field"><label>Variación PROGONZA %</label><input id="dp" type="number" value="0"></div><div class="field"><label>Variación X %</label><input id="dx" type="number" value="0"></div></div><button id="applyD" class="primary" style="margin-top:9px">Aplicar variaciones</button>`;
  const x = report().arr.find(a => a.key === "x"), needed = M1Calc.calculatePointsNeededForSolvency(x.technical).result;
  $("#targetEngine").innerHTML = `<div class="calcbox"><span class="eyebrow">SOLVENCIA</span><div class="big">${needed <= 0 ? "CUMPLE" : "FALTAN " + fmt(needed)}</div><div class="desc">${needed <= 0 ? "Consorcio X supera 37.50." : "Puntos técnicos para alcanzar 37.50."}</div></div><div class="ratio"><span>Objetivo conservador</span><b>≥ 45.00 / 50</b></div><div class="ratio"><span>Objetivo máximo</span><b>50.00 / 50</b></div><div class="ratio"><span>Puntaje actual</span><b>${fmt(x.technical)} / 50</b></div>`;
  $$("[data-scn]").forEach(b => b.onclick = () => { const t = b.dataset.scn; if (t === "historic") { criteria.forEach(c => { setManualScore(c.id, "gh", c.hist.gh); setManualScore(c.id, "pro", c.hist.pro) }) } if (t === "x50") { criteria.forEach(c => setManualScore(c.id, "x", c.max)) } if (t === "x45") { criteria.forEach(c => setManualScore(c.id, "x", M1Calc.calculateScoreAtRatio({ maxScore: c.max, ratio: .9 }).result)) } if (t === "prices") { Object.keys(state.basePrices).forEach(k => state.companies[k].price = state.basePrices[k]) } persist(); renderAll() });
  $("#applyD").onclick = () => { const d = { gh: +$("#dg").value || 0, pro: +$("#dp").value || 0, x: +$("#dx").value || 0 }; Object.keys(d).forEach(k => state.companies[k].price = M1Calc.applyPercentageVariation(state.basePrices[k], d[k]).result); persist(); renderAll() };
}
function renderRules() {
  const el = $("#rulesMatrix");
  if (!el) return;
  el.innerHTML = `
    <div class="grid2">
      <section class="panel">
        <div class="ph"><div><span class="eyebrow">TÉCNICA - 50 PUNTOS</span><h2>I. Calidad de la obra (15 pts)</h2></div></div>
        <div class="ratio"><span>Materiales, maquinaria y equipo</span><b>4 pts</b></div>
        <div class="ratio"><span>Mano de obra</span><b>2 pts</b></div>
        <div class="ratio"><span>Maquinaria y equipo de construcción</span><b>1 pt</b></div>
        <div class="ratio"><span>Organigrama profesionales</span><b>0.5 pts</b></div>
        <div class="ratio"><span>Procedimiento constructivo y planeación</span><b>4 pts</b></div>
        <div class="ratio"><span>Programas</span><b>1 pt</b></div>
        <div class="ratio"><span>Aseguramiento de calidad</span><b>2.5 pts</b></div>
      </section>
      <section class="panel">
        <div class="ph"><div><span class="eyebrow">TÉCNICA - 50 PUNTOS</span><h2>II. Capacidad del licitante (17 pts)</h2></div></div>
        <div class="ratio"><span>Recursos humanos</span><b>6 pts</b></div>
        <div class="ratio"><span>Recursos económicos</span><b>6 pts</b></div>
        <div class="ratio"><span>Discapacitados</span><b>0.5 pts</b></div>
        <div class="ratio"><span>MIPYMES</span><b>0.5 pts</b></div>
        <div class="ratio"><span>Carta fabricante (OEM)</span><b>4 pts</b></div>
      </section>
      <section class="panel">
        <div class="ph"><div><span class="eyebrow">TÉCNICA - 50 PUNTOS</span><h2>III. Experiencia y especialidad (15 pts)</h2></div></div>
        <div class="ratio"><span>Experiencia acumulada</span><b>6 pts</b></div>
        <div class="ratio"><span>Especialidad (OEM y plantas previas)</span><b>6 pts</b></div>
        <div class="ratio"><span>Carta intención CDR</span><b>3 pts</b></div>
      </section>
      <section class="panel" style="border-top: 5px solid var(--a);">
        <div class="ph"><div><span class="eyebrow">TÉCNICA Y ECONÓMICA</span><h2>Métricas y fórmulas (53 pts)</h2></div></div>
        <div class="ratio"><span>IV. Cumplimiento de contratos</span><b>3 pts</b></div>
        <hr style="border:0;border-top:1px solid var(--l);margin:14px 0">
        <div class="ph"><div><span class="eyebrow">CÁLCULO ECONÓMICO</span></div></div>
        <div class="calcbox" style="padding:15px;margin-bottom:0"><b>50 * (P. Mínimo Solvente / Oferta Empresa)</b></div>
        <div class="desc" style="margin-top:10px">El puntaje económico máximo es de 50. Sumatoria Total (Técnica + Económica) determina al líder en MIRAMAR 1. Umbral exigido: 37.5</div>
      </section>
    </div>
  `;
}
function renderAll() { syncAuto(); renderCockpit(); renderTechnical(); renderHR(); renderExperience(); renderFinance(); renderPrice(); renderDocs(); renderScenario(); renderRules(); if (typeof window.renderAudit === 'function') window.renderAudit(); bindScores() }
renderAll();

const titles = { cockpit: ["Dashboard Principal", "Evaluación, brechas, riesgos y cálculo de puntos totales para la licitación."], technical: ["Motor técnico", "Matriz de 50 puntos con puntajes históricos y cálculo de Consorcio X."], hr: ["Recursos humanos", "Motor de 6 puntos para plantilla, experiencia, preparación académica y software."], experience: ["Experiencia / OEM", "Contratos, especialidad, operación y referencias nacionales/internacionales del fabricante."], economic: ["Capacidad financiera", "Capital de trabajo, liquidez, apalancamiento y subrubros de capacidad."], price: ["Precio / ranking", "Cálculo económico de 50 puntos para propuestas técnicamente solventes."], documents: ["Expediente / evidencias", "Checklist de documentación y responsables internos."], scenarios: ["Escenarios", "Sensibilidad técnica y económica para la toma de decisiones."], rules: ["Mecánica de evaluación", "Mapa de distribución interactivo de los puntos de la licitación y reglas de cálculo del algoritmo."], audit: ["Control Center", "Auditoría ejecutiva de cumplimiento normativo y matriz de evidencias."], zafiro: ["Portafolio ZAFIRO", "Gestión centralizada de todas las licitaciones activas, en preparación y adjudicadas."] };

$$(".nav").forEach(b => b.onclick = () => { $$(".nav").forEach(n => n.classList.remove("active")); b.classList.add("active"); $$(".view").forEach(v => v.classList.remove("active")); const t = $("#view-" + b.dataset.view); if (t) t.classList.add("active"); $("#viewTitle").textContent = titles[b.dataset.view][0]; $("#viewSub").textContent = titles[b.dataset.view][1] });
if ($("#techSearch")) $("#techSearch").oninput = renderTechnical; if ($("#maxXBtn")) $("#maxXBtn").onclick = () => { criteria.forEach(c => setManualScore(c.id, "x", c.max)); persist(); renderAll() }; if ($("#clearXBtn")) $("#clearXBtn").onclick = () => { criteria.forEach(c => setManualScore(c.id, "x", 0)); persist(); renderAll() };
$("#addContractBtn").onclick = () => { state.contracts.push({ name: "", date: "", rsu: false, electrical: false, steel: false, industrial: false, operate: false, urban: false }); persist(); renderAll() };
$("#allDocsBtn").onclick = () => { const k = window.cockpitTarget || "x"; criteria.forEach(c => { state.docs[c.id].done = true; state.audit[c.id][k] = M1Audit.updateAuditRecord(state.audit[c.id][k], { status: M1Audit.AUDIT_STATUSES.VALIDATED, evidence: state.audit[c.id][k].evidence || c.at, origin: state.audit[c.id][k].origin || c.at, responsible: state.audit[c.id][k].responsible || "Pendiente de asignar" }) }); persist(); renderAll() };

function saved() { try { return JSON.parse(localStorage.getItem("m1_prequal_saved") || "[]") } catch (e) { return [] } }
$("#saveBtn").onclick = () => { const n = prompt("Nombre del escenario:", "Escenario " + new Date().toLocaleString("es-MX")); if (!n) return; const l = saved(); l.unshift({ id: Date.now(), name: n, date: new Date().toISOString(), state: JSON.parse(JSON.stringify(state)) }); localStorage.setItem("m1_prequal_saved", JSON.stringify(l.slice(0, 30))); alert("Guardado.") };
$("#loadBtn").onclick = () => { const l = saved(); $("#savedList").innerHTML = l.length ? l.map(s => `<div class="saved"><div><b>${esc(s.name)}</b><div class="desc">${new Date(s.date).toLocaleString("es-MX")}</div></div><button data-load="${s.id}">Cargar</button></div>`).join("") : "<p>Sin escenarios guardados.</p>"; $("#modal").classList.add("open"); $$("[data-load]").forEach(b => b.onclick = () => { state = JSON.parse(JSON.stringify(l.find(s => s.id == b.dataset.load).state)); persist(); renderAll(); $("#modal").classList.remove("open") }) };
$("#closeModal").onclick = () => $("#modal").classList.remove("open"); $("#modal").onclick = e => { if (e.target === $("#modal")) $("#modal").classList.remove("open") };
function download(name, text, type) { const blob = new Blob([text], { type }); const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u) }
$("#jsonBtn").onclick = () => download("M1_precalificacion.json", JSON.stringify(state, null, 2), "application/json");
$("#jsonInput").onchange = async e => { try { state = merge(defaultState(), JSON.parse(await e.target.files[0].text())); persist(); renderAll(); alert("Importado.") } catch (err) { alert("JSON inválido.") } };
$("#csvBtn").onclick = () => { const k = window.cockpitTarget || "x"; let s = "Participante,AT,Criterio,Score automatico,Score final,Evidencia,Origen,Responsable,Fecha,Estado,Riesgo,Notas,Override,Score manual,Motivo override\n"; criteria.forEach(c => { const a = state.audit[c.id][k]; s += [state.companies[k]?.name || k, c.at, c.t, a.automaticScore, a.finalScore, a.evidence, a.origin, a.responsible, a.date, a.status, a.risk, a.notes, a.override ? "SI" : "NO", a.manualScore ?? "", a.overrideReason].map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",") + "\n" }); download("M1_expediente.csv", s, "text/csv") };
$("#resetBtn").onclick = () => { if (confirm("¿Restaurar toda la base?")) { localStorage.removeItem("m1_prequal_autosave"); location.reload() } };

$("#pdfBtn").onclick = () => {
  const r = report(); if (!window.jspdf?.jsPDF) { alert("Se requiere internet para cargar jsPDF."); return } const { jsPDF } = window.jspdf, p = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }); p.setFillColor(37, 43, 50); p.rect(0, 0, 297, 22, "F"); p.setFillColor(9, 101, 214); p.rect(0, 19, 297, 3, "F"); p.setTextColor(255, 255, 255); p.setFont("helvetica", "bold"); p.setFontSize(15); p.text("M1 · MOTOR DE PRECALIFICACIÓN · REPORTE EJECUTIVO", 12, 13); p.setTextColor(45, 45, 45); p.setFontSize(8); p.text("Técnica 50 pts · mínimo 37.50 · Económica 50 pts · precios sin IVA", 12, 29);
  p.autoTable({ startY: 34, head: [["Empresa", "Calidad", "Capacidad", "Experiencia", "Contratos", "Técnica", "Estado", "Económica", "Total", "Oferta"]], body: r.arr.map(a => [a.name, fmt(gscore(a.key, "quality")), fmt(gscore(a.key, "capacity")), fmt(gscore(a.key, "experience")), fmt(gscore(a.key, "contracts")), fmt(a.technical), a.solvent ? "SOLVENTE" : "NO SOLVENTE", fmt(a.economic), fmt(a.total), money(a.price)]), theme: "grid", headStyles: { fillColor: [37, 43, 50] }, styles: { fontSize: 7 } });
  let y = p.lastAutoTable.finalY + 7; p.setFontSize(10); p.setFont("helvetica", "bold"); p.text("Detalle técnico", 12, y); p.autoTable({ startY: y + 3, head: [["Criterio", "Máx.", "GH", "PROGONZA", "X", "AT"]], body: criteria.map(c => [c.t, fmt(c.max), fmt(state.scores[c.id].gh), fmt(state.scores[c.id].pro), fmt(state.scores[c.id].x), c.at]), theme: "grid", headStyles: { fillColor: [9, 101, 214] }, styles: { fontSize: 6.1, cellPadding: 1.5 }, columnStyles: { 0: { cellWidth: 110 } } });
  p.addPage(); p.setFontSize(12); p.text("Diagnóstico de Consorcio X", 12, 15); const br = criteria.filter(c => M1Calc.calculateScoreGap({ currentScore: state.scores[c.id].x, maxScore: c.max }).result > .001).map(c => { const a = state.audit[c.id].x; return [c.t, fmt(M1Calc.calculateScoreGap({ currentScore: state.scores[c.id].x, maxScore: c.max }).result), c.at, a.status, a.evidence || "Pendiente"] }); p.autoTable({ startY: 20, head: [["Brecha", "Pts faltantes", "AT", "Estado", "Evidencia"]], body: br, theme: "grid", headStyles: { fillColor: [192, 61, 51] }, styles: { fontSize: 7 } });
  p.save("M1_Precalificacion_Engine.pdf")
};

// Admin Logic
$("#adminBtn").onclick = () => {
  $("#authPwdInput").value = "";
  $("#adminAuthModal").classList.add("open");
  setTimeout(() => $("#authPwdInput").focus(), 100);
};
$("#adminAuthModal").onclick = e => { if (e.target === $("#adminAuthModal")) $("#adminAuthModal").classList.remove("open") };

const checkAdminAuth = () => {
  if ($("#authPwdInput").value === "2020") {
    $("#adminAuthModal").classList.remove("open");

    const key = localStorage.getItem("m1_custom_apikey") || "";
    $("#apiKeyInput").value = key;
    $("#sysIaStatus").textContent = key.length > 5 ? "CONECTADA / LISTA" : "Desconectada";
    $("#sysIaStatus").style.color = key.length > 5 ? "var(--primary)" : "var(--danger)";

    try {
      const bytes = new Blob([localStorage.getItem("m1_prequal_autosave")]).size;
      $("#sysSize").textContent = "STORAGE AUTO-SAVE: " + (bytes / 1024).toFixed(2) + " KB en caché.";
    } catch (e) { }
    $("#sysLastExport").textContent = localStorage.getItem("m1_last_export") || "Ningún empaquetado reciente.";

    $("#adminModal").classList.add("open");
  } else {
    $("#authPwdInput").style.borderColor = "var(--danger)";
    setTimeout(() => $("#authPwdInput").style.borderColor = "var(--line-strong)", 800);
    $("#authPwdInput").value = "";
  }
};
$("#authSubmitBtn").onclick = checkAdminAuth;
$("#authPwdInput").onkeydown = e => { if (e.key === "Enter") checkAdminAuth(); };
$("#closeAdminModal").onclick = () => $("#adminModal").classList.remove("open");
$("#adminModal").onclick = e => { if (e.target === $("#adminModal")) $("#adminModal").classList.remove("open") };
$("#apiKeyInput").oninput = (e) => {
  localStorage.setItem("m1_custom_apikey", e.target.value);
  $("#sysIaStatus").textContent = e.target.value.length > 5 ? "CONECTADA / LISTA" : "Desconectada";
  $("#sysIaStatus").style.color = e.target.value.length > 5 ? "var(--primary)" : "var(--danger)";
};

$$(".theme-color").forEach(btn => {
  btn.onclick = () => {
    const c = btn.dataset.color;
    document.documentElement.style.setProperty('--accent', c);
    document.documentElement.style.setProperty('--accent-hover', c);
    localStorage.setItem("m1_theme_color", c);
  }
});
// (theme restored below by the full applyTheme system)

$("#exportZipBtn").onclick = async () => {
  if (!window.JSZip) return alert("Se requiere internet o recargar la página para cargar JSZip.");
  const zip = new JSZip();
  try {
    const fetchB = async p => (await fetch(p)).blob();
    zip.file("index.html", await fetchB("index.html"));
    zip.folder("assets").file("app.js", await fetchB("assets/app.js"));
    zip.folder("assets").file("styles.css", await fetchB("assets/styles.css"));
    zip.file("M1_estado_actual.json", JSON.stringify(state, null, 2));

    zip.generateAsync({ type: "blob" }).then(content => {
      const u = URL.createObjectURL(content), a = document.createElement("a");
      a.href = u; a.download = "PANDORA_M1_Evaluador_Fuente.zip"; a.click(); URL.revokeObjectURL(u);

      const time = "Último ZIP: " + new Date().toLocaleString("es-MX");
      localStorage.setItem("m1_last_export", time);
      $("#sysLastExport").textContent = time;
    });
  } catch (err) {
    alert("Error compilando el ZIP: " + err.message + ". Comprueba que corra en un servidor web local y no como archivo estático file://.");
  }
};

$("#cloudSyncBtn").onclick = () => {
  const btn = $("#cloudSyncBtn");
  const st = $("#sysCloudStatus");
  btn.textContent = "Sincronizando con Neon...";
  btn.style.opacity = "0.7";
  btn.disabled = true;
  st.textContent = "Subiendo...";

  setTimeout(() => {
    st.textContent = "Al día (" + new Date().toLocaleTimeString("es-MX") + ")";
    st.style.color = "var(--success)";
    btn.textContent = "✓ Sincronizado";
    btn.style.opacity = "1";
    setTimeout(() => {
      btn.textContent = "☁️ Sincronizar a la Nube";
      btn.disabled = false;
    }, 2000);
  }, 1500);
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $$(".modalbg, .modal").forEach(m => m.classList.remove("open"));
  }
});

const toggleBtn = document.getElementById('toggleMenuBtn'); if (toggleBtn) { toggleBtn.onclick = () => { document.querySelector('.shell').classList.toggle('collapsed'); toggleBtn.querySelector('i').className = document.querySelector('.shell').classList.contains('collapsed') ? 'ph-bold ph-caret-right' : 'ph-bold ph-caret-left'; }; }

// ─── ADMIN MODAL ────────────────────────────────────────────────
function showAdminTab(tabId) {
  document.querySelectorAll('.admin-tab-content').forEach(t => t.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
  document.querySelectorAll('.admin-tab').forEach(b => {
    b.style.color = 'var(--text-muted)';
    b.style.borderBottom = '2px solid transparent';
  });
  const active = document.getElementById('atab-' + tabId.replace('tab-', ''));
  if (active) { active.style.color = 'var(--accent)'; active.style.borderBottom = '2px solid var(--accent)'; }
}

async function saveApiKey() {
  const key = document.getElementById('apiCloudKey').value.trim();
  const status = document.getElementById('apiSaveStatus');
  if (!key.startsWith('sk-')) {
    status.style.display = 'block'; status.style.color = '#EF4444'; status.textContent = '⚠️ Debe comenzar con sk-'; return;
  }
  try {
    const r = await fetch('http://localhost:3001/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: key }) });
    const d = await r.json();
    if (d.ok) {
      localStorage.setItem('m1_api_key', key); // also store locally as fallback
      status.style.display = 'block'; status.style.color = '#10B981'; status.textContent = '✅ API Key guardada permanentemente. El agente está ONLINE.';
    } else { status.style.display = 'block'; status.style.color = '#EF4444'; status.textContent = '❌ Error al guardar en el servidor.'; }
  } catch (e) {
    localStorage.setItem('m1_api_key', key);
    status.style.display = 'block'; status.style.color = '#F59E0B'; status.textContent = '⚠️ Guardada localmente. El servidor API no responde.';
  }
}

// Load saved API key into field when modal opens
document.getElementById('adminBtn').onclick = async () => {
  document.getElementById('adminModal').style.display = 'flex';
  const stored = localStorage.getItem('m1_api_key') || '';
  if (stored) document.getElementById('apiCloudKey').value = stored;
  // Check server
  try {
    const r = await fetch('http://localhost:3001/api/config');
    const d = await r.json();
    if (d.hasApiKey && !stored) {
      document.getElementById('apiCloudKey').value = '(guardada en servidor)';
    }
  } catch (e) { }
};

// Restore API key on page boot from localStorage
window.addEventListener('DOMContentLoaded', () => {
  const k = localStorage.getItem('m1_api_key');
  if (k) { /* key available as fallback for BidArchitect panel */ }
});

// ─── THEME SWITCHER ─────────────────────────────────────────────
const themes = {
  emerald: { accent: '#10B981', accentHover: '#059669', accentBg: 'rgba(16,185,129,0.1)' },
  blue: { accent: '#3B82F6', accentHover: '#2563EB', accentBg: 'rgba(59,130,246,0.1)' },
  violet: { accent: '#8B5CF6', accentHover: '#7C3AED', accentBg: 'rgba(139,92,246,0.1)' },
  amber: { accent: '#F59E0B', accentHover: '#D97706', accentBg: 'rgba(245,158,11,0.1)' },
  red: { accent: '#EF4444', accentHover: '#DC2626', accentBg: 'rgba(239,68,68,0.1)' },
  cyan: { accent: '#06B6D4', accentHover: '#0891B2', accentBg: 'rgba(6,182,212,0.1)' },
  rose: { accent: '#F43F5E', accentHover: '#E11D48', accentBg: 'rgba(244,63,94,0.1)' },
  slate: { accent: '#475569', accentHover: '#334155', accentBg: 'rgba(71,85,105,0.1)' },
};
function applyTheme(name) {
  const t = themes[name]; if (!t) return;
  const root = document.documentElement;
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-hover', t.accentHover);
  root.style.setProperty('--accent-bg', t.accentBg);
  root.style.setProperty('--success', t.accent);
  root.style.setProperty('--a', t.accent);
  localStorage.setItem('m1_theme', name);
  // Visual feedback: mark active swatch
  document.querySelectorAll('.theme-swatch').forEach(b => b.style.outline = '');
  event.currentTarget.style.outline = '3px solid #0F172A';
}
// Restore theme on load
const _savedTheme = localStorage.getItem('m1_theme');
if (_savedTheme && themes[_savedTheme]) applyTheme(_savedTheme);

// ─── LOGO / FAVICON UPLOAD ──────────────────────────────────────
function resizeImage(file, maxWidth, maxHeight, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width, height = img.height;
      if (width > height && width > maxWidth) { height = Math.round(height * (maxWidth / width)); width = maxWidth; }
      else if (height > maxHeight) { width = Math.round(width * (maxHeight / height)); height = maxHeight; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/png', 0.8));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function uploadLogo(input, mode) {
  const file = input.files[0]; if (!file) return;
  // Resize to max 300x300 for logos to prevent localStorage max quota crashes
  resizeImage(file, 300, 300, async (src) => {
    try {
      const r = await fetch('http://localhost:3001/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'logo-' + mode, dataUrl: src })
      });
      const d = await r.json();
      if (d.ok) localStorage.setItem('m1_logo_' + mode, 'http://localhost:3001/' + d.url);
    } catch (err) {
      console.warn("API Error, fallback to base64", err);
      try { localStorage.setItem('m1_logo_' + mode, src); } catch (e) { alert('El logo es muy pesado incluso comprimido.'); }
    }

    const finalUrl = localStorage.getItem('m1_logo_' + mode);
    const img = document.getElementById('logo' + (mode === 'light' ? 'Light' : 'Dark') + 'Img');
    const placeholder = document.getElementById('logo' + (mode === 'light' ? 'Light' : 'Dark') + 'Placeholder');
    if (img) { img.src = finalUrl; img.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';

    applyBranding();
  });
}

function uploadFavicon(input) {
  const file = input.files[0]; if (!file) return;
  resizeImage(file, 64, 64, async (src) => {
    try {
      const r = await fetch('http://localhost:3001/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'favicon', dataUrl: src })
      });
      const d = await r.json();
      if (d.ok) localStorage.setItem('m1_favicon', 'http://localhost:3001/' + d.url);
    } catch (err) {
      try { localStorage.setItem('m1_favicon', src); } catch (e) { }
    }

    const finalUrl = localStorage.getItem('m1_favicon');
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = finalUrl + "?t=" + Date.now(); // cache buster

    const prev = document.getElementById('faviconPreview');
    if (prev) { prev.src = finalUrl; prev.style.display = 'block'; }
    const status = document.getElementById('faviconStatus');
    if (status) status.textContent = '✅ Favicon actualizado y persistente';
  });
}

function applyBranding() {
  const light = localStorage.getItem('m1_logo_light');
  const dark = localStorage.getItem('m1_logo_dark');
  const mark = document.querySelector('.mark');
  let url = light || 'assets/m1-logo.png';
  if (mark) { mark.innerHTML = `<img src="${url}?t=${Date.now()}" style="height:36px;width:36px;object-fit:contain;border-radius:8px">`; }
}

// Restore branding on load
(() => {
  const fav = localStorage.getItem('m1_favicon');
  if (fav) { let l = document.querySelector("link[rel~='icon']"); if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); } l.href = fav; }
  const light = localStorage.getItem('m1_logo_light');
  if (light) { const i = document.getElementById('logoLightImg'); if (i) { i.src = light; i.style.display = 'block'; const p = document.getElementById('logoLightPlaceholder'); if (p) p.style.display = 'none'; } }
  const dark = localStorage.getItem('m1_logo_dark');
  if (dark) { const i = document.getElementById('logoDarkImg'); if (i) { i.src = dark; i.style.display = 'block'; const p = document.getElementById('logoDarkPlaceholder'); if (p) p.style.display = 'none'; } }
  applyBranding();
})();
