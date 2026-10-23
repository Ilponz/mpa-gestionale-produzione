# -*- coding: utf-8 -*-
"""
Script per aggiornare build_app_js.py e rigenerare app/js/app.js
con il Pannello Admin - Storico Movimenti & Audit Produzione
"""

with open('build_app_js.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Variabili di stato nel constructor
old_ctor = r'''    // Loop Ticker
    this.tickerInterval = null;'''

new_ctor = r'''    // Loop Ticker
    this.tickerInterval = null;

    // Filtri Pannello Admin: Storico Movimenti & Audit Produzione
    this.auditFilterOp = 'all';
    this.auditActionCategory = 'all';
    this.auditSearchQuery = '';
    this.auditDateRange = 'all';'''

assert old_ctor in code, 'old_ctor not found'
code = code.replace(old_ctor, new_ctor, 1)

# 2. Pulsante Header [ 🛡️ STORICO MOVIMENTI ]
old_header_actions = r'''          <!-- Tasto Rapportino Giornaliero Stampabile A4 -->
          <button class="btn-outline-sm font-mono" id="btn-open-rapportino" title="Rapportino di Lavoro Giornaliero da Stampare (A4)">
            📋 RAPPORTINO GIORNALIERO
          </button>'''

new_header_actions = r'''          <!-- Tasto Storico Movimenti Pannello Admin Michele -->
          <button class="admin-audit-btn font-mono" id="btn-open-audit-log" title="Pannello Admin: Storico completo di tutti i movimenti eseguiti dagli operatori">
            🛡️ STORICO MOVIMENTI
          </button>

          <!-- Tasto Rapportino Giornaliero Stampabile A4 -->
          <button class="btn-outline-sm font-mono" id="btn-open-rapportino" title="Rapportino di Lavoro Giornaliero da Stampare (A4)">
            📋 RAPPORTINO GIORNALIERO
          </button>'''

assert old_header_actions in code, 'old_header_actions not found'
code = code.replace(old_header_actions, new_header_actions, 1)

# 3. Tasto rapido nel Drawer Attività
old_drawer_header = r'''            <div style="display:flex; align-items:center; gap:8px;">
              <button class="btn-outline-sm font-mono" id="btn-mark-all-read" title="Segna tutte come lette">
                ✓ LETTE
              </button>
              <button class="btn-outline-sm" id="btn-close-activity-drawer" title="Chiudi registro">
                ✕
              </button>
            </div>'''

new_drawer_header = r'''            <div style="display:flex; align-items:center; gap:8px;">
              <button class="btn-solid-white font-mono" id="btn-drawer-to-audit" style="font-size:10px; padding:4px 8px;" title="Apri Storico Completo Movimenti per Admin Michele">
                🛡️ STORICO COMPLETO
              </button>
              <button class="btn-outline-sm font-mono" id="btn-mark-all-read" title="Segna tutte come lette">
                ✓ LETTE
              </button>
              <button class="btn-outline-sm" id="btn-close-activity-drawer" title="Chiudi registro">
                ✕
              </button>
            </div>'''

assert old_drawer_header in code, 'old_drawer_header not found'
code = code.replace(old_drawer_header, new_drawer_header, 1)

# 4. Inserimento bindAuditLogEvents() in bindEvents()
old_bind_events = r'''    this.bindActivityDrawerEvents();
    this.bindRapportinoEvents();'''

new_bind_events = r'''    this.bindActivityDrawerEvents();
    this.bindRapportinoEvents();
    this.bindAuditLogEvents();'''

assert old_bind_events in code, 'old_bind_events not found'
code = code.replace(old_bind_events, new_bind_events, 1)

# 5. Inserimento hook audit su timer start
old_timer_start = r'''      this.sound.playTick();
      this.render();
    }
  }'''

new_timer_start = r'''      DB.logAuditAction({
        operator: AUTH.activeOperator.name,
        actionType: 'TIMER_START',
        actionLabel: 'AVVIO CRONOMETRO',
        details: `${AUTH.activeOperator.name} ha avviato cronometro reale per ${comp.code} (${proj.title})`,
        projectCode: proj.code,
        projectName: proj.title,
        componentCode: comp.code,
        station: comp.cutStatus !== 'completed' ? 'Postazione Troncatrice 1' : 'Banco Assemblaggio 1'
      });

      this.sound.playTick();
      this.render();
    }
  }'''

assert old_timer_start in code, 'old_timer_start not found'
code = code.replace(old_timer_start, new_timer_start, 1)

# 6. Inserimento hook audit su PIN Admin Michele
old_pin_verify = r'''              if (AUTH.verifyAdminPin(AUTH.enteredPin)) {
                this.sound.playSuccess();
                this.closeAllModals();
                this.render();
                AUTH.executePendingAction();'''

new_pin_verify = r'''              if (AUTH.verifyAdminPin(AUTH.enteredPin)) {
                DB.logAuditAction({
                  operator: 'Michele',
                  actionType: 'ADMIN_LOGIN',
                  actionLabel: 'ACCESSO ADMIN PIN 1991',
                  details: 'Accesso privilegiato Admin Michele confermato con PIN 1991',
                  station: 'Postazione Ufficio Tecnico'
                });
                this.sound.playSuccess();
                this.closeAllModals();
                this.render();
                AUTH.executePendingAction();'''

assert old_pin_verify in code, 'old_pin_verify not found'
code = code.replace(old_pin_verify, new_pin_verify, 1)

# 7. Inserimento del modale #modal-audit-log prima della chiusura di renderModals()
modal_audit_html = r'''
      <!-- Modal Pannello Admin: Storico Movimenti Globale & Audit Produzione -->
      <div id="modal-audit-log" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:1160px; max-height:94vh; display:flex; flex-direction:column; padding:0;">
          <div class="modal-header" style="padding:14px 20px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px;">🛡️</span>
              <div>
                <h3 style="font-size:13px; letter-spacing:0.08em;">PANNELLO ADMIN · STORICO MOVIMENTI & AUDIT PRODUZIONE</h3>
                <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted); margin-top:2px;">
                  REGISTRO IMMUTABILE DI TUTTI I MOVIMENTI IN FABBRICA (ACCESSO RISERVATO MICHELE)
                </div>
              </div>
            </div>
            <button class="btn-outline-sm" id="btn-close-audit-log">[X]</button>
          </div>

          <!-- KPI Summary Bar -->
          <div class="audit-kpi-bar" id="audit-kpi-container"></div>

          <!-- Toolbar Filtri & Azioni -->
          <div class="audit-toolbar" style="padding:10px 18px; border-bottom:var(--glass-border-light); background:rgba(12,14,20,0.85); display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
            <!-- Filtri Operatore -->
            <div style="display:flex; gap:5px; align-items:center;">
              <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted); margin-right:4px;">OPERATORE:</span>
              <button class="btn-outline-sm font-mono audit-op-filter active" data-audit-op="all">TUTTI</button>
              <button class="btn-outline-sm font-mono audit-op-filter" data-audit-op="Francesca">FRANCESCA</button>
              <button class="btn-outline-sm font-mono audit-op-filter" data-audit-op="Daniel">DANIEL</button>
              <button class="btn-outline-sm font-mono audit-op-filter" data-audit-op="Michele">MICHELE</button>
              <button class="btn-outline-sm font-mono audit-op-filter" data-audit-op="Maurizio">MAURIZIO</button>
            </div>

            <!-- Filtro Categoria Azione -->
            <div style="display:flex; gap:6px; align-items:center;">
              <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted);">AZIONE:</span>
              <select id="audit-action-type-select" class="form-control" style="font-size:11px; padding:4px 8px; width:155px; background:rgba(0,0,0,0.6); color:#fff; border:var(--glass-border);">
                <option value="all">TUTTE LE AZIONI</option>
                <option value="CUT">TAGLIO (TRONCATRICE)</option>
                <option value="ASSEMBLY">MONTAGGIO (BANCO)</option>
                <option value="TIMER">TEMPI & CRONOMETRO</option>
                <option value="CAD_PROJECT">COMMESSE & TAVOLE CAD</option>
                <option value="PRINT">STAMPE & RAPPORTINI</option>
                <option value="ADMIN">ACCESSI ADMIN MICHELE</option>
              </select>
            </div>

            <!-- Ricerca Testuale & Periodo -->
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="text" id="audit-search-input" class="form-control" placeholder="CERCA TELAIO, MORALE..." style="font-size:11px; padding:4px 10px; width:160px;" />
              <button class="btn-outline-sm font-mono audit-date-filter active" data-audit-range="all">TUTTO</button>
              <button class="btn-outline-sm font-mono audit-date-filter" data-audit-range="today">OGGI</button>
            </div>

            <!-- Pulsanti Export CSV & Stampa -->
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="btn-solid-white font-mono" id="btn-export-audit-csv" title="Esporta storico movimenti in CSV per Excel" style="font-size:11px;">
                📥 ESPORTA CSV
              </button>
              <button class="btn-outline-sm font-mono" id="btn-print-audit-report" title="Stampa registro audit su foglio A4" style="font-size:11px;">
                🖨️ STAMPA
              </button>
            </div>
          </div>

          <!-- Tabella Scrollabile Movimenti -->
          <div class="modal-body" style="padding:0; overflow-y:auto; flex:1;" id="audit-print-area">
            <table class="audit-table font-mono">
              <thead>
                <tr>
                  <th style="width:125px;">DATA & ORA</th>
                  <th style="width:110px;">OPERATORE</th>
                  <th style="width:145px;">AZIONE</th>
                  <th style="width:165px;">COMMESSA / TELAIO</th>
                  <th>DETTAGLI MOVIMENTO</th>
                  <th style="width:140px;">POSTAZIONE</th>
                </tr>
              </thead>
              <tbody id="audit-table-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
'''

old_modals_end = r'''      <!-- Modal Aggiungi Morale a Matita -->
      <div id="modal-add-moral" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:380px;">
          <div class="modal-header">
            <h3>+ AGGIUNGI MORALE A MATITA</h3>
            <button class="btn-outline-sm" id="btn-close-add-moral">[X]</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>QUANTITÀ (NR PEZZI)</label>
              <input type="number" id="new-moral-qty" class="form-control" value="2" min="1" />
            </div>
            <div class="form-group">
              <label>LUNGHEZZA ESATTA (MILLIMETRI)</label>
              <input type="text" id="new-moral-len" class="form-control" placeholder="ES. 1450.00" />
            </div>
            <div class="form-group">
              <label>DESCRIZIONE / POSIZIONE</label>
              <input type="text" id="new-moral-desc" class="form-control" placeholder="ES. MODIFICA VANO FINESTRA" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-solid-white" id="btn-save-new-moral">AGGIUNGI A DISTINTA</button>
          </div>
        </div>
      </div>
    `;
  }'''

new_modals_end = old_modals_end.replace(r'    `;', modal_audit_html + r'    `;')
assert old_modals_end in code, 'old_modals_end not found'
code = code.replace(old_modals_end, new_modals_end, 1)

# 8. Inserimento metodi operativi dell'Audit Log
audit_controller_methods = r'''
  // ==========================================================================
  // METODI PANNELLO ADMIN: STORICO MOVIMENTI & AUDIT PRODUZIONE
  // ==========================================================================

  getAuditBadgeHtml(actionType, actionLabel) {
    const type = String(actionType || '').toUpperCase();
    const label = actionLabel || type;
    if (type.includes('CUT')) {
      return `<span class="audit-badge audit-badge-cut">✂ ${label}</span>`;
    }
    if (type.includes('ASSEMBLY')) {
      return `<span class="audit-badge audit-badge-assembly">🔨 ${label}</span>`;
    }
    if (type.includes('TIMER')) {
      return `<span class="audit-badge audit-badge-timer">⏱ ${label}</span>`;
    }
    if (type.includes('PROJECT') || type.includes('COMPONENT') || type.includes('CAD')) {
      return `<span class="audit-badge audit-badge-cad">📐 ${label}</span>`;
    }
    if (type.includes('PRINT') || type.includes('QR') || type.includes('RAPPORTINO')) {
      return `<span class="audit-badge audit-badge-print">🖨️ ${label}</span>`;
    }
    if (type.includes('ADMIN')) {
      return `<span class="audit-badge audit-badge-admin">🛡️ ${label}</span>`;
    }
    if (type.includes('DELETE')) {
      return `<span class="audit-badge audit-badge-delete">🗑️ ${label}</span>`;
    }
    return `<span class="audit-badge audit-badge-cad">${label}</span>`;
  }

  openAuditLogModal() {
    this.sound.playSwitch();
    const modal = document.getElementById('modal-audit-log');
    if (!modal) return;
    modal.style.display = 'flex';
    this.renderAuditTable();

    const box = modal.querySelector('.modal-box');
    if (typeof gsap !== 'undefined' && box) {
      gsap.fromTo(box, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'power2.out' });
    }
  }

  closeAuditLogModal() {
    const modal = document.getElementById('modal-audit-log');
    if (modal) modal.style.display = 'none';
  }

  renderAuditTable() {
    const tbody = document.getElementById('audit-table-tbody');
    const kpiContainer = document.getElementById('audit-kpi-container');
    if (!tbody) return;

    const logs = DB.getAuditLogs({
      operator: this.auditFilterOp,
      actionCategory: this.auditActionCategory,
      searchQuery: this.auditSearchQuery,
      dateRange: this.auditDateRange
    });

    const kpis = DB.getAuditKPIs();
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="audit-kpi-card">
          <div class="audit-kpi-val">${kpis.totalCount}</div>
          <div class="audit-kpi-label">MOVIMENTI TOTALI REGISTRATI</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" style="color:#00FF88;">${kpis.todayCount}</div>
          <div class="audit-kpi-label">AZIONI ESEGUITE OGGI</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" style="color:#00E5FF; font-size:16px;">${kpis.topOperator}</div>
          <div class="audit-kpi-label">OPERATORE PIÙ ATTIVO</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" style="color:#FFAE42; font-size:15px;">${kpis.latestAction}</div>
          <div class="audit-kpi-label">ULTIMO MOVIMENTO REGISTRATO</div>
        </div>
      `;
    }

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:36px; color:var(--text-muted); font-size:11px;">
            Nessun movimento trovato per i filtri selezionati.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="font-weight:700; color:#FFFFFF;">
          <div>${l.time}</div>
          <div style="font-size:9px; color:var(--text-muted);">${l.date}</div>
        </td>
        <td>
          <span class="badge-op-tag ${this.getOperatorBadgeClass(l.operator)}">
            ${(l.operator || 'OPERATORE').toUpperCase()}
          </span>
        </td>
        <td>
          ${this.getAuditBadgeHtml(l.actionType, l.actionLabel)}
        </td>
        <td>
          <div style="font-weight:700; color:#FFFFFF;">${l.componentCode || '--'}</div>
          <div style="font-size:10px; color:var(--text-muted);">${l.projectCode ? l.projectCode + ' · ' : ''}${l.projectName || ''}</div>
        </td>
        <td style="line-height:1.45; color:var(--text-primary);">
          ${l.details}
        </td>
        <td style="font-size:10px; color:var(--text-muted);">
          ${l.station || 'Officina'}
        </td>
      </tr>
    `).join('');
  }

  exportAuditCSV() {
    const csv = DB.exportAuditLogsCSV({
      operator: this.auditFilterOp,
      actionCategory: this.auditActionCategory,
      searchQuery: this.auditSearchQuery,
      dateRange: this.auditDateRange
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    a.download = `MPA_Audit_Movimenti_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.sound.playSuccess();
  }

  bindAuditLogEvents() {
    const btnOpenAudit = document.getElementById('btn-open-audit-log');
    if (btnOpenAudit) {
      btnOpenAudit.addEventListener('click', () => {
        AUTH.requireAdmin(() => this.openAuditLogModal(), 'Accesso Storico Movimenti Admin');
      });
    }

    const btnDrawerToAudit = document.getElementById('btn-drawer-to-audit');
    if (btnDrawerToAudit) {
      btnDrawerToAudit.addEventListener('click', () => {
        this.closeActivityDrawer();
        AUTH.requireAdmin(() => this.openAuditLogModal(), 'Accesso Storico Movimenti Admin');
      });
    }

    const btnCloseAudit = document.getElementById('btn-close-audit-log');
    if (btnCloseAudit) {
      btnCloseAudit.addEventListener('click', () => this.closeAuditLogModal());
    }

    document.querySelectorAll('.audit-op-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.audit-op-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.auditFilterOp = btn.dataset.auditOp;
        this.renderAuditTable();
      });
    });

    const actionSelect = document.getElementById('audit-action-type-select');
    if (actionSelect) {
      actionSelect.addEventListener('change', (e) => {
        this.auditActionCategory = e.target.value;
        this.renderAuditTable();
      });
    }

    const searchInput = document.getElementById('audit-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.auditSearchQuery = e.target.value;
        this.renderAuditTable();
      });
    }

    document.querySelectorAll('.audit-date-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.audit-date-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.auditDateRange = btn.dataset.auditRange;
        this.renderAuditTable();
      });
    });

    const btnExport = document.getElementById('btn-export-audit-csv');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        this.exportAuditCSV();
      });
    }

    const btnPrint = document.getElementById('btn-print-audit-report');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }
  }
'''

old_format_date = r'''  formatDate(dateStr) {'''
new_format_date = audit_controller_methods + '\n' + old_format_date
assert old_format_date in code, 'old_format_date not found'
code = code.replace(old_format_date, new_format_date, 1)

with open('build_app_js.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: build_app_js.py updated with Admin Audit Panel.")
