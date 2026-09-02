"use strict";

(function initAuditControlCenter(root) {

    const STATUS_COLORS = {
        "VALIDADO": "#10B981",    // Verde (Tailwind Emerald)
        "PENDIENTE": "#F59E0B",   // Ambar
        "NO_CUMPLE": "#EF4444",   // Rojo
        "ROJO": "#EF4444",
        "AMARILLO": "#F59E0B",
        "VERDE": "#10B981",
        "OVERRIDE": "#6366f1"     // Indigo/Violeta
    };

    const getBadgeHtml = (text, type, override) => {
        let color = STATUS_COLORS[type] || "#9CA3AF";
        if (override) color = STATUS_COLORS["OVERRIDE"];
        const bg = `color-mix(in srgb, ${color} 15%, transparent)`;

        // Add icon logic
        let icon = "•";
        if (type === "VALIDADO") icon = "✓";
        if (type === "NO_CUMPLE") icon = "✕";
        if (type === "PENDIENTE") icon = "⏱";
        if (override) icon = "✍";

        return `<span style="display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:800; border:1px solid ${color}; color:${color}; background:${bg}"><span>${icon}</span> ${text}</span>`;
    };

    let currentFilter = "TODOS";
    let searchQuery = "";

    function renderAudit() {
        const container = document.getElementById("auditContainer");
        if (!container) return;

        if (!window.AuditViewAdapter || !window.state || !window.criteria || !window.groups) {
            container.innerHTML = `<div style="padding:24px; color:#fff">Cargando dependencias de auditoría...</div>`;
            return;
        }

        const participantKey = window.cockpitTarget || "x";
        const data = AuditViewAdapter.getSummary(window.state, window.criteria, participantKey, window.groups);

        if (!data) {
            container.innerHTML = `<div style="padding:24px; color:#fff">No hay datos de auditoría generados.</div>`;
            return;
        }

        const formatNum = n => Number(n).toFixed(2);

        // Apply Filters & Search locally (does not modify state)
        let filteredItems = data.items;

        if (currentFilter === "CON BRECHA") filteredItems = filteredItems.filter(x => x.gap > 0);
        else if (currentFilter === "SIN EVIDENCIA") filteredItems = filteredItems.filter(x => !x.evidence || x.evidence.toLowerCase().includes("sin doc"));
        else if (currentFilter === "PENDIENTES") filteredItems = filteredItems.filter(x => x.status === "PENDIENTE");
        else if (currentFilter === "NO CUMPLE") filteredItems = filteredItems.filter(x => x.status === "NO_CUMPLE");
        else if (currentFilter === "OVERRIDES") filteredItems = filteredItems.filter(x => x.override);
        else if (currentFilter === "RIESGO") filteredItems = filteredItems.filter(x => x.risk === "ROJO" || x.risk === "AMARILLO");

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filteredItems = filteredItems.filter(x =>
                x.criterio.toLowerCase().includes(q) ||
                x.rubro.toLowerCase().includes(q) ||
                x.origin.toLowerCase().includes(q) ||
                x.evidence.toLowerCase().includes(q) ||
                x.notes.toLowerCase().includes(q)
            );
        }

        // 1. HEADER & KPIs
        const headerHtml = `
      <style>
         #audit-dark-theme {
            background-color: #0B1120;
            color: #F8FAFC;
            font-family: 'Inter', sans-serif;
            padding: 24px;
            min-height: 100vh;
         }
         #audit-dark-theme * {
            box-sizing: border-box;
         }
         .audit-card {
            background:#1E293B; border:1px solid #334155; padding:20px; border-radius:12px;
         }
         .audit-btn {
            background: #0F172A; color: #94A3B8; border: 1px solid #334155; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size:11px; font-weight:700;
         }
         .audit-btn.active {
            background: #3B82F6; color: #FFF; border-color: #2563EB;
         }
         .audit-btn:hover:not(.active) {
            background: #1E293B; border-color: #475569; color: #E2E8F0;
         }
         .audit-table {
             width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;
         }
         .audit-table th {
             padding: 12px 16px; border-bottom: 2px solid #334155; color: #94A3B8; font-size: 11px; font-weight: 800; text-transform: uppercase;
         }
         .audit-table td {
             padding: 16px; border-bottom: 1px dashed #334155; color: #E2E8F0;
         }
         #audit-dark-theme input {
             background: #0F172A; border: 1px solid #334155; color: #F8FAFC; padding: 10px 14px; border-radius: 8px; width: 100%; outline:none;
         }
         #audit-dark-theme input:focus {
             border-color: #3B82F6;
         }
      </style>
      <div id="audit-dark-theme">
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
              <div>
                  <div style="font-size:12px; color:#94A3B8; font-weight:800; letter-spacing:1px; margin-bottom:4px">PARTICIPANTE ACTIVO: ${data.participant.toUpperCase()}</div>
                  <h1 style="margin:0; font-size:28px; font-weight:900; color:#F8FAFC">Audit Control Center</h1>
              </div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:24px;">
            <div class="audit-card">
               <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">TECH SCORE</div>
               <div style="font-size:28px; font-weight:900; font-family:monospace; color:#3B82F6;">${formatNum(data.techScore)}<span style="font-size:12px; color:#64748B"> / 50</span></div>
            </div>
            <div class="audit-card">
               <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">ESTADO / SOLVENCIA</div>
               <div style="font-size:20px; font-weight:900; color:${data.solvency.isSolvent ? '#10B981' : '#EF4444'}; margin-top:6px">${data.solvency.isSolvent ? "SOLVENTE" : "NO SOLVENTE"}</div>
            </div>
            <div class="audit-card">
               <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">TRAZABILIDAD (VALIDADO)</div>
               <div style="font-size:24px; font-weight:900; font-family:monospace; color:#10B981">${formatNum(data.traceability.validated)}<span style="font-size:12px; color:#64748B"> pts</span></div>
            </div>
            <div class="audit-card">
               <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">EVIDENCIAS CONFIRMADAS</div>
               <div style="font-size:24px; font-weight:900; font-family:monospace">${data.auditSummary.validated}<span style="font-size:12px; color:#64748B"> / ${data.items.length}</span></div>
            </div>
            <div class="audit-card">
               <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">OVERRIDES MANUALES</div>
               <div style="font-size:24px; font-weight:900; font-family:monospace; color:#6366f1">${data.overridesCount}</div>
            </div>
            <div class="audit-card">
               <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">RIESGOS ACTIVOS</div>
               <div style="font-size:24px; font-weight:900; font-family:monospace; color:${data.riskCount > 0 ? '#EF4444' : '#10B981'}">${data.riskCount}</div>
            </div>
          </div>

          <!-- INDICADOR DE SOLVENCIA VISUAL -->
          <div class="audit-card" style="margin-bottom:24px;">
              <div style="font-size:12px; font-weight:800; color:#94A3B8; margin-bottom:12px">TERMÓMETRO DE SOLVENCIA (MIN: ${formatNum(data.solvency.min)})</div>
              
              <div style="position:relative; width:100%; height:8px; background:#0F172A; border-radius:4px; margin-bottom:16px;">
                  <div style="position:absolute; top:-4px; bottom:-4px; left:${(data.solvency.min / 50) * 100}%; width:2px; background:#475569; z-index:2" title="Umbral 37.5"></div>
                  <div style="position:absolute; top:0; bottom:0; left:0; width:${(data.techScore / 50) * 100}%; background: ${data.solvency.isSolvent ? '#3B82F6' : '#EF4444'}; border-radius:4px; z-index:1 transition:width 0.3s"></div>
                  <div style="position:absolute; top:-25px; left:0; font-size:10px; color:#64748B; font-weight:bold;">0</div>
                  <div style="position:absolute; top:-25px; left:${(data.solvency.min / 50) * 100}%; font-size:10px; color:#94A3B8; font-weight:bold; transform:translateX(-50%)">${formatNum(data.solvency.min)}</div>
                  <div style="position:absolute; top:-25px; right:0; font-size:10px; color:#64748B; font-weight:bold;">50</div>
                  <div style="position:absolute; top:12px; left:${(data.techScore / 50) * 100}%; font-size:12px; font-weight:900; color:${data.solvency.isSolvent ? '#3B82F6' : '#EF4444'}; transform:translateX(-50%)">▼ ${formatNum(data.techScore)}</div>
              </div>
              <div style="margin-top:20px; font-size:12px; font-weight:700">
                  ${data.solvency.isSolvent ?
                `<span style="color:#10B981">MARGEN SOBRE SOLVENCIA: +${formatNum(data.solvency.margin)} pts</span>` :
                `<span style="color:#EF4444">FALTANTE PARA SOLVENCIA: -${formatNum(data.solvency.missing)} pts</span>`}
              </div>
          </div>
          
          <!-- BRECHAS PARA 50 PUNTOS -->
          ${data.gaps && data.gaps.length > 0 ? `
          <div class="audit-card" style="margin-bottom:24px; padding:0; overflow-x:auto;">
              <div style="padding:16px 20px; border-bottom:1px solid #334155;">
                  <h3 style="margin:0; font-size:14px; font-weight:900; color:#F8FAFC">BRECHAS PARA 50 PUNTOS <span style="color:#94A3B8; font-weight:normal">(${data.gaps.length} oportunidades)</span></h3>
              </div>
              <table class="audit-table">
                  <thead>
                      <tr>
                          <th style="padding-left:20px;">CRITERIO</th>
                          <th style="text-align:center">ACTUAL</th>
                          <th style="text-align:center">MÁXIMO</th>
                          <th style="text-align:center; color:#EF4444">BRECHA</th>
                          <th style="padding-right:20px;">ESTADO</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${data.gaps.map(g => `
                          <tr>
                              <td style="padding-left:20px; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${g.criterio}">${g.criterio}</td>
                              <td style="text-align:center; font-weight:700">${formatNum(g.finalScore)}</td>
                              <td style="text-align:center; color:#94A3B8">${formatNum(g.maxScore)}</td>
                              <td style="text-align:center; color:#EF4444; font-weight:900">+${formatNum(g.gap)}</td>
                              <td style="padding-right:20px;">${getBadgeHtml(g.override ? "OVERRIDE" : g.status, g.status, g.override)}</td>
                          </tr>
                      `).join("")}
                  </tbody>
              </table>
          </div>
          ` : ''}

          <!-- FILTROS Y BÚSQUEDA -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:16px;">
             <div style="display:flex; gap:8px; flex-wrap:wrap;">
                 ${["TODOS", "CON BRECHA", "SIN EVIDENCIA", "PENDIENTES", "NO CUMPLE", "OVERRIDES", "RIESGO"].map(f =>
                    `<button class="audit-btn ${currentFilter === f ? 'active' : ''}" onclick="window.setAuditFilter('${f}')">${f}</button>`
                ).join("")}
             </div>
             <div style="flex:1; max-width:300px;">
                 <input type="text" id="auditSearchInput" placeholder="🔎 Buscar criterio, evidencia, o rubro..." value="${searchQuery}">
             </div>
          </div>

          <!-- MATRIZ PRINCIPAL -->
          <div class="audit-card" style="padding:0; overflow-x:auto;">
            <table class="audit-table">
                <thead>
                    <tr>
                        <th style="padding-left:24px;">CRITERIO / RUBRO</th>
                        <th style="text-align:center">MAX</th>
                        <th style="text-align:center">AUTO</th>
                        <th style="text-align:center; color:#818CF8">MANUAL</th>
                        <th style="text-align:center; color:#F8FAFC">FINAL</th>
                        <th>ESTADO / EVIDENCIA</th>
                        <th>RIESGO</th>
                        <th style="text-align:center">DETALLE</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredItems.length === 0 ? `<tr><td colspan="8" style="text-align:center; padding:32px; color:#64748B">No hay resultados para el filtro actual.</td></tr>` : ''}
                    ${filteredItems.map(item => `
                        <tr>
                            <td style="padding-left:24px;">
                                 <div style="font-weight:700; color:#F8FAFC; margin-bottom:4px; max-width:300px;">${item.criterio}</div>
                                 <div style="font-size:10px; color:#64748B; text-transform:uppercase">${item.rubro} · REF: ${item.origin}</div>
                            </td>
                            <td style="text-align:center; font-weight:800; color:#64748B">${formatNum(item.maxScore)}</td>
                            <td style="text-align:center; font-family:monospace; color:#94A3B8">${formatNum(item.autoScore)}</td>
                            <td style="text-align:center; font-family:monospace; color:#818CF8">${item.override ? formatNum(item.manualScore) : "—"}</td>
                            <td style="text-align:center; font-weight:900; font-size:14px; color:#3B82F6">${formatNum(item.finalScore)}</td>
                            <td>
                                 <div style="margin-bottom:6px">${getBadgeHtml(item.override ? "OVERRIDE" : item.status, item.status, item.override)}</div>
                                 <div style="font-size:10px; color:#94A3B8; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" title="${item.evidence}">📄 ${item.evidence}</div>
                            </td>
                            <td>
                                 ${getBadgeHtml(item.risk, item.risk)}
                            </td>
                            <td style="text-align:center;">
                                 <button class="audit-btn open-drawer-btn" data-id="${item.id}" style="padding:6px 12px; border-radius:20px; font-weight:900">&rarr;</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
          </div>
          <p style="font-size:11px; color:#475569; text-align:center; margin-top:24px; font-weight:600">AUDIT CONTROL CENTER · M1 ENGINE</p>

          <!-- DRAWER -->
          <div id="auditDrawerOverlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:9998; opacity:0; pointer-events:none; transition:opacity 0.2s"></div>
          <div id="auditDrawer" style="position:fixed; top:0; right:-550px; width:500px; max-width:100vw; height:100vh; background:#0F172A; border-left:1px solid #1E293B; z-index:9999; transition:right 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow:-10px 0 30px rgba(0,0,0,0.5); display:flex; flex-direction:column;">
              <div style="padding:24px; border-bottom:1px solid #1E293B; display:flex; justify-content:space-between; align-items:flex-start">
                 <div style="flex:1; padding-right:16px">
                     <div style="font-size:11px; font-weight:800; color:#3B82F6; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px">EXAMINADOR DE DETALLE</div>
                     <h2 id="drwTitle" style="margin:0; font-size:18px; font-weight:900; color:#F8FAFC; line-height:1.3">Criterio</h2>
                 </div>
                 <button class="audit-btn" id="closeDrawerBtn" style="border-radius:100px; width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center; color:#fff">✕</button>
              </div>
              <div id="drwContent" style="padding:24px; flex:1; overflow-y:auto; font-size:13px; color:#CBD5E1; display:flex; flex-direction:column; gap:24px;"></div>
          </div>
      </div>
    `;

        container.innerHTML = headerHtml;

        // EVENT LISTENERS
        const searchInput = document.getElementById("auditSearchInput");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                searchQuery = e.target.value;
                // re-render debounce
                if (window.auditSearchTimeout) clearTimeout(window.auditSearchTimeout);
                window.auditSearchTimeout = setTimeout(() => { renderAudit(); }, 200);
            });
        }

        const drawerOverlay = document.getElementById("auditDrawerOverlay");
        const drawer = document.getElementById("auditDrawer");
        const closeDrawer = () => {
            drawer.style.right = "-550px";
            drawerOverlay.style.opacity = "0";
            setTimeout(() => drawerOverlay.style.pointerEvents = "none", 200);
        };

        document.getElementById("closeDrawerBtn").onclick = closeDrawer;
        drawerOverlay.onclick = closeDrawer;
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

        document.querySelectorAll(".open-drawer-btn").forEach(btn => {
            btn.onclick = () => {
                const itemId = btn.getAttribute("data-id");
                const item = data.items.find(x => x.id === itemId);
                if (!item) return;

                document.getElementById("drwTitle").textContent = item.criterio;

                document.getElementById("drwContent").innerHTML = `
                 <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; background:#1E293B; border:1px solid #334155; padding:16px; border-radius:12px; text-align:center">
                     <div>
                         <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:4px">AUTO SCORE</div>
                         <div style="font-family:monospace; font-size:18px; color:#F8FAFC">${formatNum(item.autoScore)}</div>
                     </div>
                     <div>
                         <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:4px">${item.override ? '<span style="color:#818CF8">MANUAL SCORE</span>' : 'MANUAL SCORE'}</div>
                         <div style="font-family:monospace; font-size:18px; color:${item.override ? '#818CF8' : '#64748B'}">${item.override ? formatNum(item.manualScore) : "—"}</div>
                     </div>
                     <div>
                         <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:4px">SCORE FINAL</div>
                         <div style="font-size:22px; font-weight:900; color:#3B82F6">${formatNum(item.finalScore)}<span style="font-size:11px;font-weight:600;color:#64748B"> / ${formatNum(item.maxScore)}</span></div>
                     </div>
                 </div>

                 <div style="display:flex; flex-direction:column; gap:20px;">
                     <div>
                         <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">ESTADO Y RIESGO</div>
                         <div style="display:flex; gap:8px;">
                            ${getBadgeHtml(item.override ? "OVERRIDE" : item.status, item.status, item.override)}
                            ${getBadgeHtml(item.risk, item.risk)}
                         </div>
                     </div>
                     <div>
                         <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">FUENTE / REGLA (ANEXO)</div>
                         <div style="background:#1E293B; padding:14px; border-radius:8px; border:1px solid #334155; font-family:monospace; color:#E2E8F0">${item.origin}</div>
                     </div>
                     <div>
                         <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">EVIDENCIAS ASOCIADAS</div>
                         <div style="background:#1E293B; padding:14px; border-radius:8px; border:1px solid #334155; color:#E2E8F0">${item.evidence}</div>
                     </div>
                     <div>
                         <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">RESPONSABLE ASIGNADO</div>
                         <div style="background:#1E293B; padding:14px; border-radius:8px; border:1px solid #334155; color:#E2E8F0">${item.responsible || "No asignado"}</div>
                     </div>
                     <div>
                         <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">OBSERVACIONES INTERNAS</div>
                         <div style="background:#1E293B; padding:14px; border-radius:8px; border:1px solid #334155; color:#E2E8F0">${item.notes || "Ninguna grabación/observación."}</div>
                     </div>
                     ${item.override ? `
                        <div style="border-top:1px dashed #334155; padding-top:20px;">
                            <div style="font-size:10px; font-weight:800; color:#818CF8; margin-bottom:8px">MOTIVO DEL OVERRIDE</div>
                            <div style="background:color-mix(in srgb, #6366f1 15%, transparent); padding:14px; border-radius:8px; border:1px solid #6366f1; color:#E0E7FF">${item.overrideReason || "Sin justificación documentada."}</div>
                        </div>
                     ` : ''}
                 </div>
             `;

                drawerOverlay.style.pointerEvents = "auto";
                drawerOverlay.style.opacity = "1";
                drawer.style.right = "0";
            };
        });
    }

    // Bind globals
    if (root) {
        root.renderAudit = renderAudit;
        root.setAuditFilter = function (f) {
            currentFilter = f;
            renderAudit();
            setTimeout(() => {
                document.getElementById("auditSearchInput")?.focus();
            }, 50);
        };
    }

})(typeof globalThis !== "undefined" ? globalThis : window);
