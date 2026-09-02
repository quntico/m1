"use strict";

(function initBidArchitectPanel(root) {

    let chatHistory = [];

    function openPanel() {
        let panel = document.getElementById("bidArchitectPanel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "bidArchitectPanel";
            panel.style.cssText = "position:fixed; top:0; right:0; width:450px; max-width:100vw; height:100vh; background:rgba(15, 23, 42, 0.65); backdrop-filter:blur(24px) saturate(140%); -webkit-backdrop-filter:blur(24px) saturate(140%); border-left:1px solid rgba(255,255,255,0.1); z-index:10000; display:flex; flex-direction:column; box-shadow:-10px 0 40px rgba(0,0,0,0.5); font-family:Inter,sans-serif; color:#F8FAFC; transition:right 0.3s ease;";

            panel.innerHTML = `
              <div style="padding:24px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; background:transparent">
                  <div>
                      <div style="font-size:10px; font-weight:800; color:#60A5FA; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">AGENTE DE LICITACIONES M1</div>
                      <h2 style="margin:0; font-size:22px; font-weight:900; background:linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Bid Architect</h2>
                  </div>
                  <button id="closeBidArchitectBtn" style="background:rgba(255,255,255,0.1); border:none; color:#F8FAFC; width:32px; height:32px; border-radius:100px; display:flex; justify-content:center; align-items:center; font-size:18px; cursor:pointer; transition:all 0.2s">✕</button>
              </div>
              <div style="padding:16px 24px; border-bottom:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.2)">
                  <div style="font-size:10px; font-weight:800; color:rgba(255,255,255,0.5); margin-bottom:12px; letter-spacing:0.5px">ACCIONES RÁPIDAS (SOPORTA PDF, WORD, CAD, ZIP)</div>
                  <div style="display:flex; gap:8px; flex-wrap:wrap">
                      <label style="background:linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color:#FFF; padding:8px 14px; border-radius:100px; font-size:11px; cursor:pointer; font-weight:800; box-shadow:0 4px 12px rgba(59,130,246,0.3); border:1px solid rgba(255,255,255,0.1)">
                          📥 Subir Documento
                          <input type="file" id="bidUploadDoc" accept="*/*" style="display:none">
                      </label>
                      <button class="bid-action-btn" data-action="estrategia" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#E2E8F0; padding:8px 14px; border-radius:100px; font-size:11px; cursor:pointer; font-weight:800; transition:all 0.2s">📊 Analizar Estrategia</button>
                      <button class="bid-action-btn" data-action="riesgos" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#E2E8F0; padding:8px 14px; border-radius:100px; font-size:11px; cursor:pointer; font-weight:800; transition:all 0.2s">⚠️ Ver Riesgos</button>
                  </div>
              </div>
              <div id="bidChatWindow" style="flex:1; padding:24px; overflow-y:auto; display:flex; flex-direction:column; gap:20px;">
                  <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:20px; border-radius:12px; border-left:4px solid #3B82F6; font-size:13px; line-height:1.6; backdrop-filter:blur(10px)">
                      Hola. Soy <b>Bid Architect</b>, experto en licitaciones reales. Puedo evaluar tus evidencias, contrastarlas con las reglas oficiales, e identificar riesgos técnicos en esta licitación.<br><br>Sube cualquier documento (PDF, Word, Excel, CAD) o hazme una pregunta sobre tu matriz actual.
                  </div>
              </div>
              <div style="padding:20px 24px; border-top:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.2)">
                  <div style="display:flex; gap:10px">
                      <input type="text" id="bidTextInput" placeholder="Ej. ¿Qué me falta para cumplir el Anexo Técnico 7?" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#F8FAFC; padding:14px 16px; border-radius:100px; outline:none; font-size:13px; backdrop-filter:blur(4px)">
                      <button id="bidSendBtn" style="background:#3B82F6; color:#FFF; border:none; width:46px; height:46px; border-radius:100px; cursor:pointer; font-weight:800; display:flex; justify-content:center; align-items:center; font-size:18px; box-shadow:0 4px 12px rgba(59,130,246,0.3)">↑</button>
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
