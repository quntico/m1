"use strict";

(function initBidArchitectPanel(root) {

    let chatHistory = [];

    function openPanel() {
        let panel = document.getElementById("bidArchitectPanel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "bidArchitectPanel";
            panel.style.cssText = "position:fixed; top:0; right:0; width:400px; max-width:100vw; height:100vh; background:#0B1120; border-left:1px solid #1E293B; z-index:10000; display:flex; flex-direction:column; box-shadow:-10px 0 30px rgba(0,0,0,0.5); font-family:Inter,sans-serif; color:#F8FAFC;";

            panel.innerHTML = `
              <div style="padding:20px; border-bottom:1px solid #1E293B; display:flex; justify-content:space-between; align-items:center; background:#0F172A">
                  <div>
                      <div style="font-size:10px; font-weight:800; color:#3B82F6; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">AGENTE DE LICITACIONES</div>
                      <h2 style="margin:0; font-size:18px; font-weight:900;">Bid Architect</h2>
                  </div>
                  <button id="closeBidArchitectBtn" style="background:transparent; border:none; color:#94A3B8; font-size:20px; cursor:pointer">×</button>
              </div>
              <div style="padding:16px; border-bottom:1px solid #1E293B; background:#1E293B">
                  <div style="font-size:10px; font-weight:800; color:#94A3B8; margin-bottom:8px">ACCIONES RÁPIDAS</div>
                  <div style="display:flex; gap:8px; flex-wrap:wrap">
                      <label style="background:#3B82F6; color:#FFF; padding:6px 10px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:700">
                          Subir Documento
                          <input type="file" id="bidUploadDoc" style="display:none">
                      </label>
                      <button class="bid-action-btn" data-action="estrategia" style="background:#0F172A; border:1px solid #334155; color:#E2E8F0; padding:6px 10px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:700">Analizar Estrategia</button>
                      <button class="bid-action-btn" data-action="riesgos" style="background:#0F172A; border:1px solid #334155; color:#E2E8F0; padding:6px 10px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:700">Ver Riesgos</button>
                  </div>
              </div>
              <div id="bidChatWindow" style="flex:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:16px;">
                  <div style="background:#1E293B; padding:16px; border-radius:8px; border-left:3px solid #3B82F6; font-size:13px; line-height:1.5;">
                      Hola. Soy <b>Bid Architect</b>, experto en licitaciones reales. Puedo evaluar tus evidencias, contrastarlas con las reglas oficiales, e identificar riesgos técnicos en esta licitación.<br><br>Sube un documento o hazme una pregunta sobre tu matriz actual.
                  </div>
              </div>
              <div style="padding:16px; border-top:1px solid #1E293B; background:#0F172A">
                  <div style="display:flex; gap:8px">
                      <input type="text" id="bidTextInput" placeholder="Ej. ¿Qué me falta para cumplir el Anexo Técnico 7?" style="flex:1; background:#1E293B; border:1px solid #334155; color:#F8FAFC; padding:12px; border-radius:8px; outline:none; font-size:13px;">
                      <button id="bidSendBtn" style="background:#3B82F6; color:#FFF; border:none; padding:12px 16px; border-radius:8px; cursor:pointer; font-weight:800">→</button>
                  </div>
              </div>
          `;
            document.body.appendChild(panel);

            document.getElementById("closeBidArchitectBtn").onclick = () => {
                panel.style.display = "none";
            };

            const textInput = document.getElementById("bidTextInput");
            const sendBtn = document.getElementById("bidSendBtn");
            const fileInput = document.getElementById("bidUploadDoc");

            const appendMessage = (text, isUser) => {
                const chat = document.getElementById("bidChatWindow");
                const msg = document.createElement("div");
                msg.style.cssText = isUser
                    ? "background:#0F172A; border:1px solid #334155; padding:12px; border-radius:8px; font-size:13px; align-self:flex-end; max-width:85%; color:#E2E8F0;"
                    : "background:#1E293B; border-left:3px solid #3B82F6; padding:12px; border-radius:8px; font-size:13px; align-self:flex-start; max-width:85%; color:#F8FAFC; white-space:pre-wrap;";
                msg.innerHTML = isUser ? text : text.replace(/CONCLUSIÓN:|FUENTE:|EVIDENCIA REVISADA:|ANÁLISIS:|RIESGO:|ACCIÓN RECOMENDADA:|CONFIANZA:/g, match => `<br><br><b style='color:#93C5FD;font-size:11px'>${match}</b><br>`);
                chat.appendChild(msg);
                chat.scrollTop = chat.scrollHeight;
            };

            const handleSend = async () => {
                const val = textInput.value.trim();
                if (!val) return;
                textInput.value = "";
                appendMessage(val, true);

                try {
                    const res = await fetch("http://localhost:3001/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: val })
                    });
                    const data = await res.json();
                    appendMessage(data.reply || "Error en la respuesta del agente.", false);
                } catch (e) {
                    appendMessage("Error de conexión con BidArchitectService local.", false);
                }
            };

            sendBtn.onclick = handleSend;
            textInput.onkeydown = e => { if (e.key === "Enter") handleSend(); };

            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                appendMessage(`Subiendo documento: ${file.name}...`, true);

                const formData = new FormData();
                formData.append("file", file);

                try {
                    const res = await fetch("http://localhost:3001/api/documents", {
                        method: "POST",
                        body: formData
                    });
                    const data = await res.json();
                    appendMessage(data.analysis || "Lectura finalizada sin análisis detallado.", false);
                } catch (e) {
                    appendMessage("Error de conexión al cargar el documento.", false);
                }
            };

            const loadHistory = async () => {
                try {
                    const res = await fetch("http://localhost:3001/api/chat/history");
                    const hist = await res.json();
                    if (hist && hist.length > 0) {
                        document.getElementById("bidChatWindow").innerHTML = "";
                        hist.forEach(msg => appendMessage(msg.content, msg.role === 'user'));
                    }
                } catch (e) { }
            };
            loadHistory();
        }
        panel.style.display = "flex";
    }

    // Bind to global
    if (root) {
        root.openBidArchitectInfo = openPanel;
    }
})(typeof globalThis !== "undefined" ? globalThis : window);
