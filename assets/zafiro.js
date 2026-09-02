// ═══════════════════════════════════════════════════════════
//  ZAFIRO — PORTAFOLIO DE LICITACIONES ENGINE
// ═══════════════════════════════════════════════════════════

let zCurrentFilter = 'Todas';

function zGetLicitaciones() {
    try { return JSON.parse(localStorage.getItem('zafiro_portfolio') || '[]'); } catch (e) { return []; }
}
function zSaveLicitaciones(list) {
    localStorage.setItem('zafiro_portfolio', JSON.stringify(list));
}

function zStatusBadge(status) {
    const map = {
        'Activa': 'background:#DCFCE7; color:#16A34A',
        'Preparación': 'background:#FEF3C7; color:#D97706',
        'Presentada': 'background:#DBEAFE; color:#2563EB',
        'En evaluación': 'background:#EDE9FE; color:#7C3AED',
        'Ganada': 'background:#D1FAE5; color:#059669',
        'Perdida': 'background:#FEE2E2; color:#DC2626',
    };
    const style = map[status] || 'background:#F1F5F9; color:#475569';
    return `<span style="${style}; padding:4px 12px; border-radius:100px; font-size:11px; font-weight:800">${status}</span>`;
}

function zInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const zColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#F43F5E'];
function zColor(name) { let h = 0; for (const c of (name || '')) h = c.charCodeAt(0) + h * 31; return zColors[Math.abs(h) % zColors.length]; }

function renderZafiro() {
    const list = zGetLicitaciones();
    const searchEl = document.getElementById('zSearch');
    const search = (searchEl ? searchEl.value : '').toLowerCase();

    const filtered = list.filter(l => {
        const matchFilter = zCurrentFilter === 'Todas' || l.status === zCurrentFilter;
        const matchSearch = !search || l.name.toLowerCase().includes(search) || (l.dep || '').toLowerCase().includes(search);
        return matchFilter && matchSearch;
    });

    // KPIs
    const activas = list.filter(l => ['Activa', 'Preparación', 'En evaluación'].includes(l.status)).length;
    const totalVal = list.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
    const avgProb = list.length ? Math.round(list.reduce((s, l) => s + (parseFloat(l.prob) || 0), 0) / list.length) : 0;
    const now = new Date(); const weekAhead = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const closingThisWeek = list.filter(l => { if (!l.date) return false; const d = new Date(l.date); return d >= now && d <= weekAhead; }).length;
    const totalRisks = list.reduce((s, l) => s + (parseInt(l.risks) || 0), 0);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('z-kpi-active', activas);
    set('z-kpi-value', `$${totalVal.toFixed(0)} MDP`);
    set('z-kpi-prob', `${avgProb}%`);
    set('z-kpi-week', closingThisWeek);
    set('z-kpi-docs', 0);
    set('z-kpi-risks', totalRisks);

    const tbody = document.getElementById('z-portfolio-table');
    const empty = document.getElementById('z-empty');
    if (!tbody) return;

    if (!filtered.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    const fmtDate = d => { if (!d) return '—'; const x = new Date(d + 'T12:00:00'); return `${x.getDate()} ${x.toLocaleString('es', { month: 'short' }).toUpperCase()}`; };
    const probBar = p => `<div style="height:4px;border-radius:4px;background:#E2E8F0;width:80px"><div style="height:4px;border-radius:4px;background:var(--accent);width:${Math.min(p || 0, 100)}%"></div></div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">${p || 0}%</div>`;

    tbody.innerHTML = filtered.map(l => `
    <tr style="border-top:1px solid var(--line); cursor:pointer; transition:background 0.15s"
        onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background=''"
        onclick="openZafiroForm('${l.id}')">
      <td style="padding:16px 24px">
        <div style="font-weight:800; font-size:13px; color:var(--text-dark)">${l.name}</div>
        ${l.desc ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px">${l.desc}</div>` : ''}
        ${l.num ? `<div style="font-size:10px; color:var(--text-muted); margin-top:1px; font-family:monospace">${l.num}</div>` : ''}
      </td>
      <td style="padding:16px; font-size:13px; font-weight:700; color:var(--text-dark)">${l.dep || '—'}</td>
      <td style="padding:16px">${zStatusBadge(l.status)}</td>
      <td style="padding:16px; font-weight:800; font-size:14px; color:var(--text-dark)">
        $${parseFloat(l.amount || 0).toFixed(0)}<span style="font-size:11px;font-weight:600;color:var(--text-muted)"> MDP</span>
      </td>
      <td style="padding:16px">
        <div style="font-weight:800; color:var(--accent); font-size:15px">${l.score || '—'}</div>
      </td>
      <td style="padding:16px">${probBar(l.prob)}</td>
      <td style="padding:16px; font-size:12px; color:var(--text-dark); font-weight:700">${fmtDate(l.date)}</td>
      <td style="padding:16px">
        <div style="display:flex; align-items:center; gap:8px">
          <div style="width:28px; height:28px; border-radius:100px; background:${zColor(l.owner)}; color:#fff; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center">${zInitials(l.owner)}</div>
          <span style="font-size:12px; color:var(--text-dark)">${l.owner || '—'}</span>
        </div>
      </td>
      <td style="padding:16px; text-align:center">
        ${parseInt(l.risks || 0) > 0
            ? `<span style="background:#FEE2E2; color:#DC2626; padding:4px 10px; border-radius:100px; font-size:11px; font-weight:800">⚠️ ${l.risks}</span>`
            : `<span style="color:var(--text-muted); font-size:12px">—</span>`}
      </td>
    </tr>
  `).join('');
}

function zFilter(status) {
    zCurrentFilter = status;
    document.querySelectorAll('.z-filter-btn').forEach(b => {
        const active = b.dataset.zf === status;
        b.style.color = active ? 'var(--accent)' : 'var(--text-muted)';
        b.style.fontWeight = active ? '800' : '600';
        b.style.borderBottom = active ? '3px solid var(--accent)' : '3px solid transparent';
    });
    renderZafiro();
}

function openZafiroForm(id) {
    const modal = document.getElementById('zafiroModal');
    if (!modal) return;

    if (id) {
        const list = zGetLicitaciones();
        const l = list.find(x => x.id === id);
        if (l) {
            document.getElementById('z-name').value = l.name || '';
            document.getElementById('z-dep').value = l.dep || '';
            document.getElementById('z-desc').value = l.desc || '';
            document.getElementById('z-amount').value = l.amount || '';
            document.getElementById('z-status').value = l.status || 'Preparación';
            document.getElementById('z-date').value = l.date || '';
            document.getElementById('z-owner').value = l.owner || '';
            document.getElementById('z-prob').value = l.prob || '';
            document.getElementById('z-num').value = l.num || '';
            document.getElementById('z-risks').value = l.risks || '';
            modal.dataset.editId = id;
        }
    } else {
        ['z-name', 'z-dep', 'z-desc', 'z-amount', 'z-date', 'z-owner', 'z-prob', 'z-num', 'z-risks'].forEach(fId => {
            const el = document.getElementById(fId); if (el) el.value = '';
        });
        document.getElementById('z-status').value = 'Preparación';
        delete modal.dataset.editId;
    }
    modal.style.display = 'flex';
}

function saveZafiroLicitacion() {
    const name = (document.getElementById('z-name').value || '').trim();
    if (!name) { alert('El nombre de la licitación es obligatorio.'); return; }
    const modal = document.getElementById('zafiroModal');
    const list = zGetLicitaciones();
    const editId = modal.dataset.editId;
    const entry = {
        id: editId || Date.now().toString(),
        name,
        dep: (document.getElementById('z-dep').value || '').trim(),
        desc: (document.getElementById('z-desc').value || '').trim(),
        amount: document.getElementById('z-amount').value,
        status: document.getElementById('z-status').value,
        date: document.getElementById('z-date').value,
        owner: (document.getElementById('z-owner').value || '').trim(),
        prob: document.getElementById('z-prob').value,
        num: (document.getElementById('z-num').value || '').trim(),
        risks: document.getElementById('z-risks').value,
        score: '—',
        created: editId ? (list.find(l => l.id === editId) || {}).created || new Date().toISOString() : new Date().toISOString(),
        updated: new Date().toISOString(),
    };
    if (editId) {
        const idx = list.findIndex(l => l.id === editId);
        if (idx >= 0) list[idx] = entry; else list.unshift(entry);
    } else {
        list.unshift(entry);
    }
    zSaveLicitaciones(list);
    modal.style.display = 'none';
    renderZafiro();
}

// Trigger render on view switch
document.querySelectorAll('.nav[data-view="zafiro"]').forEach(b => {
    b.addEventListener('click', () => setTimeout(renderZafiro, 60));
});
