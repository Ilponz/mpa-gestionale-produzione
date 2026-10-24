/**
 * CONTROLLER APPLICATIVO PRINCIPALE (M.P.A. DI MAURIZIO CAVALLARO)
 * Estetica Architetturale Liquid Glass & Titanium Monochrome B&W.
 * Zero Template AI - Industrial Precision Woodworking CAD/CAM Software 4.0.
 * 
 * Moduli di Produzione Integrati:
 * 1. SoundEngine: Sintetizzatore audio tattile ad oscillatori (Web Audio API nativo).
 * 2. GSAP 3D Spatial Physics: Transizioni di navigazione con profondità Z e rotazione Y.
 * 3. Atropos 3D Parallax Tilt: Inclinazione dinamica con layer di offset indipendenti.
 * 4. Production Gatekeeper: Vincolo logico bloccante tra Taglio Troncatrice e Montaggio Banco.
 * 5. Active Stopwatch Timer: Cronometro reale per operatore con salvataggio automatico nel Timesheet.
 * 6. Batch Sawing & 1D Nesting: Distinta cumulativa commessa e calcolo barre standard grezze da 6m con % sfrido.
 * 7. QR Code Cantiere: Generazione etichetta tecnica stampabile per la posa in opera.
 * 8. Multi-Device Real-Time Sync: Sincronizzazione istantanea tra postazioni via BroadcastChannel & Storage Event.
 * 9. PDF.js SEMA Engine: Parsing automatico multi-pagina e split telai con distinta morali.
 * 10. Live Operator Activity & Activity Drawer ("Cosa fa chi"): Monitoraggio in tempo reale con badge colorati.
 * 11. Modal Conferma Spunta & Protezione Modifiche Admin Michele (PIN 1991).
 * 12. Rapportino di Lavoro Giornaliero Stampabile in A4 (Modello Cantiere & Modello M.P.A. Fiscale).
 */

// ==========================================================================
// 1. SINTETIZZATORE AUDIO TATTILE (WEB AUDIO API NATIVO)
// ==========================================================================

class SoundEngine {
  constructor() {
    this.enabled = localStorage.getItem('mpa_sound_enabled') !== 'false';
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('mpa_sound_enabled', this.enabled ? 'true' : 'false');
    if (this.enabled) this.playTick();
    return this.enabled;
  }

  // Clic tattile meccanico ad altissima precisione (toggle morale / tasto rapido)
  playTick() {
    if (!this.enabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch (e) {}
  }

  // Thud meccanico a bassa frequenza (switch pannello 3D / navigazione sezioni)
  playSwitch() {
    if (!this.enabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.11);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.11);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch (e) {}
  }

  // Sequenza di armonici puri al raggiungimento del 100% o salvataggio
  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const start = this.ctx.currentTime + idx * 0.065;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.04, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch (e) {}
  }
}

// ==========================================================================
// 2. CONTROLLER APPLICATIVO PRINCIPALE
// ==========================================================================

class AppController {
  constructor() {
    this.currentNavLevel = 'projects'; // 'projects' (Livello 1) | 'components' (Livello 2)
    this.selectedProjectId = 'proj-1';
    this.selectedComponentId = null;   // null = visualizza sfondo HUD finché non si seleziona un pezzo
    this.compSearchQuery = '';
    
    // Zoom e Pan CAD Blueprint
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isCadInverted = false;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

    // Audio Engine
    this.sound = new SoundEngine();

    // Cronometro Reale Operatore
    this.activeTimer = {
      compId: null,
      startTime: null,
      intervalId: null,
      elapsedSeconds: 0
    };

    // Buffer File PDF SEMA Caricato
    this.selectedPdfFile = null;

    // Istanze Atropos Parallax
    this.atroposInstances = [];

    // Canale Sincronizzazione Real-Time tra Postazioni
    this.broadcastChannel = null;

    // Context Menu State
    this.contextMenuTarget = null;

    // Confirm Modal Callback
    this.confirmModalCallback = null;

    // Drawer Attività "Cosa fa chi"
    this.activeFilterOp = null; // null = tutti gli operatori

    // Rapportino di Lavoro Giornaliero
    this.activeRapportinoTemplate = 'cantiere'; // 'cantiere' | 'fiscale'
    const today = new Date();
    this.activeRapportinoDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    this.rapportinoCustomRows = null;

    // Loop Ticker
    this.tickerInterval = null;

    // Filtri Pannello Admin: Storico Movimenti & Audit Produzione
    this.auditFilterOp = 'all';
    this.auditActionCategory = 'all';
    this.auditSearchQuery = '';
    this.auditDateRange = 'all';

    // Filtro rapido distinta morali: 'all' | 'todo' | 'done'
    this.moralFilterTab = 'all';

    this.init();
  }

  init() {
    this.initMultiDeviceSync();
    this.setupEventListeners();
    this.restoreActiveTimerIfAny();
    this.render();
    this.startLiveTickerLoop();
  }

  // --- SINCRONIZZAZIONE REAL-TIME MULTI-DEVICE (OFFICINA <-> UFFICIO <-> CANTIERE) ---

  initMultiDeviceSync() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('mpa_timber_sync_channel');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'DATA_UPDATED') {
          DB.data = DB.loadData();
          this.refreshCurrentViewSilently();
          this.updateLiveTicker();
          this.updateNotificationBadge();
        }
      };
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'mpa_gestionale_data_v8') {
        DB.data = DB.loadData();
        this.refreshCurrentViewSilently();
        this.updateLiveTicker();
        this.updateNotificationBadge();
      }
    });
  }

  broadcastDataUpdate() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
    }
  }

  refreshCurrentViewSilently() {
    const projPanel = document.querySelector('.nav-panel-projects');
    if (projPanel && this.currentNavLevel === 'projects') {
      projPanel.innerHTML = this.renderProjectsPanelContent();
      this.bindProjectCardsEvents();
    }

    if (this.currentNavLevel === 'components') {
      const compPanel = document.querySelector('.nav-panel-components');
      if (compPanel) {
        compPanel.innerHTML = this.renderComponentsPanelContent();
        this.bindComponentPanelEvents();
      }
    }

    this.initAtroposCards();
    this.updateLiveTicker();
    this.updateNotificationBadge();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.initAtroposCards());
    window.addEventListener('popstate', () => {
      if (this.currentNavLevel === 'components') {
        this.switchToProjects();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
        this.hideContextMenu();
        this.closeActivityDrawer();
        this.closeRapportinoModal();
      }
    });

    window.addEventListener('online', () => this.updateConnectionStatus(true));
    window.addEventListener('offline', () => this.updateConnectionStatus(false));
  }

  updateConnectionStatus(isOnline) {
    const el = document.getElementById('connection-status');
    if (!el) return;
    if (isOnline) {
      el.className = 'connection-status';
      el.textContent = 'ONLINE';
    } else {
      el.className = 'connection-status offline';
      el.textContent = 'OFFLINE (LOCALE)';
    }
  }

  // --- RENDER COMPLETO DELL'INTERFACCIA ---

  render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      ${this.renderHeader()}

      <main class="main-layout">
        ${this.renderSidebarNavigator()}

        <section class="main-stage" id="main-stage">
          ${this.renderMainStageContent()}
        </section>
      </main>

      ${this.renderContextMenu()}
      ${this.renderConfirmModal()}
      ${this.renderActivityDrawer()}
      ${this.renderModals()}
    `;

    this.bindEvents();
    this.initAtroposCards();
    this.updateLiveTicker();
    this.updateNotificationBadge();
  }

  // --- LIVE TICKER & BADGE ACCENT UTILITIES ---

  getOperatorBadgeClass(name) {
    if (!name) return 'op-default';
    const n = String(name).toLowerCase();
    if (n.includes('francesca')) return 'op-francesca';
    if (n.includes('daniel')) return 'op-daniel';
    if (n.includes('michele')) return 'op-michele';
    if (n.includes('maurizio')) return 'op-maurizio';
    return 'op-default';
  }

  getOperatorColor(name) {
    if (!name) return '#CCCCCC';
    const n = String(name).toLowerCase();
    if (n.includes('francesca')) return '#FFAE42';
    if (n.includes('daniel')) return '#00E5FF';
    if (n.includes('michele')) return '#FFFFFF';
    if (n.includes('maurizio')) return '#C77DFF';
    return '#CCCCCC';
  }

  getLatestTickerText() {
    const notifs = (typeof DB !== 'undefined' && DB.getNotifications) ? DB.getNotifications() : [];
    if (notifs.length > 0) {
      const top = notifs[0];
      return `● LIVE: ${top.operatorName ? top.operatorName + ' · ' : ''}${top.title}: ${top.message} (${top.time || ''})`;
    }
    return '● LIVE: Linea di produzione attiva · Troncatrice & Banco Assemblaggio 4.0';
  }

  updateLiveTicker() {
    const el = document.getElementById('live-ticker-text');
    if (el) {
      el.textContent = this.getLatestTickerText();
    }
  }

  updateNotificationBadge() {
    const badge = document.getElementById('notif-count-badge');
    if (badge) {
      const unread = (typeof DB !== 'undefined' && DB.getUnreadNotificationsCount) ? DB.getUnreadNotificationsCount() : 0;
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-block' : 'none';
    }
  }

  startLiveTickerLoop() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      this.updateLiveTicker();
    }, 4500);
  }

  // --- HEADER: BRANDING, TICKER DINAMICO, RAPPORTINO, NOTIFICHE & OPERATORE ---

  renderHeader() {
    const op = AUTH.activeOperator;
    const unreadCount = (typeof DB !== 'undefined' && DB.getUnreadNotificationsCount) ? DB.getUnreadNotificationsCount() : 0;

    return `
      <header class="app-header">
        <div class="brand-section">
          <div class="brand-title">MPA di Maurizio Cavallaro</div>
          
          <!-- Live Ticker Bar Dinamico con LED Pulsante -->
          <div class="live-ticker-bar" id="live-ticker-bar" title="Clicca per aprire il registro attività in tempo reale (Cosa fa chi)">
            <span class="live-led"></span>
            <span class="live-ticker-text" id="live-ticker-text">${this.getLatestTickerText()}</span>
          </div>
        </div>

        <div class="header-actions">
          <!-- Tasto Switch Audio Meccanico -->
          <button class="sound-toggle-btn ${this.sound.enabled ? '' : 'muted'}" id="btn-toggle-sound" title="Attiva/Disattiva Suoni Meccanici">
            ${this.sound.enabled ? 'AUDIO: ON' : 'AUDIO: OFF'}
          </button>

          <!-- Tasto Storico Movimenti Pannello Admin Michele -->
          <button class="admin-audit-btn font-mono" id="btn-open-audit-log" title="Pannello Admin: Storico completo di tutti i movimenti eseguiti dagli operatori">
            🛡️ STORICO MOVIMENTI
          </button>

          <!-- Tasto Rapportino Giornaliero Stampabile A4 -->
          <button class="btn-outline-sm font-mono" id="btn-open-rapportino" title="Rapportino di Lavoro Giornaliero da Stampare (A4)">
            📋 RAPPORTINO GIORNALIERO
          </button>

          <!-- Notifiche Admin: Cosa fa chi -->
          <button class="notif-bell-btn" id="btn-open-activity-drawer" title="Registro attività operai in tempo reale">
            <span class="bell-icon">🔔</span> COSA FA CHI
            <span class="notif-badge-count" id="notif-count-badge" style="${unreadCount > 0 ? '' : 'display:none;'}">${unreadCount}</span>
          </button>

          <!-- Selettore Operatore Squadra con Badge Colorato -->
          <div class="operator-box" id="btn-change-operator" title="Cambia Operatore Attivo">
            <span class="operator-label">OPERATORE:</span>
            <span class="badge-op-tag ${this.getOperatorBadgeClass(op.name)}" style="font-weight:700;">${op.name}</span>
          </div>

          <!-- Stato Connessione Locale / Rete -->
          <div id="connection-status" class="connection-status">
            ONLINE
          </div>

          ${AUTH.isAdmin ? `
            <div class="admin-badge-active" id="btn-admin-logout" title="Clicca per uscire dalla modalità amministratore Michele">
              MICHELE (ADMIN) [ ESCI ]
            </div>
          ` : `
            <div class="admin-stealth-dot" id="btn-stealth-admin" title="Accesso Riservato Michele (PIN 1991)"></div>
          `}
        </div>
      </header>
    `;
  }

  // --- BARRA LATERALE NAVIGATRICE A TRANSIZIONE 3D SPATIAL (DUE LIVELLI) ---

  renderSidebarNavigator() {
    const isProjects = this.currentNavLevel === 'projects';
    const isComponents = this.currentNavLevel === 'components';

    return `
      <aside class="sidebar-navigator">
        <!-- LIVELLO 1: LISTA COMMESSE -->
        <div class="nav-panel nav-panel-projects ${isProjects ? 'state-active' : 'state-hidden'}">
          ${this.renderProjectsPanelContent()}
        </div>

        <!-- LIVELLO 2: PARTI DEL PROGETTO (TELAI / COMPONENTI) -->
        <div class="nav-panel nav-panel-components ${isComponents ? 'state-active' : 'state-hidden'}">
          ${this.renderComponentsPanelContent()}
        </div>
      </aside>
    `;
  }

  // CONTENUTO LIVELLO 1: LISTA DELLE COMMESSE (B&W LIQUID GLASS)
  renderProjectsPanelContent() {
    const projects = DB.getProjects(AUTH.isAdmin);

    return `
      <div class="panel-header">
        <span class="panel-header-title">COMMESSE SEMA</span>
        <button class="btn-solid-white font-mono" id="btn-open-new-proj" title="Crea nuova commessa da file PDF CAD (Richiede PIN Admin)">
          + NUOVA COMMESSA
        </button>
      </div>

      <div class="panel-scroll-content">
        ${projects.map(p => {
          const progress = DB.calculateProjectProgress(p);
          const isSelected = p.id === this.selectedProjectId;
          const daysLeft = this.calculateDaysRemaining(p.deadline);

          return `
            <div class="atropos atropos-card-wrapper" data-atropos-proj="${p.id}">
              <div class="atropos-scale">
                <div class="atropos-rotate">
                  <div class="atropos-inner">
                    <div class="liquid-glass-card project-summary-card ${isSelected ? 'active' : ''}" 
                         data-project-id="${p.id}"
                         title="Tasto sinistro per aprire · Tasto destro per modificare/eliminare">
                      <div class="p-card-top font-mono" data-atropos-offset="2">
                        <span class="p-card-code">${p.code}</span>
                        <span class="p-card-client">${p.client}</span>
                      </div>

                      <div class="p-card-title font-display" data-atropos-offset="4">${p.title}</div>

                      <div class="p-card-meta font-mono" data-atropos-offset="1">
                        <span>${p.totalComponents || p.components.length} TELAI</span>
                        <span>CONSEGNA: ${this.formatDate(p.deadline)} (${daysLeft})</span>
                      </div>

                      <div class="p-progress-box" data-atropos-offset="3">
                        <div class="p-progress-track">
                          <div class="p-progress-fill" id="proj-progress-bar-${p.id}" style="width: ${progress}%;"></div>
                        </div>
                        <div class="p-progress-val font-mono" id="proj-progress-val-${p.id}">${progress}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Barra Inferiore Timesheet -->
      <div style="padding:12px; border-top:var(--glass-border-light); background:rgba(6,7,9,0.8);">
        <button class="btn-outline-white font-mono" id="btn-open-timesheet" style="width:100%; font-size:10px;" title="Registro tempi e produttività operatori">
          ⏱ REGISTRO TEMPI & PRODUTTIVITÀ
        </button>
      </div>
    `;
  }

  // CONTENUTO LIVELLO 2: PARTI DEL PROGETTO CON ATTRIBUZIONE OPERATORE E DATE
  renderComponentsPanelContent() {
    const project = DB.getProjectById(this.selectedProjectId);
    if (!project) {
      return `
        <div class="panel-header">
          <button class="btn-nav-back" id="btn-back-to-projects">← COMMESSE</button>
        </div>
        <div style="padding:20px; color:var(--text-muted); font-size:11px; font-family:var(--font-mono);">
          Nessuna commessa selezionata.
        </div>
      `;
    }

    const progress = DB.calculateProjectProgress(project);
    let components = project.components || [];

    if (this.compSearchQuery) {
      const q = this.compSearchQuery.toLowerCase();
      components = components.filter(c => 
        c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
      );
    }

    return `
      <!-- Header con Pulsante Indietro, Troncatrice Batch e Modifica Commessa -->
      <div class="panel-header">
        <button class="btn-nav-back" id="btn-back-to-projects" title="Torna all'elenco delle commesse">
          ← COMMESSE
        </button>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn-outline-sm font-mono" id="btn-open-batch-saw" title="Distinta cumulativa troncatrice & calcolo sfrido barre grezze">
            🪚 BATCH TRONCATRICE
          </button>
          <button class="btn-outline-sm" id="btn-edit-active-proj" title="Modifica commessa (Richiede PIN Admin)">
            [ MODIFICA ]
          </button>
        </div>
      </div>

      <!-- Intestazione Commessa e Barra Avanzamento Globale -->
      <div style="padding:14px 18px; border-bottom:var(--glass-border-light); background:rgba(18,21,28,0.4);">
        <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">
          ${project.code} · ${project.client}
        </div>
        <div style="font-size:15px; font-weight:700; color:#FFFFFF; margin-top:2px;">
          ${project.title}
        </div>
        <div class="p-progress-box" style="margin-top:8px;">
          <div class="p-progress-track">
            <div class="p-progress-fill" id="comp-panel-progress-bar" style="width: ${progress}%;"></div>
          </div>
          <div class="p-progress-val font-mono" id="comp-panel-progress-val">${progress}%</div>
        </div>
      </div>

      <!-- Ricerca Rapida Pezzo -->
      <div style="padding:8px 14px; border-bottom:var(--glass-border-light); background:rgba(8,10,14,0.4);">
        <input 
          type="text" 
          id="input-filter-components" 
          class="form-control" 
          style="padding:6px 10px; font-size:11px; background:transparent; border:none;" 
          placeholder="CERCA TELAIO (ES. PM 01)..." 
          value="${this.compSearchQuery}" 
        />
      </div>

      <!-- Elenco Parti del Progetto (Telai / Componenti) con Fasi, Operatori e Timestamp -->
      <div class="panel-scroll-content">
        ${components.length === 0 ? `
          <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:11px; font-family:var(--font-mono);">
            Nessun telaio presente o trovato.
          </div>
        ` : components.map(comp => {
          const isSelected = comp.id === this.selectedComponentId;
          const moraliCount = comp.morali ? comp.morali.length : 0;
          const checkedCount = comp.morali ? comp.morali.filter(m => m.checked).length : 0;
          
          const cutOp = comp.cutOperator || comp.cutOperatorName || 'NON ASS.';
          const asmOp = comp.assemblyOperator || comp.assemblyOperatorName || 'NON ASS.';
          const cutTime = comp.cutDate ? `${comp.cutDate} ${comp.cutEndTime || ''}` : (comp.cutStatus === 'completed' ? 'FATTO' : 'IN CODA');
          const asmTime = comp.assemblyDate ? `${comp.assemblyDate} ${comp.assemblyEndTime || ''}` : (comp.assemblyStatus === 'completed' ? 'FATTO' : (comp.cutStatus === 'completed' ? 'PRONTO' : 'ATTESA'));

          return `
            <div class="atropos atropos-card-wrapper" data-atropos-comp="${comp.id}">
              <div class="atropos-scale">
                <div class="atropos-rotate">
                  <div class="atropos-inner">
                    <div class="liquid-glass-card component-item-card ${isSelected ? 'active' : ''}" 
                         data-select-component-id="${comp.id}"
                         data-context-component-id="${comp.id}"
                         title="Tasto sinistro per aprire · Tasto destro per opzioni">
                      <div class="comp-card-header font-mono" data-atropos-offset="3">
                        <span class="comp-card-page">PAG. ${comp.pageNumber}</span>
                        <span class="comp-card-code">${comp.code}</span>
                      </div>

                      <div class="comp-card-title" data-atropos-offset="5">${comp.title}</div>

                      <div class="comp-card-meta font-mono" data-atropos-offset="2">
                        <span style="color:var(--text-secondary);">${checkedCount}/${moraliCount} PEZZI TAGLIATI</span>
                        ${comp.cutStatus === 'completed' && comp.assemblyStatus === 'completed' ? `
                          <span class="status-pill status-done" style="padding:2px 6px; font-weight:700;">✓ TELAIO FINITO</span>
                        ` : comp.cutStatus === 'completed' && comp.assemblyStatus !== 'completed' ? `
                          <span class="status-pill" style="padding:2px 6px; font-weight:700; background:rgba(0,229,255,0.18); color:#00E5FF; border:1px solid #00E5FF;">🔨 PRONTO AL BANCO</span>
                        ` : comp.cutStatus === 'wip' ? `
                          <span class="status-pill status-wip" style="padding:2px 6px;">✂ IN TAGLIO (${checkedCount}/${moraliCount})</span>
                        ` : `
                          <span class="status-pill status-todo" style="padding:2px 6px;">✂ DA TAGLIARE</span>
                        `}
                      </div>

                      <!-- Fasi Operatori & Timestamp in Tempo Reale -->
                      <div class="comp-card-phases" data-atropos-offset="1">
                        <div class="comp-phase-row">
                          <span style="color:var(--text-muted);">✂ TAGLIO:</span>
                          <div style="display:flex; align-items:center; gap:5px;">
                            <span class="badge-op-tag ${this.getOperatorBadgeClass(cutOp)}">${cutOp.toUpperCase()}</span>
                            <span class="comp-timestamp-tag">${cutTime}</span>
                          </div>
                        </div>
                        <div class="comp-phase-row">
                          <span style="color:var(--text-muted);">🔨 BANCO:</span>
                          <div style="display:flex; align-items:center; gap:5px;">
                            <span class="badge-op-tag ${this.getOperatorBadgeClass(asmOp)}">${asmOp.toUpperCase()}</span>
                            <span class="comp-timestamp-tag">${asmTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- STAGE PRINCIPALE: WORKSTATION CAD SEMA & DISTINTA MORALI ---

  renderMainStageContent() {
    const project = DB.getProjectById(this.selectedProjectId);

    // Se nessun componente è selezionato: VEDI SFONDO con HUD Glass
    if (!this.selectedComponentId || !project) {
      return `
        <div class="empty-stage-hud liquid-glass">
          <div class="hud-tag font-mono">[ ARCHIVIO SEMA · VANO PRODUZIONE ]</div>
          <h2 class="hud-title font-display">${project ? project.title : 'SELEZIONA UNA COMMESSA'}</h2>
          <p class="hud-desc font-mono">
            ${project 
              ? 'Seleziona un telaio dalla lista a sinistra per aprire la tavola tecnica CAD e la distinta di taglio morali.' 
              : 'Clicca su una delle commesse a sinistra per visualizzare le parti e avviare la lavorazione.'}
          </p>

          ${project ? `
            <div class="hud-meta-row font-mono">
              <span>CLIENTE: ${project.client}</span>
              <span>CONSEGNA: ${this.formatDate(project.deadline)}</span>
              <span>AVANZAMENTO: ${DB.calculateProjectProgress(project)}%</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Altrimenti: VIENE FUORI NELLO SPAZIO VUOTO LA SEZIONE DEL COMPONENTE IN LIQUID GLASS
    const comp = DB.getComponent(this.selectedProjectId, this.selectedComponentId);
    if (!comp) {
      return `
        <div class="empty-stage-hud liquid-glass">
          <p class="hud-desc font-mono">Telaio non trovato.</p>
        </div>
      `;
    }

    const morali = comp.morali || [];
    const checkedCount = morali.filter(m => m.checked).length;
    const totalCount = morali.length;
    const isTimerActiveOnThisComp = this.isTimerRunningFor(comp.id);
    const cutOp = comp.cutOperator || comp.cutOperatorName || 'Francesca';
    const asmOp = comp.assemblyOperator || comp.assemblyOperatorName || 'Daniel';

    const allComps = project.components || [];
    const compIdx = allComps.findIndex(c => c.id === comp.id);
    const prevComp = compIdx > 0 ? allComps[compIdx - 1] : null;
    const nextComp = compIdx >= 0 && compIdx < allComps.length - 1 ? allComps[compIdx + 1] : null;

    return `
      <section class="liquid-glass component-workstation">
        <!-- Barra Superiore della Workstation Telaio -->
        <div class="workstation-header">
          <div class="workstation-title-box">
            <div class="workstation-page-tag font-mono">
              PAGINA ${comp.pageNumber} DI ${project.totalComponents || allComps.length} · TAVOLA ${comp.code}
            </div>
            <div class="workstation-main-title">${comp.title}</div>
            
            <!-- Barra Assegnazione Operatori (Cliccabile per Riassegnazione Rapida) -->
            <div style="display:flex; flex-wrap:wrap; gap:14px; align-items:center; margin-top:6px; font-size:10px; font-family:var(--font-mono);">
              <div style="display:flex; align-items:center; gap:5px;">
                <span style="color:var(--text-muted);">OP. TAGLIO:</span>
                <span class="badge-op-tag ${this.getOperatorBadgeClass(cutOp)} btn-quick-reassign-op" data-reassign-phase="cut" data-reassign-comp-id="${comp.id}" style="cursor:pointer;" title="Clicca per riassegnare operatore taglio">
                  ${cutOp} ▾
                </span>
                <span class="comp-timestamp-tag">${comp.cutDate ? comp.cutDate + ' ' + (comp.cutStartTime ? comp.cutStartTime + '-' + (comp.cutEndTime || '') : '') : ''}</span>
              </div>

              <div style="display:flex; align-items:center; gap:5px;">
                <span style="color:var(--text-muted);">OP. BANCO:</span>
                <span class="badge-op-tag ${this.getOperatorBadgeClass(asmOp)} btn-quick-reassign-op" data-reassign-phase="assembly" data-reassign-comp-id="${comp.id}" style="cursor:pointer;" title="Clicca per riassegnare operatore montaggio">
                  ${asmOp} ▾
                </span>
                <span class="comp-timestamp-tag">${comp.assemblyDate ? comp.assemblyDate + ' ' + (comp.assemblyStartTime ? comp.assemblyStartTime + '-' + (comp.assemblyEndTime || '') : '') : ''}</span>
              </div>
            </div>

            ${comp.note ? `
              <div style="font-size:11px; font-family:var(--font-mono); color:#FFFFFF; background:var(--glass-subtle); border:var(--glass-border-light); padding:4px 8px; margin-top:6px;">
                NOTA OFFICINA: ${comp.note}
              </div>
            ` : ''}
          </div>

          <div class="workstation-actions">
            <!-- Pulsanti Navigazione Rapida Telai Consecutivi -->
            <div style="display:flex; gap:4px; align-items:center;">
              <button class="btn-outline-sm font-mono btn-nav-sibling-comp" ${prevComp ? `data-jump-comp-id="${prevComp.id}"` : 'disabled style="opacity:0.3; cursor:not-allowed;"'} title="Telaio precedente (${prevComp ? prevComp.code : 'Nessuno'})">
                ← PREC
              </button>
              <button class="btn-outline-sm font-mono btn-nav-sibling-comp" ${nextComp ? `data-jump-comp-id="${nextComp.id}"` : 'disabled style="opacity:0.3; cursor:not-allowed;"'} title="Telaio successivo (${nextComp ? nextComp.code : 'Nessuno'})">
                SUCC →
              </button>
            </div>

            <!-- Cronometro Tattile Lavorazione Attiva -->
            <button class="btn-timer ${isTimerActiveOnThisComp ? 'running' : ''}" id="btn-toggle-work-timer" data-timer-comp-id="${comp.id}" title="Avvia/Arresta cronometro reale lavorazione">
              ${isTimerActiveOnThisComp 
                ? `⏱ IN CORSO: ${this.formatTimerTime(this.activeTimer.elapsedSeconds)} [ STOP & SALVA ]` 
                : `⏱ AVVIA CRONOMETRO`}
            </button>

            <!-- Azione Rapida Taglio con Popup di Conferma -->
            <button class="btn-solid-white font-mono" id="btn-action-toggle-cut" data-action-toggle-cut="${comp.id}" style="${comp.cutStatus === 'completed' ? 'background:#FFFFFF; color:#000000;' : 'background:transparent; color:#FFFFFF; border:1px solid #FFFFFF;'}">
              TAGLIO: ${comp.cutStatus === 'completed' ? 'COMPLETATO' : 'IN CORSO (SEGNA FATTO)'}
            </button>

            <!-- Azione Rapida Montaggio Banco (con Vincolo Bloccante Gatekeeper) -->
            <button class="btn-outline-white font-mono" id="btn-action-toggle-assembly" data-action-toggle-assembly="${comp.id}" style="${comp.assemblyStatus === 'completed' ? 'background:#FFFFFF; color:#000000;' : ''}">
              MONTAGGIO: ${comp.assemblyStatus === 'completed' ? 'COMPLETATO' : 'BANCO (SEGNA FATTO)'}
            </button>

            <!-- Etichetta QR Posa Cantiere -->
            <button class="btn-outline-sm font-mono" id="btn-print-qr-label" data-qr-comp-id="${comp.id}" title="Genera etichetta QR tecnica per cantiere">
              🖨 ETICHETTA QR
            </button>

            <!-- Pulsante per Chiudere il Telaio e Tornare allo Sfondo -->
            <button class="btn-outline-sm font-mono" id="btn-close-workstation" title="Chiudi telaio e torna allo sfondo">
              ✕ CHIUDI
            </button>
          </div>
        </div>

        <!-- Griglia Interna: Disegno CAD a Sinistra, Distinta a Destra -->
        <div class="workstation-grid">
          <!-- Finestra Tavola Tecnica SEMA CAD -->
          <div class="workstation-cad-box ${this.isCadInverted ? 'cad-inverted' : ''}" id="cad-drawing-container">
            <img 
              id="cad-drawing-preview" 
              src="${comp.image}" 
              alt="${comp.title}" 
              style="max-width:100%; max-height:520px; object-fit:contain; transform: scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px); transition: transform 120ms ease; pointer-events:none;" 
            />

            <!-- Controlli Zoom e Modalità CAD Inverted -->
            <div class="cad-zoom-bar">
              <button class="zoom-btn" id="btn-zoom-in" title="Ingrandisci">[ + ]</button>
              <button class="zoom-btn" id="btn-zoom-out" title="Riduci">[ - ]</button>
              <button class="zoom-btn" id="btn-zoom-reset" title="Reimposta 1:1">[ 1:1 ]</button>
              <button class="zoom-btn" id="btn-zoom-invert" title="Inverti Contrasto CAD Blueprint" style="${this.isCadInverted ? 'background:#FFFFFF; color:#000000;' : ''}">[ CAD INV ]</button>
              <button class="zoom-btn" id="btn-zoom-fullscreen" title="Schermo Intero">[ ⛶ ]</button>
            </div>
          </div>

          <!-- Distinta Morali con Filtro Rapido e Spunta Pezzi -->
          <div class="workstation-morali-box">
            <div class="section-title" style="flex-wrap:wrap; gap:8px;">
              <div>
                <span>DISTINTA MORALI</span>
                <span class="font-mono" id="workstation-morali-status-text" style="font-size:10px; color:var(--text-secondary); margin-left:6px;">
                  ${checkedCount}/${totalCount} (${totalCount > 0 && checkedCount === totalCount ? '100% OK' : `${totalCount - checkedCount} DA TAGLIARE`})
                </span>
              </div>

              <!-- Filtri Rapidi Troncatrice: Tutti / Solo da Tagliare / Solo Tagliati -->
              <div style="display:flex; gap:4px; align-items:center;">
                <button class="btn-outline-sm font-mono btn-filter-morali ${this.moralFilterTab === 'all' ? 'active' : ''}" data-moral-filter="all" style="padding:2px 6px; font-size:9px;">
                  TUTTI (${totalCount})
                </button>
                <button class="btn-outline-sm font-mono btn-filter-morali ${this.moralFilterTab === 'todo' ? 'active' : ''}" data-moral-filter="todo" style="padding:2px 6px; font-size:9px; color:#FFAE42;">
                  DA TAGLIARE (${totalCount - checkedCount})
                </button>
                <button class="btn-outline-sm font-mono btn-filter-morali ${this.moralFilterTab === 'done' ? 'active' : ''}" data-moral-filter="done" style="padding:2px 6px; font-size:9px; color:#00FF88;">
                  TAGLIATI (${checkedCount})
                </button>
              </div>
            </div>

            <div class="morali-list" style="flex:1; overflow-y:auto; max-height:440px;">
              ${(() => {
                let filteredMorali = morali;
                if (this.moralFilterTab === 'todo') {
                  filteredMorali = morali.filter(m => !m.checked);
                } else if (this.moralFilterTab === 'done') {
                  filteredMorali = morali.filter(m => m.checked);
                }

                if (filteredMorali.length === 0) {
                  return `
                    <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:11px; font-family:var(--font-mono);">
                      ${this.moralFilterTab === 'todo' ? 'Tutti i pezzi di questa tavola sono stati tagliati!' : this.moralFilterTab === 'done' ? 'Nessun pezzo ancora tagliato.' : 'Nessun pezzo associato a questa tavola.'}
                    </div>
                  `;
                }

                return filteredMorali.map(m => `
                <div class="moral-item ${m.checked ? 'checked' : ''}" data-moral-comp-id="${comp.id}" data-moral-id="${m.id}" title="Clicca per confermare spunta">
                  <div class="moral-checkbox">
                    ${m.checked ? '✓' : ''}
                  </div>

                  <div class="moral-details font-mono">
                    <div style="display:flex; gap:10px; align-items:center;">
                      <span class="moral-qty">NR ${m.qty}</span>
                      <span class="moral-len">L. ${m.length} MM</span>
                      <span class="moral-desc">${m.desc}</span>
                    </div>

                    ${m.checked && m.checkedBy ? `
                      <div class="moral-operator-tag">
                        <span class="badge-op-tag ${this.getOperatorBadgeClass(m.checkedBy)}">${m.checkedBy.toUpperCase()}</span>
                        <span>• ${m.checkedDate || ''} ${m.checkedAt || m.timestamp || ''}</span>
                      </div>
                    ` : `
                      <div class="moral-operator-tag" style="opacity:0.45;">
                        <span>IN ATTESA DI TAGLIO</span>
                      </div>
                    `}
                  </div>

                  ${AUTH.isAdmin ? `
                    <button class="moral-delete-btn" data-delete-moral-comp-id="${comp.id}" data-delete-moral-id="${m.id}" title="Elimina pezzo (Richiede PIN Admin)">
                      [X]
                    </button>
                  ` : ''}
                </div>
              `).join('');
            })()}
            </div>

            <!-- Tasto Aggiungi Morale a Matita (Riservato ad Admin con PIN 1991) -->
            <button class="btn-add-moral" data-add-moral-comp-id="${comp.id}">
              + AGGIUNGI MORALE A MATITA
            </button>
          </div>
        </div>
      </section>
    `;
  }

  // --- CRONOMETRO REALE ATTIVO ---

  isTimerRunningFor(compId) {
    return this.activeTimer.compId === compId && this.activeTimer.intervalId !== null;
  }

  formatTimerTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  restoreActiveTimerIfAny() {
    try {
      const saved = localStorage.getItem('mpa_active_work_timer');
      if (saved) {
        const t = JSON.parse(saved);
        if (t && t.compId && t.startTime) {
          const elapsed = Math.floor((Date.now() - t.startTime) / 1000);
          this.activeTimer = {
            compId: t.compId,
            projId: t.projId,
            startTime: t.startTime,
            startTimeStr: t.startTimeStr,
            elapsedSeconds: elapsed,
            intervalId: setInterval(() => {
              this.activeTimer.elapsedSeconds = Math.floor((Date.now() - this.activeTimer.startTime) / 1000);
              const btn = document.getElementById('btn-toggle-work-timer');
              if (btn && btn.dataset.timerCompId === this.activeTimer.compId) {
                btn.textContent = `⏱ IN CORSO: ${this.formatTimerTime(this.activeTimer.elapsedSeconds)} [ STOP & SALVA ]`;
              }
            }, 1000)
          };
        }
      }
    } catch (e) {}
  }

  toggleWorkTimer(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!comp || !proj) return;

    // Gestione Concorrenza: Se un altro cronometro è già attivo su un diverso telaio
    if (this.activeTimer.compId && this.activeTimer.compId !== compId) {
      const runningComp = DB.getComponent(this.selectedProjectId, this.activeTimer.compId);
      const code = runningComp ? runningComp.code : 'un altro telaio';
      this.showConfirmModal({
        title: '⏱ CRONOMETRO GIÀ ATTIVO',
        message: `È già attivo un cronometro sul telaio <strong>${code}</strong> (${this.formatTimerTime(this.activeTimer.elapsedSeconds)}).<br><br>Vuoi fermare e registrare il tempo precedente prima di avviare questo telaio?`,
        confirmText: 'SALVA E AVVIA QUESTO',
        cancelText: 'ANNULLA',
        onConfirm: () => {
          this.toggleWorkTimer(this.activeTimer.compId);
          setTimeout(() => this.toggleWorkTimer(compId), 120);
        }
      });
      return;
    }

    if (this.isTimerRunningFor(compId)) {
      // STOP CRONOMETRO E REGISTRAZIONE AUTOMATICA NEL TIMESHEET
      clearInterval(this.activeTimer.intervalId);
      localStorage.removeItem('mpa_active_work_timer');

      const elapsedMins = Math.max(1, Math.round(this.activeTimer.elapsedSeconds / 60));
      const endNow = new Date();
      const endTimeStr = `${String(endNow.getHours()).padStart(2, '0')}:${String(endNow.getMinutes()).padStart(2, '0')}`;
      
      const logEntry = DB.logWork(
        proj.title,
        comp.code,
        comp.cutStatus !== 'completed' ? 'Taglio Troncatrice' : 'Assemblaggio Banco',
        AUTH.activeOperator.name,
        this.activeTimer.startTimeStr,
        endTimeStr,
        elapsedMins
      );

      DB.addNotification(
        `CRONOMETRO REGISTRATO`,
        `${AUTH.activeOperator.name} ha completato ${elapsedMins} min di lavorazione su ${comp.code} (${proj.title}).`,
        'info',
        AUTH.activeOperator.name,
        comp.code,
        proj.id
      );

      this.activeTimer = { compId: null, startTime: null, intervalId: null, elapsedSeconds: 0 };
      this.sound.playSuccess();
      this.broadcastDataUpdate();
      this.render();
    } else {
      // AVVIA CRONOMETRO CON PERSISTENZA LOCALSTORAGE
      if (this.activeTimer.intervalId) {
        clearInterval(this.activeTimer.intervalId);
      }
      const now = new Date();
      const startStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const nowTime = Date.now();

      localStorage.setItem('mpa_active_work_timer', JSON.stringify({
        compId: compId,
        projId: this.selectedProjectId,
        startTime: nowTime,
        startTimeStr: startStr,
        operator: AUTH.activeOperator.name
      }));

      this.activeTimer = {
        compId: compId,
        projId: this.selectedProjectId,
        startTime: nowTime,
        startTimeStr: startStr,
        elapsedSeconds: 0,
        intervalId: setInterval(() => {
          this.activeTimer.elapsedSeconds = Math.floor((Date.now() - this.activeTimer.startTime) / 1000);
          const btn = document.getElementById('btn-toggle-work-timer');
          if (btn && btn.dataset.timerCompId === compId) {
            btn.textContent = `⏱ IN CORSO: ${this.formatTimerTime(this.activeTimer.elapsedSeconds)} [ STOP & SALVA ]`;
          }
        }, 1000)
      };

      DB.logAuditAction({
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
  }

  // --- MENU CONTESTUALE TASTO DESTRO ---

  renderContextMenu() {
    return `<div id="app-context-menu" class="context-menu" style="display:none;"></div>`;
  }

  showContextMenu(x, y, items, title = 'OPZIONI') {
    const menu = document.getElementById('app-context-menu');
    if (!menu) return;

    let html = `
      <div style="padding:6px 14px 4px; font-size:10px; font-family:var(--font-mono); color:var(--text-muted); border-bottom:var(--glass-border-light); text-transform:uppercase;">
        ${title}
      </div>
    `;

    items.forEach((item, idx) => {
      if (item.separator) {
        html += `<div style="height:1px; background:rgba(255,255,255,0.08); margin:4px 0;"></div>`;
      } else {
        html += `
          <div class="context-item ${item.isDestructive ? 'destructive' : ''}" data-context-index="${idx}">
            ${item.icon ? `<span style="font-size:12px;">${item.icon}</span>` : ''}
            <span>${item.label}</span>
          </div>
        `;
      }
    });

    menu.innerHTML = html;
    menu.style.display = 'block';

    const menuWidth = 220;
    const menuHeight = menu.offsetHeight || 160;
    const finalX = (x + menuWidth > window.innerWidth) ? (window.innerWidth - menuWidth - 10) : x;
    const finalY = (y + menuHeight > window.innerHeight) ? (window.innerHeight - menuHeight - 10) : y;

    menu.style.left = `${finalX}px`;
    menu.style.top = `${finalY}px`;

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(menu, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.12, ease: 'power2.out' });
    }

    items.forEach((item, idx) => {
      if (!item.separator) {
        const el = menu.querySelector(`[data-context-index="${idx}"]`);
        if (el) {
          el.addEventListener('click', () => {
            this.hideContextMenu();
            if (typeof item.action === 'function') item.action();
          });
        }
      }
    });
  }

  hideContextMenu() {
    const menu = document.getElementById('app-context-menu');
    if (menu) menu.style.display = 'none';
  }

  // --- POPUP DI CONFERMA A TEMA LIQUID GLASS ---

  renderConfirmModal() {
    return `
      <div id="modal-confirm-action" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:440px;">
          <div class="modal-header">
            <h3 id="confirm-modal-title">CONFERMA OPERAZIONE</h3>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-message" style="font-size:12px; line-height:1.6; color:var(--text-secondary); font-family:var(--font-mono);"></p>
          </div>
          <div class="modal-footer" style="justify-content:flex-end; gap:10px;">
            <button class="btn-outline-white font-mono" id="btn-confirm-cancel">ANNULLA</button>
            <button class="btn-solid-white font-mono" id="btn-confirm-accept">CONFERMA</button>
          </div>
        </div>
      </div>
    `;
  }

  showConfirmModal({ title, message, confirmText = 'CONFERMA', cancelText = 'ANNULLA', isDestructive = false, onConfirm }) {
    const modal = document.getElementById('modal-confirm-action');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const acceptBtn = document.getElementById('btn-confirm-accept');
    const cancelBtn = document.getElementById('btn-confirm-cancel');

    if (!modal || !titleEl || !msgEl || !acceptBtn || !cancelBtn) return;

    titleEl.textContent = title;
    msgEl.innerHTML = message;
    acceptBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    if (isDestructive) {
      acceptBtn.style.background = '#FF3333';
      acceptBtn.style.color = '#FFFFFF';
    } else {
      acceptBtn.style.background = '#FFFFFF';
      acceptBtn.style.color = '#000000';
    }

    if (!cancelText) {
      cancelBtn.style.display = 'none';
    } else {
      cancelBtn.style.display = 'inline-block';
    }

    this.confirmModalCallback = onConfirm;
    modal.style.display = 'flex';

    if (typeof gsap !== 'undefined') {
      const card = modal.querySelector('.modal-box');
      if (card) {
        gsap.fromTo(card, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: 'power2.out' });
      }
    }
  }

  closeConfirmModal() {
    const modal = document.getElementById('modal-confirm-action');
    if (!modal) return;
    this.confirmModalCallback = null;
    modal.style.display = 'none';
  }

  // --- CONFERMA SPUNTA PEZZI & FASI (CON GESTIONE TUTTI GLI EDGE CASES) ---

  confirmToggleMoral(compId, moralId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    if (!comp) return;
    const moral = (comp.morali || []).find(m => m.id === moralId);
    if (!moral) return;

    const op = AUTH.activeOperator;
    const isChecking = !moral.checked;

    if (isChecking) {
      this.showConfirmModal({
        title: 'CONFERMA SPUNTA TAGLIO',
        message: `Confermi l'avvenuto taglio del pezzo <strong>${moral.desc}</strong> (L. ${moral.length} mm · Q.tà ${moral.qty}) per conto dell'operatore <strong style="color:${this.getOperatorColor(op.name)};">${op.name}</strong>?`,
        confirmText: 'CONFERMA TAGLIO',
        cancelText: 'ANNULLA',
        onConfirm: () => {
          this.toggleMoral(compId, moralId, op.name);
        }
      });
    } else {
      // Casistica Cross-Operator: Il pezzo è stato tagliato da un altro operatore?
      const checkedBy = moral.checkedBy || 'un altro operatore';
      const isDifferent = checkedBy.toLowerCase() !== op.name.toLowerCase();
      const isAlreadyAssembled = comp.assemblyStatus === 'completed';

      let warningMsg = `Vuoi ripristinare il pezzo <strong>${moral.desc}</strong> (L. ${moral.length} mm) come non ancora tagliato?`;
      if (isDifferent) {
        warningMsg = `⚠️ <strong>VERIFICA ATTRIBUZIONE:</strong> Questo pezzo risulta tagliato e firmato da <strong style="color:${this.getOperatorColor(checkedBy)};">${checkedBy}</strong> (${moral.checkedDate || ''} ${moral.checkedAt || ''}).<br><br>Confermi di voler annullare la spunta per mano di <strong>${op.name}</strong>?`;
      }
      if (isAlreadyAssembled) {
        warningMsg += `<br><br><span style="color:#FFAE42; font-weight:700;">⚠️ ATTENZIONE GATEKEEPER:</span> Questo telaio risulta già MONTATO al banco. Ripristinando questo pezzo, anche la fase di montaggio verrà automaticamente riaperta!`;
      }

      this.showConfirmModal({
        title: isDifferent ? '⚠️ ANNULLA SPUNTA (ALTRO OPERATORE)' : 'ANNULLA SPUNTA PEZZO',
        message: warningMsg,
        confirmText: 'RIPRISTINA PEZZO',
        cancelText: 'ANNULLA',
        isDestructive: true,
        onConfirm: () => {
          this.toggleMoral(compId, moralId, null);
        }
      });
    }
  }

  confirmToggleCut(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    if (!comp) return;
    const op = AUTH.activeOperator;
    const isDone = comp.cutStatus === 'completed';

    if (!isDone) {
      const uncutCount = (comp.morali || []).filter(m => !m.checked).length;
      this.showConfirmModal({
        title: 'CONFERMA COMPLETAMENTO TAGLIO',
        message: `Confermi che tutti i pezzi del telaio <strong>${comp.code} - ${comp.title}</strong> sono stati tagliati e verificati da <strong style="color:${this.getOperatorColor(op.name)};">${op.name}</strong>?<br><br>${uncutCount > 0 ? `I <strong>${uncutCount} morali</strong> non ancora spuntati verranno automaticamente contrassegnati come tagliati e firmati da ${op.name}.` : 'Tutti i pezzi risultano già spuntati.'}`,
        confirmText: 'SEGNA TUTTO TAGLIATO',
        cancelText: 'ANNULLA',
        onConfirm: () => {
          // Segna tutti i morali residui come tagliati
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;
          (comp.morali || []).forEach(m => {
            if (!m.checked) {
              m.checked = true;
              m.checkedBy = op.name;
              m.checkedAt = timeStr;
              m.checkedDate = dateStr;
            }
          });
          DB.updateOperationStatus(this.selectedProjectId, compId, 'cut', 'completed', op.name);
          this.broadcastDataUpdate();
          this.sound.playSuccess();
          this.render();
        }
      });
    } else {
      this.showConfirmModal({
        title: 'RIAPRI FASE DI TAGLIO',
        message: `Vuoi riaprire la fase di taglio per il telaio <strong>${comp.code}</strong>?<br><br>I pezzi rimarranno spuntati, ma lo stato del telaio tornerà 'In Lavorazione'.`,
        confirmText: 'RIAPRI TAGLIO',
        cancelText: 'ANNULLA',
        isDestructive: true,
        onConfirm: () => {
          DB.updateOperationStatus(this.selectedProjectId, compId, 'cut', 'wip', op.name);
          this.broadcastDataUpdate();
          this.render();
        }
      });
    }
  }

  confirmToggleAssembly(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    if (!comp) return;

    // Vincolo Bloccante Gatekeeper: verifica che tutti i morali siano stati tagliati
    const uncompleted = (comp.morali || []).filter(m => !m.checked);
    if (comp.assemblyStatus !== 'completed' && uncompleted.length > 0) {
      const missingList = uncompleted.slice(0, 4).map(m => `• NR ${m.qty} L. ${m.length} mm (${m.desc})`).join('<br>');
      this.showConfirmModal({
        title: '🛑 BLOCCO GATEKEEPER PRODUZIONE',
        message: `Impossibile completare il montaggio al banco.<br><br>Risultano ancora <strong>${uncompleted.length} morali non tagliati</strong> alla troncatrice:<br><br><div style="padding:8px 12px; background:rgba(255,68,68,0.1); border-left:3px solid #FF4444; font-size:11px;">${missingList}${uncompleted.length > 4 ? '<br>• ...ed altri pezzi' : ''}</div><br>Spunta tutti i pezzi prima di procedere all'assemblaggio.`,
        confirmText: 'HO CAPITO',
        cancelText: '',
        isDestructive: true,
        onConfirm: () => {}
      });
      return;
    }

    const op = AUTH.activeOperator;
    const isDone = comp.assemblyStatus === 'completed';

    if (!isDone) {
      this.showConfirmModal({
        title: 'CONFERMA MONTAGGIO AL BANCO',
        message: `Confermi l'avvenuto assemblaggio strutturale e collaudo del telaio <strong>${comp.code} - ${comp.title}</strong> completato da <strong style="color:${this.getOperatorColor(op.name)};">${op.name}</strong>?`,
        confirmText: 'CONFERMA MONTAGGIO',
        cancelText: 'ANNULLA',
        onConfirm: () => {
          DB.updateOperationStatus(this.selectedProjectId, compId, 'assembly', 'completed', op.name);
          this.broadcastDataUpdate();
          this.sound.playSuccess();
          this.celebrateCompletion(false);
          this.render();
        }
      });
    } else {
      this.showConfirmModal({
        title: 'RIAPRI FASE DI MONTAGGIO',
        message: `Vuoi riaprire la fase di montaggio al banco per il telaio <strong>${comp.code}</strong>?`,
        confirmText: 'RIAPRI BANCO',
        cancelText: 'ANNULLA',
        isDestructive: true,
        onConfirm: () => {
          DB.updateOperationStatus(this.selectedProjectId, compId, 'assembly', 'wip', op.name);
          this.broadcastDataUpdate();
          this.render();
        }
      });
    }
  }

  // --- SPUNTA MORALE CON ATTRIBUZIONE OPERATORE E DATA ---

  toggleMoral(compId, moralId, operatorName = 'Francesca') {
    this.sound.playTick();
    DB.toggleMoral(this.selectedProjectId, compId, moralId, operatorName);
    this.broadcastDataUpdate();

    const comp = DB.getComponent(this.selectedProjectId, compId);
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!comp || !proj) return;

    // Aggiorna l'elemento riga morale senza distruggere lo zoom CAD
    const item = document.querySelector(`[data-moral-comp-id="${compId}"][data-moral-id="${moralId}"]`);
    if (item) {
      const moral = comp.morali.find(m => m.id === moralId);
      if (moral) {
        if (moral.checked) {
          item.classList.add('checked');
          const chk = item.querySelector('.moral-checkbox');
          if (chk) chk.textContent = '✓';

          const tag = item.querySelector('.moral-operator-tag');
          if (tag) {
            tag.style.opacity = '1';
            tag.innerHTML = `
              <span class="badge-op-tag ${this.getOperatorBadgeClass(moral.checkedBy)}">${(moral.checkedBy || 'FATTO').toUpperCase()}</span>
              <span>• ${moral.checkedDate || ''} ${moral.checkedAt || ''}</span>
            `;
          }
        } else {
          item.classList.remove('checked');
          const chk = item.querySelector('.moral-checkbox');
          if (chk) chk.textContent = '';

          const tag = item.querySelector('.moral-operator-tag');
          if (tag) {
            tag.style.opacity = '0.45';
            tag.innerHTML = `<span>IN ATTESA DI TAGLIO</span>`;
          }
        }
      }
    }

    // Aggiorna conteggio distinta nella workstation
    const morali = comp.morali || [];
    const checkedCount = morali.filter(m => m.checked).length;
    const totalCount = morali.length;
    const statusEl = document.getElementById('workstation-morali-status-text');
    if (statusEl) {
      statusEl.textContent = `${checkedCount}/${totalCount} PEZZI · ${totalCount > 0 && checkedCount === totalCount ? 'TUTTI TAGLIATI' : 'IN LAVORAZIONE'}`;
    }

    // Aggiorna conteggio scheda componente nella barra sinistra
    const compCard = document.querySelector(`.component-item-card[data-select-component-id="${compId}"]`);
    if (compCard) {
      const countMeta = compCard.querySelector('.comp-card-meta span:first-child');
      if (countMeta) countMeta.textContent = `${checkedCount}/${totalCount} PEZZI TAGLIATI`;
    }

    // Ricalcola e anima la barra e percentuale della commessa
    const progress = DB.calculateProjectProgress(proj);
    this.updateProjectProgressBar(this.selectedProjectId, progress);

    this.updateLiveTicker();
    this.updateNotificationBadge();

    // Celebrazione particelle al completamento!
    if (totalCount > 0 && checkedCount === totalCount) {
      if (progress === 100) {
        this.celebrateCompletion(true); // Commessa al 100%
      } else {
        this.celebrateCompletion(false); // Telaio singolo completato
      }
    }
  }

  updateProjectProgressBar(projId, targetPercent) {
    // Aggiorna Livello 1 (Lista Commesse)
    const barL1 = document.getElementById(`proj-progress-bar-${projId}`);
    const valL1 = document.getElementById(`proj-progress-val-${projId}`);
    if (barL1) barL1.style.width = `${targetPercent}%`;
    if (valL1) valL1.textContent = `${targetPercent}%`;

    // Aggiorna Livello 2 (Intestazione Commessa attiva)
    const barL2 = document.getElementById('comp-panel-progress-bar');
    const valL2 = document.getElementById('comp-panel-progress-val');
    if (barL2) barL2.style.width = `${targetPercent}%`;
    if (valL2) valL2.textContent = `${targetPercent}%`;
  }

  celebrateCompletion(isProjectTotal = false) {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: isProjectTotal ? 160 : 60,
        spread: isProjectTotal ? 100 : 50,
        origin: { y: 0.65 },
        colors: ['#FFFFFF', '#C0C0C0', '#888888', '#00FF88', '#00E5FF']
      });
    }
    this.sound.playSuccess();
  }

  // --- TRANSIZIONI 3D DI LIVELLO (PROGETTI <-> COMPONENTI <-> WORKSTATION) ---

  switchToComponents(projectId) {
    this.selectedProjectId = projectId;
    this.currentNavLevel = 'components';
    this.sound.playSwitch();

    const projectsPanel = document.querySelector('.nav-panel-projects');
    const componentsPanel = document.querySelector('.nav-panel-components');

    if (projectsPanel && componentsPanel) {
      componentsPanel.innerHTML = this.renderComponentsPanelContent();

      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
          onComplete: () => {
            projectsPanel.className = 'nav-panel nav-panel-projects state-hidden';
            componentsPanel.className = 'nav-panel nav-panel-components state-active';
            this.bindComponentPanelEvents();
            this.initAtroposCards();
          }
        });

        tl.to(projectsPanel, {
          x: '-100%',
          rotateY: 15,
          z: -180,
          opacity: 0,
          duration: 0.32,
          ease: 'power3.in'
        });

        tl.fromTo(componentsPanel, {
          x: '100%',
          rotateY: -15,
          z: -180,
          opacity: 0,
          display: 'flex'
        }, {
          x: '0%',
          rotateY: 0,
          z: 0,
          opacity: 1,
          duration: 0.38,
          ease: 'power3.out'
        }, '-=0.12');
      } else {
        projectsPanel.className = 'nav-panel nav-panel-projects state-hidden';
        componentsPanel.className = 'nav-panel nav-panel-components state-active';
        this.bindComponentPanelEvents();
        this.initAtroposCards();
      }
    }

    const mainStage = document.getElementById('main-stage');
    if (mainStage) {
      mainStage.innerHTML = this.renderMainStageContent();
      this.bindWorkstationEvents();
    }
  }

  switchToProjects() {
    this.currentNavLevel = 'projects';
    this.sound.playSwitch();

    const projectsPanel = document.querySelector('.nav-panel-projects');
    const componentsPanel = document.querySelector('.nav-panel-components');

    if (projectsPanel && componentsPanel) {
      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
          onComplete: () => {
            componentsPanel.className = 'nav-panel nav-panel-components state-hidden';
            projectsPanel.className = 'nav-panel nav-panel-projects state-active';
            this.bindProjectCardsEvents();
            this.initAtroposCards();
          }
        });

        tl.to(componentsPanel, {
          x: '100%',
          rotateY: -15,
          z: -180,
          opacity: 0,
          duration: 0.3,
          ease: 'power3.in'
        });

        tl.fromTo(projectsPanel, {
          x: '-100%',
          rotateY: 15,
          z: -180,
          opacity: 0,
          display: 'flex'
        }, {
          x: '0%',
          rotateY: 0,
          z: 0,
          opacity: 1,
          duration: 0.36,
          ease: 'power3.out'
        }, '-=0.1');
      } else {
        componentsPanel.className = 'nav-panel nav-panel-components state-hidden';
        projectsPanel.className = 'nav-panel nav-panel-projects state-active';
        this.bindProjectCardsEvents();
        this.initAtroposCards();
      }
    }
  }

  selectComponent(compId) {
    if (this.selectedComponentId === compId) return;
    this.selectedComponentId = compId;
    this.sound.playTick();

    // Reset Zoom e Pan CAD
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;

    // Aggiorna stato attivo nella barra laterale
    document.querySelectorAll('.component-item-card').forEach(c => {
      c.classList.toggle('active', c.dataset.selectComponentId === compId);
    });

    const mainStage = document.getElementById('main-stage');
    if (mainStage) {
      mainStage.innerHTML = this.renderMainStageContent();
      this.bindWorkstationEvents();

      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.component-workstation', 
          { opacity: 0, scale: 0.98, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'power2.out' }
        );
      }
    }
  }

  closeWorkstation() {
    this.selectedComponentId = null;
    this.sound.playSwitch();

    document.querySelectorAll('.component-item-card').forEach(c => c.classList.remove('active'));

    const mainStage = document.getElementById('main-stage');
    if (mainStage) {
      if (typeof gsap !== 'undefined') {
        gsap.to('.component-workstation', {
          opacity: 0,
          scale: 0.98,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            mainStage.innerHTML = this.renderMainStageContent();
            this.bindWorkstationEvents();
            gsap.fromTo('.empty-stage-hud', { opacity: 0 }, { opacity: 1, duration: 0.3 });
          }
        });
      } else {
        mainStage.innerHTML = this.renderMainStageContent();
        this.bindWorkstationEvents();
      }
    }
  }

  // --- ATROPOS 3D PARALLAX TILT ---

  initAtroposCards() {
    if (this.atroposInstances && this.atroposInstances.length) {
      this.atroposInstances.forEach(inst => {
        try { inst.destroy(); } catch (e) {}
      });
      this.atroposInstances = [];
    }

    if (typeof Atropos === 'undefined') return;

    document.querySelectorAll('.atropos-card-wrapper').forEach(el => {
      try {
        const inst = Atropos({
          el: el,
          activeOffset: 30,
          shadow: false,
          highlight: true,
          rotateXMax: 7,
          rotateYMax: 7,
          duration: 350
        });
        this.atroposInstances.push(inst);
      } catch (e) {}
    });
  }

  // --- BINDING GLOBALE DEGLI EVENTI ---

  bindEvents() {
    // Switch Audio Meccanico
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const active = this.sound.toggle();
        btnSound.textContent = active ? 'AUDIO: ON' : 'AUDIO: OFF';
        btnSound.classList.toggle('muted', !active);
      });
    }

    // Live Ticker Bar Cliccabile -> Apre Drawer "Cosa fa chi"
    const tickerBar = document.getElementById('live-ticker-bar');
    if (tickerBar) {
      tickerBar.addEventListener('click', () => {
        this.openActivityDrawer();
      });
    }

    // Tasto "COSA FA CHI" Bell -> Apre Drawer
    const btnNotifBell = document.getElementById('btn-open-activity-drawer');
    if (btnNotifBell) {
      btnNotifBell.addEventListener('click', () => {
        this.openActivityDrawer();
      });
    }

    // Tasto "RAPPORTINO GIORNALIERO" -> Apre Modal Rapportino A4
    const btnOpenRap = document.getElementById('btn-open-rapportino');
    if (btnOpenRap) {
      btnOpenRap.addEventListener('click', () => {
        this.openRapportinoModal();
      });
    }

    this.bindProjectCardsEvents();
    this.bindBackBtnEvent();
    this.bindComponentPanelEvents();
    this.bindWorkstationEvents();
    this.bindAdminAndModalsEvents();
    this.bindActivityDrawerEvents();
    this.bindRapportinoEvents();
    this.bindAuditLogEvents();

    // Click fuori chiude menu contestuale
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#app-context-menu')) {
        this.hideContextMenu();
      }
    });
  }

  bindProjectCardsEvents() {
    document.querySelectorAll('.project-summary-card').forEach(card => {
      const projId = card.dataset.projectId;

      card.addEventListener('click', () => {
        this.switchToComponents(projId);
      });

      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.contextMenuTarget = { type: 'project', id: projId };

        this.showContextMenu(e.clientX, e.clientY, [
          {
            label: 'APRI COMMESSA',
            icon: '📂',
            action: () => this.switchToComponents(projId)
          },
          {
            label: 'MODIFICA DATI & SCADENZA',
            icon: '✏️',
            action: () => {
              AUTH.requireAdmin(() => this.openEditProjectModal(projId), 'Modifica Commessa');
            }
          },
          {
            label: 'CARICA / AGGIORNA PDF SEMA',
            icon: '📄',
            action: () => {
              AUTH.requireAdmin(() => this.openUploadPdfModal(projId), 'Aggiornamento PDF CAD');
            }
          },
          { separator: true },
          {
            label: 'ELIMINA COMMESSA',
            icon: '🗑️',
            isDestructive: true,
            action: () => {
              AUTH.requireAdmin(() => {
                const proj = DB.getProjectById(projId);
                this.showConfirmModal({
                  title: 'ELIMINAZIONE COMMESSA',
                  message: `Sei sicuro di voler eliminare la commessa <strong>${proj ? proj.title : projId}</strong>?<br><br>L'operazione eliminerà tutti i telai e i dati di avanzamento.`,
                  confirmText: 'ELIMINA DEFINITIVAMENTE',
                  cancelText: 'ANNULLA',
                  isDestructive: true,
                  onConfirm: () => {
                    DB.deleteProject(projId);
                    this.broadcastDataUpdate();
                    this.sound.playTick();
                    this.render();
                  }
                });
              }, 'Eliminazione Commessa');
            }
          }
        ], 'OPZIONI COMMESSA');
      });
    });

    const timesheetBtn = document.getElementById('btn-open-timesheet');
    if (timesheetBtn) {
      timesheetBtn.addEventListener('click', () => {
        this.populateTimesheetModal();
        document.getElementById('modal-timesheet').style.display = 'flex';
      });
    }
  }

  bindBackBtnEvent() {
    const backBtn = document.getElementById('btn-back-to-projects');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.switchToProjects());
    }
  }

  bindComponentPanelEvents() {
    document.querySelectorAll('.component-item-card').forEach(card => {
      const compId = card.dataset.selectComponentId;

      card.addEventListener('click', () => {
        this.selectComponent(compId);
      });

      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.contextMenuTarget = { type: 'component', id: compId };

        this.showContextMenu(e.clientX, e.clientY, [
          {
            label: 'APRI TAVOLA CAD',
            icon: '📐',
            action: () => this.selectComponent(compId)
          },
          {
            label: 'ETICHETTA QR CANTIERE',
            icon: '🖨️',
            action: () => this.openQrLabelModal(compId)
          },
          {
            label: 'MODIFICA TELAIO',
            icon: '✏️',
            action: () => {
              AUTH.requireAdmin(() => this.openEditComponentModal(compId), 'Modifica Telaio');
            }
          },
          { separator: true },
          {
            label: 'ELIMINA TELAIO',
            icon: '🗑️',
            isDestructive: true,
            action: () => {
              AUTH.requireAdmin(() => {
                const comp = DB.getComponent(this.selectedProjectId, compId);
                this.showConfirmModal({
                  title: 'ELIMINA TELAIO',
                  message: `Vuoi eliminare il telaio <strong>${comp ? comp.code : compId}</strong> da questa commessa?`,
                  confirmText: 'ELIMINA',
                  isDestructive: true,
                  onConfirm: () => {
                    DB.deleteComponent(this.selectedProjectId, compId);
                    if (this.selectedComponentId === compId) {
                      this.selectedComponentId = null;
                    }
                    this.broadcastDataUpdate();
                    this.sound.playTick();
                    this.render();
                  }
                });
              }, 'Eliminazione Telaio');
            }
          }
        ], 'OPZIONI TELAIO');
      });
    });

    const filterInput = document.getElementById('input-filter-components');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        this.compSearchQuery = e.target.value;
        const compPanel = document.querySelector('.nav-panel-components');
        if (compPanel) {
          compPanel.innerHTML = this.renderComponentsPanelContent();
          this.bindComponentPanelEvents();
          this.initAtroposCards();
          const newInput = document.getElementById('input-filter-components');
          if (newInput) {
            newInput.focus();
            newInput.selectionStart = newInput.selectionEnd = newInput.value.length;
          }
        }
      });
    }

    const btnBatchSaw = document.getElementById('btn-open-batch-saw');
    if (btnBatchSaw) {
      btnBatchSaw.addEventListener('click', () => {
        this.openBatchSawModal();
      });
    }

    const editProjBtn = document.getElementById('btn-edit-active-proj');
    if (editProjBtn) {
      editProjBtn.addEventListener('click', () => {
        AUTH.requireAdmin(() => this.openEditProjectModal(this.selectedProjectId), 'Modifica Commessa');
      });
    }
  }

  bindWorkstationEvents() {
    const closeWorkstationBtn = document.getElementById('btn-close-workstation');
    if (closeWorkstationBtn) {
      closeWorkstationBtn.addEventListener('click', () => {
        this.closeWorkstation();
      });
    }

    const btnTimer = document.getElementById('btn-toggle-work-timer');
    if (btnTimer) {
      btnTimer.addEventListener('click', () => {
        const compId = btnTimer.dataset.timerCompId;
        this.toggleWorkTimer(compId);
      });
    }

    const btnQr = document.getElementById('btn-print-qr-label');
    if (btnQr) {
      btnQr.addEventListener('click', () => {
        const compId = btnQr.dataset.qrCompId;
        this.openQrLabelModal(compId);
      });
    }

    // Toggle Taglio con Popup Conferma
    const btnToggleCut = document.getElementById('btn-action-toggle-cut');
    if (btnToggleCut) {
      btnToggleCut.addEventListener('click', () => {
        const compId = btnToggleCut.dataset.actionToggleCut;
        this.confirmToggleCut(compId);
      });
    }

    // Toggle Montaggio con Blocco Gatekeeper & Popup Conferma
    const btnToggleAssembly = document.getElementById('btn-action-toggle-assembly');
    if (btnToggleAssembly) {
      btnToggleAssembly.addEventListener('click', () => {
        const compId = btnToggleAssembly.dataset.actionToggleAssembly;
        this.confirmToggleAssembly(compId);
      });
    }

    // Clic su riga morale -> Popup di Conferma Spunta
    document.querySelectorAll('.moral-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.moral-delete-btn')) return;
        const compId = item.dataset.moralCompId;
        const moralId = item.dataset.moralId;
        this.confirmToggleMoral(compId, moralId);
      });
    });

    // Eliminazione Morale (Richiede PIN Admin Michele)
    document.querySelectorAll('.moral-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const compId = btn.dataset.deleteMoralCompId;
        const moralId = btn.dataset.deleteMoralId;
        AUTH.requireAdmin(() => {
          this.showConfirmModal({
            title: 'ELIMINA PEZZO',
            message: 'Vuoi eliminare questo elemento dalla distinta di taglio?',
            confirmText: 'ELIMINA',
            isDestructive: true,
            onConfirm: () => {
              DB.deleteMoral(this.selectedProjectId, compId, moralId);
              this.broadcastDataUpdate();
              this.sound.playTick();
              this.render();
            }
          });
        }, 'Eliminazione Morale');
      });
    });

    // Aggiungi Morale a Matita (Richiede PIN Admin Michele)
    const btnAddMoral = document.querySelector('.btn-add-moral');
    if (btnAddMoral) {
      btnAddMoral.addEventListener('click', () => {
        AUTH.requireAdmin(() => {
          document.getElementById('modal-add-moral').style.display = 'flex';
        }, 'Aggiunta Morale');
      });
    }

    // Navigazione Rapida Telaio Precedente / Successivo
    document.querySelectorAll('.btn-nav-sibling-comp[data-jump-comp-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextId = btn.dataset.jumpCompId;
        if (nextId) this.selectComponent(nextId);
      });
    });

    // Filtri Rapidi Morali (Tutti / Da Tagliare / Tagliati)
    document.querySelectorAll('.btn-filter-morali').forEach(btn => {
      btn.addEventListener('click', () => {
        this.moralFilterTab = btn.dataset.moralFilter;
        this.sound.playTick();
        const mainStage = document.getElementById('main-stage');
        if (mainStage) {
          mainStage.innerHTML = this.renderMainStageContent();
          this.bindWorkstationEvents();
        }
      });
    });

    // Riassegnazione Rapida Operatore Fase (Click su Badge OP. TAGLIO / OP. BANCO)
    document.querySelectorAll('.btn-quick-reassign-op').forEach(btn => {
      btn.addEventListener('click', () => {
        const phase = btn.dataset.reassignPhase;
        const compId = btn.dataset.reassignCompId;
        const comp = DB.getComponent(this.selectedProjectId, compId);
        if (!comp) return;

        const operators = DB.getOperators();
        const phaseLabel = phase === 'cut' ? 'TAGLIO TRONCATRICE' : 'MONTAGGIO BANCO';

        this.showConfirmModal({
          title: `ASSEGNA OPERATORE: ${phaseLabel}`,
          message: `
            Seleziona l'operatore incaricato di questa fase per il telaio <strong>${comp.code}</strong>:<br><br>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="quick-reassign-op-box">
              ${operators.map(o => `
                <button class="btn-outline-white quick-op-select-btn" data-assign-name="${o.name}" style="padding:10px; font-family:var(--font-mono); font-size:11px; text-align:left; border-left:3px solid ${this.getOperatorColor(o.name)};">
                  <div style="font-weight:700; color:#fff;">${o.name}</div>
                  <div style="font-size:9px; color:var(--text-muted);">${o.role || 'Operatore'}</div>
                </button>
              `).join('')}
            </div>
          `,
          confirmText: 'CHIUDI',
          cancelText: '',
          onConfirm: () => {}
        });

        // Click handler sui bottoni operatore dentro il modal
        setTimeout(() => {
          document.querySelectorAll('.quick-op-select-btn').forEach(b => {
            b.addEventListener('click', () => {
              const opName = b.dataset.assignName;
              DB.assignComponentOperator(this.selectedProjectId, compId, phase, opName);
              this.closeConfirmModal();
              this.broadcastDataUpdate();
              this.sound.playSuccess();
              this.render();
            });
          });
        }, 50);
      });
    });

    this.bindCadZoomEvents();
  }

  // --- CONTROLLI ZOOM & PAN INTERATTIVO BLUEPRINT CAD ---

  bindCadZoomEvents() {
    const img = document.getElementById('cad-drawing-preview');
    const container = document.getElementById('cad-drawing-container');
    if (!img || !container) return;

    const applyTransform = () => {
      img.style.transform = `scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px)`;
    };

    const zoomInBtn = document.getElementById('btn-zoom-in');
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.zoomLevel = Math.min(3.5, this.zoomLevel + 0.25);
        this.sound.playTick();
        applyTransform();
      });
    }

    const zoomOutBtn = document.getElementById('btn-zoom-out');
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
        this.sound.playTick();
        applyTransform();
      });
    }

    const zoomResetBtn = document.getElementById('btn-zoom-reset');
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.sound.playTick();
        applyTransform();
      });
    }

    const zoomInvertBtn = document.getElementById('btn-zoom-invert');
    if (zoomInvertBtn) {
      zoomInvertBtn.addEventListener('click', () => {
        this.isCadInverted = !this.isCadInverted;
        container.classList.toggle('cad-inverted', this.isCadInverted);
        zoomInvertBtn.style.background = this.isCadInverted ? '#FFFFFF' : '';
        zoomInvertBtn.style.color = this.isCadInverted ? '#000000' : '';
        this.sound.playTick();
      });
    }

    const zoomFullscreenBtn = document.getElementById('btn-zoom-fullscreen');
    if (zoomFullscreenBtn) {
      zoomFullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // --- ZOOM CON ROTELLINA DEL MOUSE (FLUIDO 0.4x - 4.0x) ---
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      this.zoomLevel = Math.min(4.0, Math.max(0.4, this.zoomLevel + delta));
      applyTransform();
    }, { passive: false });

    // --- PAN TRASCINABILE CON MOUSE (DRAG & DROP) ---
    container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.cad-zoom-bar')) return;
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        container.style.cursor = 'grab';
      }
    });

    // --- PAN TRASCINABILE CON IL DITO SU TABLET & TOUCHSCREEN ---
    container.addEventListener('touchstart', (e) => {
      if (e.target.closest('.cad-zoom-bar')) return;
      if (e.touches.length === 1) {
        this.isPanning = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!this.isPanning || e.touches.length !== 1) return;
      this.panX = e.touches[0].clientX - this.startX;
      this.panY = e.touches[0].clientY - this.startY;
      applyTransform();
    }, { passive: true });

    container.addEventListener('touchend', () => {
      this.isPanning = false;
    });
  }

  // --- DISTINTA CUMULATIVA COMMESSA & BATCH TRONCATRICE ---

  openBatchSawModal() {
    const project = DB.getProjectById(this.selectedProjectId);
    if (!project) return;

    const list = DB.getBatchCuttingList(this.selectedProjectId);
    const nesting = DB.calculate1DNesting(this.selectedProjectId, 6000);

    const modal = document.getElementById('modal-batch-saw');
    if (!modal) return;

    const titleEl = document.getElementById('batch-saw-proj-title');
    if (titleEl) {
      titleEl.textContent = `${project.code} · ${project.title}`;
    }

    const summaryEl = document.getElementById('batch-saw-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="hud-meta-row font-mono" style="margin-top:0; justify-content:flex-start; gap:20px;">
          <span>PEZZI TOTALI: <strong style="color:#FFFFFF;">${nesting.totalPieces}</strong></span>
          <span>BARRE 6m NECESSARIE: <strong style="color:#FFFFFF;">${nesting.totalRawBarsNeeded}</strong> (${(nesting.totalRawBarsNeeded * 6).toFixed(1)}m)</span>
          <span>LUNGHEZZA NETTA: <strong style="color:#FFFFFF;">${(nesting.totalLinearMeters).toFixed(2)}m</strong></span>
          <span>SFRIDO STIMATO: <strong style="color:#00FF88;">${nesting.wastePercentage}%</strong></span>
        </div>
      `;
    }

    const tbody = document.getElementById('batch-saw-tbody');
    if (tbody) {
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">Nessun morale presente nella commessa.</td></tr>`;
      } else {
        tbody.innerHTML = list.map(item => `
          <tr>
            <td style="font-weight:700; color:#FFFFFF;">${item.desc}</td>
            <td style="color:#00E5FF; font-weight:700;">${item.lengthStr} MM</td>
            <td style="text-align:center;">${item.totalQty}</td>
            <td style="text-align:center; color:${item.checkedQty === item.totalQty ? '#00FF88' : '#FFAE42'};">
              ${item.checkedQty} / ${item.totalQty}
            </td>
            <td style="font-size:10px; color:var(--text-muted);">${item.usedIn}</td>
          </tr>
        `).join('');
      }
    }

    modal.style.display = 'flex';
  }

  // --- ETICHETTA QR TECNICA PER CANTIERE ---

  openQrLabelModal(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!comp || !proj) return;

    const modal = document.getElementById('modal-qr-label');
    if (!modal) return;

    document.getElementById('qr-label-code').textContent = comp.code;
    document.getElementById('qr-label-title').textContent = comp.title;
    document.getElementById('qr-label-project').textContent = `${proj.code} · ${proj.title}`;
    document.getElementById('qr-label-client').textContent = proj.client;
    document.getElementById('qr-label-meta').textContent = `PAGINA ${comp.pageNumber} · SEMA CAD 4.0`;

    const qrContainer = document.getElementById('qr-code-canvas-box');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      const payload = JSON.stringify({
        project: proj.code,
        component: comp.code,
        title: comp.title,
        status: comp.cutStatus,
        verification: 'MPA_CERTIFIED_OK'
      });
      qrContainer.innerHTML = this.generateQrSvg(payload);
    }

    modal.style.display = 'flex';
  }

  generateQrSvg(text) {
    if (typeof qrcode !== 'undefined') {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag(5, 0);
    }
    return `<div style="font-size:10px; font-family:var(--font-mono); padding:10px;">QR CODE ENGINE NON DISPONIBILE</div>`;
  }

  // --- TIMESHEET MODAL ---

  populateTimesheetModal() {
    const tbody = document.getElementById('timesheet-tbody');
    if (!tbody) return;

    const workLogs = DB.data.workLogs || [];
    if (workLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">Nessuna lavorazione registrata oggi.</td></tr>`;
      return;
    }

    tbody.innerHTML = workLogs.map(l => `
      <tr>
        <td>
          <div style="font-weight:700; color:#FFFFFF;">${l.projectName}</div>
          <div style="font-size:10px; color:var(--text-muted);">${l.componentCode}</div>
        </td>
        <td>${l.phase}</td>
        <td>
          <span class="badge-op-tag ${this.getOperatorBadgeClass(l.operator)}">${l.operator}</span>
        </td>
        <td>
          <div>${l.startTime} - ${l.endTime}</div>
          <div style="font-size:10px; color:var(--text-secondary);">${l.durationMinutes} minuti</div>
        </td>
        <td>
          <span class="status-pill status-done" style="padding:2px 6px;">${l.status}</span>
        </td>
      </tr>
    `).join('');
  }

  // --- GESTIONE DRAWER ATTIVITÀ "COSA FA CHI" ---

  bindActivityDrawerEvents() {
    const btnClose = document.getElementById('btn-close-activity-drawer');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeActivityDrawer());
    }

    const overlay = document.getElementById('drawer-activity');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeActivityDrawer();
      });
    }

    const btnMarkAll = document.getElementById('btn-mark-all-read');
    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', () => {
        this.markAllNotificationsRead();
      });
    }

    document.querySelectorAll('.drawer-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.drawer-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const op = btn.dataset.filterOp === 'all' ? null : btn.dataset.filterOp;
        this.activeFilterOp = op;
        this.renderActivityDrawerContent(op);
      });
    });
  }

  openActivityDrawer() {
    this.sound.playSwitch();
    const drawer = document.getElementById('drawer-activity');
    if (!drawer) return;
    drawer.style.display = 'flex';
    this.renderActivityDrawerContent(this.activeFilterOp);

    const panel = drawer.querySelector('.drawer-panel');
    if (typeof gsap !== 'undefined' && panel) {
      gsap.fromTo(panel, { x: '100%' }, { x: '0%', duration: 0.28, ease: 'power3.out' });
    }
  }

  closeActivityDrawer() {
    const drawer = document.getElementById('drawer-activity');
    if (!drawer) return;
    const panel = drawer.querySelector('.drawer-panel');
    if (typeof gsap !== 'undefined' && panel) {
      gsap.to(panel, {
        x: '100%',
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => { drawer.style.display = 'none'; }
      });
    } else {
      drawer.style.display = 'none';
    }
  }

  renderActivityDrawerContent(filterOp = null) {
    const body = document.getElementById('drawer-activity-body');
    if (!body) return;

    let notifs = (typeof DB !== 'undefined' && DB.getNotifications) ? DB.getNotifications() : [];

    if (filterOp) {
      notifs = notifs.filter(n => n.operatorName && n.operatorName.toLowerCase() === filterOp.toLowerCase());
    }

    if (notifs.length === 0) {
      body.innerHTML = `
        <div style="padding:40px 20px; text-align:center; color:var(--text-muted); font-size:11px; font-family:var(--font-mono);">
          Nessuna attività registrata per questo filtro.
        </div>
      `;
      return;
    }

    body.innerHTML = notifs.map(n => `
      <div class="activity-item type-${n.type || 'info'}" data-jump-comp-code="${n.componentCode || ''}" data-jump-proj-id="${n.projectId || ''}" style="cursor:pointer;" title="Clicca per aprire la tavola del telaio">
        <div class="activity-top">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge-op-tag ${this.getOperatorBadgeClass(n.operatorName)}">
              ${(n.operatorName || 'SISTEMA').toUpperCase()}
            </span>
            <span class="activity-title">${n.title}</span>
          </div>
          <span class="activity-time font-mono">${n.date ? n.date + ' ' : ''}${n.time || ''}</span>
        </div>
        <div class="activity-desc">${n.message}</div>
        ${n.componentCode && n.componentCode !== 'ADMIN' && n.componentCode !== 'TUTTI' ? `
          <div style="font-size:9px; font-family:var(--font-mono); color:#00E5FF; margin-top:3px;">
            → APRI SCHEDA ${n.componentCode}
          </div>
        ` : ''}
      </div>
    `).join('');

    // Listener per cliccare e saltare direttamente al telaio menzionato
    body.querySelectorAll('.activity-item').forEach(item => {
      item.addEventListener('click', () => {
        const compCode = item.dataset.jumpCompCode;
        const projId = item.dataset.jumpProjId;
        if (compCode && compCode !== 'ADMIN' && compCode !== 'TUTTI') {
          this.closeActivityDrawer();
          if (projId && projId !== this.selectedProjectId) {
            this.switchToComponents(projId);
          }
          const proj = DB.getProjectById(this.selectedProjectId);
          if (proj && proj.components) {
            const found = proj.components.find(c => c.code.toLowerCase().includes(compCode.toLowerCase()) || compCode.toLowerCase().includes(c.code.toLowerCase()));
            if (found) {
              this.selectComponent(found.id);
            }
          }
        }
      });
    });
  }

  markAllNotificationsRead() {
    DB.markNotificationsRead();
    this.updateNotificationBadge();
    this.renderActivityDrawerContent(this.activeFilterOp);
    this.broadcastDataUpdate();
    this.sound.playTick();
  }

  // --- GESTIONE RAPPORTINO DI LAVORO GIORNALIERO (A4 STAMPABILE) ---

  bindRapportinoEvents() {
    const btnClose = document.getElementById('btn-close-rapportino');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeRapportinoModal());
    }

    const btnPrint = document.getElementById('btn-print-rapportino-a4');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    const btnAutoFill = document.getElementById('btn-autofill-rapportino');
    if (btnAutoFill) {
      btnAutoFill.addEventListener('click', () => {
        this.autoFillRapportino();
      });
    }

    const btnAddRapRow = document.getElementById('btn-add-rapportino-row');
    if (btnAddRapRow) {
      btnAddRapRow.addEventListener('click', () => {
        const tbody = document.querySelector('.rap-table-data tbody');
        if (!tbody) return;
        const rowCount = tbody.querySelectorAll('tr').length + 1;
        const tr = document.createElement('tr');
        tr.style.border = '1px solid #000';
        tr.innerHTML = `
          <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:700;">${rowCount}</td>
          <td style="border:1px solid #000; padding:5px;" contenteditable="true" title="Clicca per modificare">Lavorazione aggiuntiva / Manutenzione officina</td>
          <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">${this.activeRapportinoDate}</td>
          <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">14:00</td>
          <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">16:00</td>
          <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:700;" contenteditable="true" class="rap-edit-hours">2.00</td>
          <td style="border:1px solid #000; padding:5px; text-align:center; font-size:10px;" contenteditable="true">${AUTH.activeOperator.name}</td>
        `;
        tbody.appendChild(tr);
        this.sound.playTick();
      });
    }

    const datePicker = document.getElementById('rapportino-date-picker');
    if (datePicker) {
      datePicker.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          const [yyyy, mm, dd] = val.split('-');
          this.activeRapportinoDate = `${dd}.${mm}.${yyyy}`;
          this.renderRapportinoSheet();
        }
      });
    }

    document.querySelectorAll('.rap-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rap-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeRapportinoTemplate = btn.dataset.template;
        this.renderRapportinoSheet();
      });
    });
  }

  openRapportinoModal() {
    this.sound.playSwitch();
    const modal = document.getElementById('modal-rapportino');
    if (!modal) return;
    modal.style.display = 'flex';
    this.renderRapportinoSheet();
  }

  closeRapportinoModal() {
    const modal = document.getElementById('modal-rapportino');
    if (modal) modal.style.display = 'none';
  }

  autoFillRapportino() {
    const data = DB.getRapportinoData(this.activeRapportinoDate);
    this.rapportinoCustomRows = Array.isArray(data) ? data : (data && data.rows ? data.rows : []);
    this.renderRapportinoSheet();
    this.sound.playSuccess();
  }

  renderRapportinoSheet() {
    const container = document.getElementById('rapportino-sheet-container');
    if (!container) return;

    const op = AUTH.activeOperator;
    const dateStr = this.activeRapportinoDate;
    const rawData = this.rapportinoCustomRows || DB.getRapportinoData(dateStr);
    const rows = Array.isArray(rawData) ? rawData : (rawData && rawData.rows ? rawData.rows : []);

    if (this.activeRapportinoTemplate === 'cantiere') {
      // MODELLO 1: CANTIERE / OFFICINA (DA FOTO 1792767902754.jpg)
      let totOre = 0;
      rows.forEach(r => totOre += parseFloat(r.oreLavorate) || 0);

      container.innerHTML = `
        <div class="rapportino-paper-sheet" id="rapportino-print-area">
          <div class="rapportino-sheet-header">
            <h2 class="rap-company-name">RAPPORTINO DI LAVORO GIORNALIERO</h2>
            <div style="font-size:11px; font-weight:700; margin-top:4px;">M.P.A. DI MAURIZIO CAVALLARO · PREFABBRICAZIONE STRUTTURE IN LEGNO</div>
          </div>

          <div class="rap-meta-grid" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:14px; border:1px solid #000; padding:10px;">
            <div>
              <span class="rap-field-label">DATA:</span>
              <strong style="font-size:13px;">${dateStr}</strong>
            </div>
            <div>
              <span class="rap-field-label">OPERATORE:</span>
              <strong style="font-size:13px;">${op.name.toUpperCase()}</strong>
            </div>
            <div>
              <span class="rap-field-label">LUOGO DI LAVORO:</span>
              <span>[X] OFFICINA &nbsp; [ ] CANTIERE 1 &nbsp; [ ] CANTIERE 2</span>
            </div>
          </div>

          <table class="rap-table-data" style="width:100%; border-collapse:collapse; margin-bottom:14px;">
            <thead>
              <tr style="background:#F0F0F0; border:1px solid #000;">
                <th style="border:1px solid #000; padding:6px; width:40px; text-align:center;">N.</th>
                <th style="border:1px solid #000; padding:6px; text-align:left;">LAVORAZIONE ESEGUITA</th>
                <th style="border:1px solid #000; padding:6px; width:80px; text-align:center;">NR ORE</th>
                <th style="border:1px solid #000; padding:6px; width:120px; text-align:center;">QUANTITÀ</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr style="border:1px solid #000;">
                  <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:700;">${i + 1}</td>
                  <td style="border:1px solid #000; padding:6px;" contenteditable="true" title="Clicca per modificare prima di stampare">${r.lavorazione}</td>
                  <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:700;" contenteditable="true" title="Clicca per modificare ore">${r.oreLavorate}</td>
                  <td style="border:1px solid #000; padding:6px; text-align:center;" contenteditable="true" title="Clicca per modificare quantità">${r.quantita}</td>
                </tr>
              `).join('')}
              ${Array.from({ length: Math.max(0, 6 - rows.length) }).map((_, idx) => `
                <tr style="border:1px solid #000; height:28px;">
                  <td style="border:1px solid #000; padding:6px; text-align:center;">${rows.length + idx + 1}</td>
                  <td style="border:1px solid #000; padding:6px;"></td>
                  <td style="border:1px solid #000; padding:6px;"></td>
                  <td style="border:1px solid #000; padding:6px;"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="border:1px solid #000; padding:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="rap-field-label">ORARIO LAVORO:</span>
              <strong>MATTINO:</strong> 08:00 - 12:00 &nbsp;&nbsp;|&nbsp;&nbsp; <strong>POMERIGGIO:</strong> 13:00 - 17:00
            </div>
            <div style="font-size:14px; font-weight:700;">
              TOTALE ORE GIORNATA: ${totOre > 0 ? totOre.toFixed(2) : '8.00'} ORE
            </div>
          </div>

          <div class="rap-signatures-box" style="display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:20px; padding-top:14px;">
            <div style="border-top:1px dashed #000; text-align:center; padding-top:6px; font-size:11px;">
              FIRMA OPERATORE: <strong>${op.name}</strong>
            </div>
            <div style="border-top:1px dashed #000; text-align:center; padding-top:6px; font-size:11px;">
              FIRMA RESPONSABILE / TITOLARE (MAURIZIO CAVALLARO)
            </div>
          </div>
        </div>
      `;
    } else {
      // MODELLO 2: M.P.A. FISCALE CASALE DI SCODOSIA (DA FOTO 1792767902765.jpg)
      let totOre = 0;
      rows.forEach(r => totOre += parseFloat(r.oreLavorate) || 0);

      container.innerHTML = `
        <div class="rapportino-paper-sheet" id="rapportino-print-area">
          <div class="rapportino-sheet-header" style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">
            <h2 class="rap-company-name" style="font-size:18px; font-weight:900; letter-spacing:0.04em;">M.P.A. DI CAVALLARO MAURIZIO</h2>
            <div style="font-size:11px; font-weight:600; margin-top:2px;">
              VIA 4 MARTIRI 112/B - 35040 CASALE DI SCODOSIA PD - PART. IVA 02492680281
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; border:1px solid #000; padding:8px; margin-bottom:12px; font-size:11px;">
            <div><span class="rap-field-label">DOCUMENTO N.:</span> <strong>014 / 2026</strong></div>
            <div><span class="rap-field-label">DATA:</span> <strong>${dateStr}</strong></div>
            <div style="grid-column: span 2;"><span class="rap-field-label">CLIENTE:</span> <strong>CABINE BALNEARI ETRURIA NUOVA</strong></div>
            <div style="grid-column: span 4;"><span class="rap-field-label">OPERATORI PRESENTI:</span> <strong>FRANCESCA, DANIEL, MAURIZIO</strong></div>
          </div>

          <table class="rap-table-data" style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <thead>
              <tr style="background:#F0F0F0; border:1px solid #000;">
                <th style="border:1px solid #000; padding:5px; width:30px; text-align:center;">N.</th>
                <th style="border:1px solid #000; padding:5px; text-align:left;">OPERE DA CONTRATTO / LAVORAZIONE</th>
                <th style="border:1px solid #000; padding:5px; width:70px; text-align:center;">DATA</th>
                <th style="border:1px solid #000; padding:5px; width:65px; text-align:center;">ENTRATA</th>
                <th style="border:1px solid #000; padding:5px; width:65px; text-align:center;">USCITA</th>
                <th style="border:1px solid #000; padding:5px; width:60px; text-align:center;">ORE</th>
                <th style="border:1px solid #000; padding:5px; width:110px; text-align:center;">FIRMA</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr style="border:1px solid #000;">
                  <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:700;">${i + 1}</td>
                  <td style="border:1px solid #000; padding:5px;" contenteditable="true" title="Clicca per modificare">${r.operaContratto || r.lavorazione}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">${r.data}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">${r.oraEntrata}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">${r.oraUscita}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:700;" contenteditable="true">${r.oreLavorate}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center; font-size:10px;" contenteditable="true">${r.operatore}</td>
                </tr>
              `).join('')}
              ${Array.from({ length: Math.max(0, 5 - rows.length) }).map((_, idx) => `
                <tr style="border:1px solid #000; height:26px;">
                  <td style="border:1px solid #000; padding:5px; text-align:center;">${rows.length + idx + 1}</td>
                  <td style="border:1px solid #000; padding:5px;"></td>
                  <td style="border:1px solid #000; padding:5px;"></td>
                  <td style="border:1px solid #000; padding:5px;"></td>
                  <td style="border:1px solid #000; padding:5px;"></td>
                  <td style="border:1px solid #000; padding:5px;"></td>
                  <td style="border:1px solid #000; padding:5px;"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="border:1px solid #000; padding:8px; margin-bottom:12px; font-size:11px;">
            <span class="rap-field-label">MATERIALE IMPIEGATO:</span>
            <span>Morali piallati abete C24 certificato, ferramenta zincata, listelli di battuta e ancoraggio a terra.</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #000; padding:10px; margin-bottom:16px;">
            <div style="font-size:12px;">NOTE: Conforme alle specifiche esecutive del disegno CAD SEMA.</div>
            <div style="font-size:15px; font-weight:800;">TOTALE ORE LAVORATE: ${totOre > 0 ? totOre.toFixed(2) : '8.00'} ORE</div>
          </div>

          <div class="rap-signatures-box" style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:24px;">
            <div style="border-top:1px dashed #000; text-align:center; padding-top:6px; font-size:11px;">
              FIRMA DIPENDENTI
            </div>
            <div style="border-top:1px dashed #000; text-align:center; padding-top:6px; font-size:11px;">
              FIRMA PER RICEVUTA CLIENTE
            </div>
          </div>
        </div>
      `;
    }
  }

  // --- MODALS & ADMIN EVENT BINDING ---

  bindAdminAndModalsEvents() {
    // Gestione Operatore Attivo
    const btnOp = document.getElementById('btn-change-operator');
    if (btnOp) {
      btnOp.addEventListener('click', () => {
        document.getElementById('modal-select-operator').style.display = 'flex';
      });
    }

    // Logout Admin
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    if (btnAdminLogout) {
      btnAdminLogout.addEventListener('click', () => {
        AUTH.logoutAdmin();
        this.sound.playTick();
        this.render();
      });
    }

    // Stealth Admin Button
    const btnStealthAdmin = document.getElementById('btn-stealth-admin');
    if (btnStealthAdmin) {
      btnStealthAdmin.addEventListener('click', () => {
        AUTH.enteredPin = '';
        this.updatePinDots();
        document.getElementById('modal-admin-pin').style.display = 'flex';
      });
    }

    // Chiusura Modali
    document.querySelectorAll('[id^="btn-close-"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Stampa Etichetta QR
    const btnPrintQr = document.getElementById('btn-action-print-qr');
    if (btnPrintQr) {
      btnPrintQr.addEventListener('click', () => {
        window.print();
      });
    }

    // Selezione Rapida Operatore
    document.querySelectorAll('.operator-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const opId = btn.dataset.opId;
        const op = AUTH.setActiveOperatorById(opId);
        if (op) {
          this.sound.playTick();
          this.closeAllModals();
          this.render();
        }
      });
    });

    // Aggiungi Nuovo Operatore
    const btnSaveNewOp = document.getElementById('btn-save-new-operator');
    if (btnSaveNewOp) {
      btnSaveNewOp.addEventListener('click', () => {
        const nameInput = document.getElementById('new-op-name');
        const roleInput = document.getElementById('new-op-role');
        if (nameInput && nameInput.value.trim()) {
          DB.addOperator(nameInput.value, roleInput ? roleInput.value : '');
          nameInput.value = '';
          if (roleInput) roleInput.value = '';
          this.sound.playSuccess();
          this.closeAllModals();
          this.render();
        }
      });
    }

    // PIN Pad Digit Handling (Con sblocco esecuzione post-PIN per Admin Michele)
    document.querySelectorAll('.pin-key[data-digit]').forEach(key => {
      key.addEventListener('click', () => {
        const digit = key.dataset.digit;
        this.sound.playTick();
        if (AUTH.enteredPin.length < 4) {
          AUTH.enteredPin += digit;
          this.updatePinDots();

          if (AUTH.enteredPin.length === 4) {
            setTimeout(() => {
              if (AUTH.verifyAdminPin(AUTH.enteredPin)) {
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
                AUTH.executePendingAction();
              } else {
                AUTH.enteredPin = '';
                this.updatePinDots();
                const pinBox = document.querySelector('.modal-pin-box');
                if (pinBox) {
                  pinBox.style.borderColor = '#FF3333';
                  setTimeout(() => { pinBox.style.borderColor = ''; }, 600);
                }
              }
            }, 100);
          }
        }
      });
    });

    const btnPinCancel = document.getElementById('btn-pin-cancel');
    if (btnPinCancel) {
      btnPinCancel.addEventListener('click', () => {
        AUTH.enteredPin = '';
        this.updatePinDots();
        this.closeAllModals();
      });
    }

    const btnPinBackspace = document.getElementById('btn-pin-backspace');
    if (btnPinBackspace) {
      btnPinBackspace.addEventListener('click', () => {
        if (AUTH.enteredPin.length > 0) {
          AUTH.enteredPin = AUTH.enteredPin.slice(0, -1);
          this.sound.playTick();
          this.updatePinDots();
        }
      });
    }

    // Popup Confirm Modal Buttons
    const acceptConfirmBtn = document.getElementById('btn-confirm-accept');
    if (acceptConfirmBtn) {
      acceptConfirmBtn.addEventListener('click', () => {
        const cb = this.confirmModalCallback;
        this.closeConfirmModal();
        if (typeof cb === 'function') cb();
      });
    }

    const cancelConfirmBtn = document.getElementById('btn-confirm-cancel');
    if (cancelConfirmBtn) {
      cancelConfirmBtn.addEventListener('click', () => {
        this.closeConfirmModal();
      });
    }

    // Nuova Commessa Button (Richiede PIN Admin)
    const openNewProjBtn = document.getElementById('btn-open-new-proj');
    if (openNewProjBtn) {
      openNewProjBtn.addEventListener('click', () => {
        AUTH.requireAdmin(() => {
          this.selectedPdfFile = null;
          const dropLabel = document.getElementById('pdf-dropzone-selected');
          if (dropLabel) dropLabel.textContent = '';
          document.getElementById('modal-new-project').style.display = 'flex';
        }, 'Creazione Nuova Commessa');
      });
    }

    // Salva Nuova Commessa
    const saveNewProjBtn = document.getElementById('btn-save-new-project');
    if (saveNewProjBtn) {
      saveNewProjBtn.addEventListener('click', async () => {
        const title = document.getElementById('new-proj-title').value.trim();
        const client = document.getElementById('new-proj-client').value.trim();
        const deadline = document.getElementById('new-proj-deadline').value;
        const isConfidential = document.getElementById('new-proj-confidential').checked;

        if (!title || !client) {
          this.showConfirmModal({
            title: 'CAMPI OBBLIGATORI',
            message: 'Inserisci sia il titolo della commessa che il cliente per poter procedere.',
            confirmText: 'HO CAPITO',
            cancelText: '',
            isDestructive: true,
            onConfirm: () => {}
          });
          return;
        }

        saveNewProjBtn.disabled = true;
        saveNewProjBtn.textContent = 'ELABORAZIONE PDF SEMA...';

        let components = [];
        if (this.selectedPdfFile) {
          components = await this.processPdfOrImageFile(this.selectedPdfFile);
        }

        if (components.length === 0) {
          // Crea due telai standard predefiniti
          components = [
            {
              id: 'comp-' + Date.now() + '-1',
              code: 'PM 01',
              title: 'Telaio Anteriore Principale',
              pageNumber: 1,
              image: 'img/SEMA-preview.jpg',
              cutStatus: 'todo',
              assemblyStatus: 'todo',
              cutOperator: 'Francesca',
              assemblyOperator: 'Daniel',
              note: '',
              morali: [
                { id: 'm-1', qty: 2, length: '2800.00', desc: 'Montanti portanti C24', checked: false },
                { id: 'm-2', qty: 3, length: '1450.00', desc: 'Traversi orizzontali C24', checked: false }
              ]
            },
            {
              id: 'comp-' + Date.now() + '-2',
              code: 'PM 02',
              title: 'Telaio Parete Laterale',
              pageNumber: 2,
              image: 'img/SEMA-preview.jpg',
              cutStatus: 'todo',
              assemblyStatus: 'todo',
              cutOperator: 'Francesca',
              assemblyOperator: 'Daniel',
              note: '',
              morali: [
                { id: 'm-3', qty: 2, length: '2400.00', desc: 'Montanti perimetrali C24', checked: false },
                { id: 'm-4', qty: 4, length: '1200.00', desc: 'Falsi montanti interasse 60', checked: false }
              ]
            }
          ];
        }

        const newProj = {
          id: 'proj-' + Date.now(),
          title: title,
          code: 'COMM-' + Math.floor(1000 + Math.random() * 9000),
          client: client,
          deadline: deadline || '2026-11-20',
          totalComponents: components.length,
          isConfidential: isConfidential,
          components: components
        };

        DB.addProject(newProj);
        DB.addNotification(
          `NUOVA COMMESSA CREATA`,
          `Commessa ${newProj.code} - ${newProj.title} creata con ${components.length} telai da PDF SEMA.`,
          'success',
          'Michele',
          null,
          newProj.id
        );

        this.selectedProjectId = newProj.id;
        this.selectedComponentId = null;
        this.selectedPdfFile = null;

        saveNewProjBtn.disabled = false;
        saveNewProjBtn.textContent = 'CREA COMMESSA';

        this.closeAllModals();
        this.sound.playSuccess();
        this.broadcastDataUpdate();
        this.render();
      });
    }

    // Salva Modifica Commessa
    const saveEditProjBtn = document.getElementById('btn-save-edit-proj');
    if (saveEditProjBtn) {
      saveEditProjBtn.addEventListener('click', () => {
        const title = document.getElementById('edit-proj-title').value.trim();
        const client = document.getElementById('edit-proj-client').value.trim();
        const deadline = document.getElementById('edit-proj-deadline').value;

        if (title && client) {
          DB.updateProject(this.selectedProjectId, { title, client, deadline });
          this.closeAllModals();
          this.sound.playSuccess();
          this.broadcastDataUpdate();
          this.render();
        }
      });
    }

    // Elimina Commessa da Modal
    const deleteProjBtn = document.getElementById('btn-delete-active-proj');
    if (deleteProjBtn) {
      deleteProjBtn.addEventListener('click', () => {
        AUTH.requireAdmin(() => {
          this.showConfirmModal({
            title: 'ELIMINA COMMESSA',
            message: 'Confermi la cancellazione definitiva di questa commessa?',
            confirmText: 'ELIMINA DEFINITIVAMENTE',
            isDestructive: true,
            onConfirm: () => {
              DB.deleteProject(this.selectedProjectId);
              const remaining = DB.getProjects(true);
              this.selectedProjectId = remaining.length > 0 ? remaining[0].id : null;
              this.selectedComponentId = null;
              this.closeAllModals();
              this.sound.playTick();
              this.broadcastDataUpdate();
              this.switchToProjects();
              this.render();
            }
          });
        }, 'Eliminazione Commessa');
      });
    }

    // Salva Sostituisci PDF
    const saveReplacePdfBtn = document.getElementById('btn-save-replace-pdf');
    if (saveReplacePdfBtn) {
      saveReplacePdfBtn.addEventListener('click', async () => {
        if (!this.selectedPdfFile) return;

        saveReplacePdfBtn.disabled = true;
        saveReplacePdfBtn.textContent = 'ESTRAZIONE IN CORSO...';

        const components = await this.processPdfOrImageFile(this.selectedPdfFile);
        if (components.length > 0) {
          DB.updateProject(this.selectedProjectId, {
            components: components,
            totalComponents: components.length
          });
        }

        saveReplacePdfBtn.disabled = false;
        saveReplacePdfBtn.textContent = 'ELABORA & SALVA TAVOLE';
        this.closeAllModals();
        this.sound.playSuccess();
        this.broadcastDataUpdate();
        this.render();
      });
    }

    // Salva Modifica Telaio
    const saveEditCompBtn = document.getElementById('btn-save-edit-comp');
    if (saveEditCompBtn) {
      saveEditCompBtn.addEventListener('click', () => {
        const code = document.getElementById('edit-comp-code').value.trim();
        const title = document.getElementById('edit-comp-title').value.trim();
        const note = document.getElementById('edit-comp-note').value.trim();

        if (code && title) {
          DB.updateComponent(this.selectedProjectId, this.selectedComponentId, { code, title, note });
          this.closeAllModals();
          this.sound.playSuccess();
          this.broadcastDataUpdate();
          this.render();
        }
      });
    }

    // Salva Aggiungi Morale
    const saveAddMoralBtn = document.getElementById('btn-save-new-moral');
    if (saveAddMoralBtn) {
      saveAddMoralBtn.addEventListener('click', () => {
        const qty = document.getElementById('new-moral-qty').value;
        const len = document.getElementById('new-moral-len').value;
        const desc = document.getElementById('new-moral-desc').value;

        if (qty && len) {
          DB.addMoral(this.selectedProjectId, this.selectedComponentId, qty, len, desc);
          this.closeAllModals();
          this.sound.playSuccess();
          this.broadcastDataUpdate();
          this.render();
        }
      });
    }

    // Setup Dropzone PDF
    this.setupPdfDropzone('pdf-dropzone', 'pdf-file-input', 'pdf-dropzone-selected');
    this.setupPdfDropzone('replace-pdf-dropzone', 'replace-pdf-file-input', 'replace-pdf-dropzone-selected');
  }

  setupPdfDropzone(dropzoneId, inputId, selectedLabelId) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    const selectedLabel = document.getElementById(selectedLabelId);

    if (!dropzone || !input) return;

    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handlePdfFileSelected(e.dataTransfer.files[0], selectedLabel);
      }
    });

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) {
        this.handlePdfFileSelected(input.files[0], selectedLabel);
      }
    });
  }

  handlePdfFileSelected(file, selectedLabel) {
    this.selectedPdfFile = file;
    if (selectedLabel) {
      selectedLabel.textContent = `SELEZIONATO: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }
  }

  // --- PARSER PDF.JS SEMA CAD ENGINE ---

  async processPdfOrImageFile(file) {
    if (file.type === 'application/pdf' && window.pdfjsLib) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const components = [];

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Parsing del testo per estrarre distinta morali
          const textContent = await page.getTextContent();
          const textLines = textContent.items.map(item => item.str).join(' ');

          const morali = [];
          const regexLengths = /(\d{3,4}(?:[.,]\d{1,2})?)\s*mm/gi;
          let match;
          let mIdx = 1;

          while ((match = regexLengths.exec(textLines)) !== null) {
            morali.push({
              id: `moral-${pageNum}-${mIdx++}`,
              qty: 2,
              length: match[1].replace(',', '.'),
              desc: `Elemento SEMA P.${pageNum}`,
              checked: false
            });
          }

          if (morali.length === 0) {
            morali.push(
              { id: `moral-${pageNum}-1`, qty: 2, length: '2800.00', desc: 'Montante perimetrale', checked: false },
              { id: `moral-${pageNum}-2`, qty: 3, length: '1450.00', desc: 'Traverso orizzontale', checked: false }
            );
          }

          components.push({
            id: `comp-pdf-${Date.now()}-${pageNum}`,
            code: `PM 0${pageNum}`,
            title: `Telaio Parete P.${pageNum}`,
            pageNumber: pageNum,
            image: imgDataUrl,
            cutStatus: 'todo',
            assemblyStatus: 'todo',
            cutOperator: 'Francesca',
            assemblyOperator: 'Daniel',
            note: '',
            morali: morali
          });
        }

        return components;
      } catch (err) {
        console.error('Errore parsing PDF SEMA', err);
        return [];
      }
    } else {
      // Singola Immagine
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve([{
            id: `comp-img-${Date.now()}`,
            code: 'PM 01',
            title: file.name.replace(/\.[^/.]+$/, ''),
            pageNumber: 1,
            image: e.target.result,
            cutStatus: 'todo',
            assemblyStatus: 'todo',
            cutOperator: 'Francesca',
            assemblyOperator: 'Daniel',
            note: '',
            morali: [
              { id: 'm-1', qty: 2, length: '2800.00', desc: 'Montante estruso C24', checked: false },
              { id: 'm-2', qty: 3, length: '1450.00', desc: 'Traverso C24', checked: false }
            ]
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // --- APERTURA MODALI SPECIFICI ---

  openEditProjectModal(projId) {
    const proj = DB.getProjectById(projId);
    if (!proj) return;
    document.getElementById('edit-proj-title').value = proj.title;
    document.getElementById('edit-proj-client').value = proj.client;
    document.getElementById('edit-proj-deadline').value = proj.deadline;
    document.getElementById('modal-edit-project').style.display = 'flex';
  }

  openUploadPdfModal(projId) {
    this.selectedProjectId = projId;
    this.selectedPdfFile = null;
    const label = document.getElementById('replace-pdf-dropzone-selected');
    if (label) label.textContent = '';
    document.getElementById('modal-replace-pdf').style.display = 'flex';
  }

  openEditComponentModal(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    if (!comp) return;
    document.getElementById('edit-comp-code').value = comp.code;
    document.getElementById('edit-comp-title').value = comp.title;
    document.getElementById('edit-comp-note').value = comp.note || '';
    document.getElementById('modal-edit-component').style.display = 'flex';
  }

  updatePinDots() {
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`pin-dot-${i}`);
      if (dot) {
        dot.classList.toggle('filled', i <= AUTH.enteredPin.length);
      }
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
  }

  // --- DRAWER ATTIVITÀ OPERATORI "COSA FA CHI" ---

  renderActivityDrawer() {
    const operators = DB.getOperators();

    return `
      <div id="drawer-activity" class="drawer-overlay" style="display:none;">
        <div class="drawer-panel">
          <div class="drawer-header">
            <div>
              <div class="panel-header-title">REGISTRO ATTIVITÀ OPERAI</div>
              <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted); margin-top:2px;">
                COSA FA CHI IN TEMPO REALE · PRODUZIONE 4.0
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button class="btn-solid-white font-mono" id="btn-drawer-to-audit" style="font-size:10px; padding:4px 8px;" title="Apri Storico Completo Movimenti per Admin Michele">
                🛡️ STORICO COMPLETO
              </button>
              <button class="btn-outline-sm font-mono" id="btn-mark-all-read" title="Segna tutte come lette">
                ✓ LETTE
              </button>
              <button class="btn-outline-sm" id="btn-close-activity-drawer" title="Chiudi registro">
                ✕
              </button>
            </div>
          </div>

          <!-- Filtro Operatore Rapido -->
          <div style="display:flex; gap:6px; padding:10px 16px; border-bottom:var(--glass-border-light); background:rgba(6,7,9,0.7); overflow-x:auto;">
            <button class="btn-outline-sm font-mono drawer-filter-btn active" data-filter-op="all">TUTTI</button>
            ${operators.map(op => `
              <button class="btn-outline-sm font-mono drawer-filter-btn" data-filter-op="${op.name}">
                ${op.name.toUpperCase()}
              </button>
            `).join('')}
          </div>

          <div class="drawer-body" id="drawer-activity-body">
            <!-- Popolato dinamicamente da renderActivityDrawerContent -->
          </div>
        </div>
      </div>
    `;
  }

  // --- MODALI APPLICATIVI (B&W LIQUID GLASS) ---

  renderModals() {
    const operators = DB.getOperators();

    return `
      <!-- Modal Selettore Operatore -->
      <div id="modal-select-operator" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:440px;">
          <div class="modal-header">
            <h3>SELEZIONA OPERATORE ATTIVO</h3>
            <button class="btn-outline-sm" id="btn-close-operator-modal">[X]</button>
          </div>
          <div class="modal-body">
            <p style="font-size:11px; color:var(--text-secondary); margin-bottom:12px; font-family:var(--font-mono);">
              Tutte le azioni di taglio e montaggio verranno firmate e registrate con l'operatore selezionato.
            </p>
            <div class="operator-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              ${operators.map(op => `
                <button class="btn-outline-white operator-pick-btn" data-op-id="${op.id}" style="justify-content:flex-start; text-align:left; padding:12px 14px; border-left:3px solid ${this.getOperatorColor(op.name)};">
                  <div>
                    <div style="font-weight:700; font-size:12px; color:#FFFFFF;">${op.name}</div>
                    <div style="font-size:9px; color:var(--text-muted); font-family:var(--font-mono);">${op.role || 'Operatore'}</div>
                  </div>
                </button>
              `).join('')}
            </div>

            ${AUTH.isAdmin ? `
              <div style="margin-top:16px; border-top:var(--glass-border-light); padding-top:12px;">
                <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:8px;">AGGIUNGI NUOVO OPERATORE:</div>
                <div style="display:flex; gap:6px;">
                  <input type="text" id="new-op-name" class="form-control" placeholder="NOME" style="font-size:11px;" />
                  <input type="text" id="new-op-role" class="form-control" placeholder="RUOLO" style="font-size:11px;" />
                  <button class="btn-solid-white font-mono" id="btn-save-new-operator" style="font-size:10px;">SALVA</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Modal PIN Admin Michele (1991) con Titolo Personalizzato Azione Protetta -->
      <div id="modal-admin-pin" class="modal-overlay" style="display:none;">
        <div class="modal-pin-box">
          <h3 style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#FFFFFF;">
            ACCESSO RISERVATO MICHELE
          </h3>
          <p id="pin-modal-custom-title" style="font-size:11px; color:#FFAE42; margin-top:6px; font-family:var(--font-mono); font-weight:600;">
            DIGITA IL PIN AMMINISTRATORE (1991)
          </p>

          <div class="pin-display">
            <div class="pin-dot" id="pin-dot-1"></div>
            <div class="pin-dot" id="pin-dot-2"></div>
            <div class="pin-dot" id="pin-dot-3"></div>
            <div class="pin-dot" id="pin-dot-4"></div>
          </div>

          <div class="pin-pad font-mono">
            <button class="pin-key" data-digit="1">1</button>
            <button class="pin-key" data-digit="2">2</button>
            <button class="pin-key" data-digit="3">3</button>
            <button class="pin-key" data-digit="4">4</button>
            <button class="pin-key" data-digit="5">5</button>
            <button class="pin-key" data-digit="6">6</button>
            <button class="pin-key" data-digit="7">7</button>
            <button class="pin-key" data-digit="8">8</button>
            <button class="pin-key" data-digit="9">9</button>
            <button class="pin-key" id="btn-pin-cancel">C</button>
            <button class="pin-key" data-digit="0">0</button>
            <button class="pin-key" id="btn-pin-backspace">&lt;</button>
          </div>
        </div>
      </div>

      <!-- Modal Rapportino di Lavoro Giornaliero A4 Stampabile (Foto Allegati Zip) -->
      <div id="modal-rapportino" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:880px; max-height:92vh; display:flex; flex-direction:column; padding:0;">
          <div class="modal-header" style="padding:14px 18px;">
            <h3>RAPPORTINO DI LAVORO GIORNALIERO (STAMPA A4)</h3>
            <button class="btn-outline-sm" id="btn-close-rapportino">[X]</button>
          </div>

          <!-- Barra di Controllo: Switch Modello, Selezione Data, Auto-Compilazione e Stampa -->
          <div class="rapportino-controls-bar" style="padding:10px 18px; border-bottom:var(--glass-border-light); background:rgba(12,14,20,0.8); display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;">
            <div class="rapportino-tabs-nav" style="margin-bottom:0; display:flex; gap:6px;">
              <button class="btn-outline-sm font-mono rap-tab-btn active" data-template="cantiere">MODELLO 1: CANTIERE / OFFICINA</button>
              <button class="btn-outline-sm font-mono rap-tab-btn" data-template="fiscale">MODELLO 2: M.P.A. FISCALE (CASALE DI SCODOSIA)</button>
            </div>

            <div style="display:flex; gap:8px; align-items:center;">
              <input type="date" id="rapportino-date-picker" class="form-control" style="padding:4px 8px; font-size:11px; width:130px;" value="${new Date().toISOString().split('T')[0]}" />
              <button class="btn-outline-sm font-mono" id="btn-autofill-rapportino" title="Compila automaticamente dai lavori completati oggi">
                ⚡ AUTO-COMPILA
              </button>
              <button class="btn-outline-sm font-mono" id="btn-add-rapportino-row" title="Aggiungi una riga vuota alla tabella">
                + RIGA
              </button>
              <button class="btn-solid-white font-mono" id="btn-print-rapportino-a4" style="font-weight:700;">
                🖨️ STAMPA A4
              </button>
            </div>
          </div>

          <!-- Area Foglio Cartaceo Stampabile A4 -->
          <div class="modal-body" style="padding:18px; overflow-y:auto; flex:1; background:#0B0D12;">
            <div id="rapportino-sheet-container"></div>
          </div>
        </div>
      </div>

      <!-- Modal Batch Troncatrice & 1D Nesting -->
      <div id="modal-batch-saw" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:840px;">
          <div class="modal-header">
            <h3>DISTINTA CUMULATIVA COMMESSA & BATCH TRONCATRICE</h3>
            <button class="btn-outline-sm" id="btn-close-batch-saw">[X]</button>
          </div>
          <div class="modal-body">
            <div id="batch-saw-proj-title" style="font-size:13px; font-weight:700; color:#FFFFFF; margin-bottom:8px;"></div>
            <div id="batch-saw-summary" style="margin-bottom:14px;"></div>
            <table class="logs-table font-mono" style="font-size:11px;">
              <thead>
                <tr>
                  <th>MORALE / DESCRIZIONE</th>
                  <th>LUNGHEZZA</th>
                  <th>Q.TÀ COMMESSA</th>
                  <th>TAGLIATI</th>
                  <th>UTILIZZATO IN TELAI</th>
                </tr>
              </thead>
              <tbody id="batch-saw-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Etichetta QR Posa Cantiere -->
      <div id="modal-qr-label" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:440px;">
          <div class="modal-header">
            <h3>ETICHETTA TECNICA QR PER CANTIERE</h3>
            <button class="btn-outline-sm" id="btn-close-qr-label">[X]</button>
          </div>
          <div class="modal-body">
            <div id="qr-label-print-area" class="qr-label-box" style="border:2px solid #FFFFFF; padding:16px; background:#FFFFFF; color:#000000; font-family:var(--font-mono);">
              <div style="font-size:10px; font-weight:800; border-bottom:1px solid #000; padding-bottom:4px;">
                M.P.A. DI MAURIZIO CAVALLARO · SCHEDA DI POSA
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <div>
                  <div style="font-size:18px; font-weight:900;" id="qr-label-code">PM 01</div>
                  <div style="font-size:11px; font-weight:700; margin-top:2px;" id="qr-label-title">Telaio Anteriore</div>
                  <div style="font-size:10px; margin-top:4px;" id="qr-label-project">CABINE BALNEARI</div>
                  <div style="font-size:10px; color:#555;" id="qr-label-client">CLIENTE</div>
                  <div style="font-size:9px; color:#777; margin-top:6px;" id="qr-label-meta">PAGINA 1</div>
                </div>
                <div id="qr-code-canvas-box" style="width:110px; height:110px;"></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-solid-white" id="btn-action-print-qr">STAMPA ETICHETTA</button>
          </div>
        </div>
      </div>

      <!-- Modal Registro Tempi & Produttività -->
      <div id="modal-timesheet" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:780px;">
          <div class="modal-header">
            <h3>REGISTRO TEMPI E PRODUTTIVITÀ LAVORAZIONI</h3>
            <button class="btn-outline-sm" id="btn-close-timesheet-modal">[X]</button>
          </div>
          <div class="modal-body" style="padding:0;">
            <table class="logs-table font-mono">
              <thead>
                <tr>
                  <th>COMMESSA / TELAIO</th>
                  <th>FASE</th>
                  <th>OPERATORE</th>
                  <th>ORARI (DURATA)</th>
                  <th>STATO</th>
                </tr>
              </thead>
              <tbody id="timesheet-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Nuova Commessa con Dropzone PDF -->
      <div id="modal-new-project" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:480px;">
          <div class="modal-header">
            <h3>NUOVA COMMESSA SEMA (DA PDF)</h3>
            <button class="btn-outline-sm" id="btn-close-new-project">[X]</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>TITOLO COMMESSA</label>
              <input type="text" id="new-proj-title" class="form-control" placeholder="ES. CHIOSCO MARE PINETA" />
            </div>
            <div class="form-group">
              <label>CLIENTE / LOCALITÀ</label>
              <input type="text" id="new-proj-client" class="form-control" placeholder="ES. BAGNO SIRENA - CERVIA" />
            </div>
            <div class="form-group">
              <label>DATA CONSEGNA</label>
              <input type="date" id="new-proj-deadline" class="form-control" value="2026-11-20" />
            </div>

            <div class="form-group">
              <label>CARICA TAVOLE TECNICHE CAD (FILE PDF SEMA)</label>
              <div class="pdf-dropzone" id="pdf-dropzone">
                <div class="pdf-dropzone-icon">📄</div>
                <div class="pdf-dropzone-title">TRASCINA IL PDF SEMA O CLICCA QUI</div>
                <div class="pdf-dropzone-sub">Il gestionale estrarrà automaticamente ogni pagina come telaio singolo</div>
                <div class="pdf-dropzone-selected" id="pdf-dropzone-selected"></div>
                <input type="file" id="pdf-file-input" accept=".pdf,image/*" style="display:none;" />
              </div>
            </div>

            <div class="form-group" style="display:flex; align-items:center; gap:8px; margin-top:10px;">
              <input type="checkbox" id="new-proj-confidential" style="width:14px; height:14px;" />
              <label for="new-proj-confidential" style="margin-bottom:0;">COMMESSA RISERVATA</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-solid-white" id="btn-save-new-project">CREA COMMESSA</button>
          </div>
        </div>
      </div>

      <!-- Modal Sostituisci / Carica PDF per Commessa Esistente -->
      <div id="modal-replace-pdf" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:480px;">
          <div class="modal-header">
            <h3>CARICA / AGGIORNA FILE PDF SEMA</h3>
            <button class="btn-outline-sm" id="btn-close-replace-pdf">[X]</button>
          </div>
          <div class="modal-body">
            <p style="font-size:11px; color:var(--text-secondary); font-family:var(--font-mono); margin-bottom:14px;">
              Seleziona il nuovo PDF esportato da SEMA Software per aggiornare le tavole e i pezzi di questa commessa.
            </p>
            <div class="pdf-dropzone" id="replace-pdf-dropzone">
              <div class="pdf-dropzone-icon">📄</div>
              <div class="pdf-dropzone-title">TRASCINA IL NUOVO PDF O CLICCA QUI</div>
              <div class="pdf-dropzone-sub">Formati accettati: .pdf, immagini .jpg/.png</div>
              <div class="pdf-dropzone-selected" id="replace-pdf-dropzone-selected"></div>
              <input type="file" id="replace-pdf-file-input" accept=".pdf,image/*" style="display:none;" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-solid-white" id="btn-save-replace-pdf">ELABORA & SALVA TAVOLE</button>
          </div>
        </div>
      </div>

      <!-- Modal Modifica Commessa -->
      <div id="modal-edit-project" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:440px;">
          <div class="modal-header">
            <h3>MODIFICA COMMESSA</h3>
            <button class="btn-outline-sm" id="btn-close-edit-proj">[X]</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>TITOLO</label>
              <input type="text" id="edit-proj-title" class="form-control" />
            </div>
            <div class="form-group">
              <label>CLIENTE</label>
              <input type="text" id="edit-proj-client" class="form-control" />
            </div>
            <div class="form-group">
              <label>DATA DI SCADENZA</label>
              <input type="date" id="edit-proj-deadline" class="form-control" />
            </div>
          </div>
          <div class="modal-footer" style="justify-content:space-between;">
            <button class="btn-outline-white" id="btn-delete-active-proj" style="border-color:#FF4444; color:#FF4444;">ELIMINA</button>
            <button class="btn-solid-white" id="btn-save-edit-proj">SALVA</button>
          </div>
        </div>
      </div>

      <!-- Modal Modifica Telaio -->
      <div id="modal-edit-component" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:440px;">
          <div class="modal-header">
            <h3>MODIFICA TELAIO / COMPONENTE</h3>
            <button class="btn-outline-sm" id="btn-close-edit-comp">[X]</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>CODICE TAVOLA (ES. PM 01 - PM 02)</label>
              <input type="text" id="edit-comp-code" class="form-control" />
            </div>
            <div class="form-group">
              <label>TITOLO / DESCRIZIONE TELAIO</label>
              <input type="text" id="edit-comp-title" class="form-control" />
            </div>
            <div class="form-group">
              <label>NOTE OFFICINA A VISTA</label>
              <input type="text" id="edit-comp-note" class="form-control" placeholder="ES. LA PARTE SOTTO E' A VISTA" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-solid-white" id="btn-save-edit-comp">SALVA TELAIO</button>
          </div>
        </div>
      </div>

      <!-- Modal Aggiungi Morale a Matita -->
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

            <!-- Pulsanti Export CSV, Stampa & Svuota -->
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="btn-solid-white font-mono" id="btn-export-audit-csv" title="Esporta storico movimenti in CSV per Excel" style="font-size:11px;">
                📥 ESPORTA CSV
              </button>
              <button class="btn-outline-sm font-mono" id="btn-print-audit-report" title="Stampa registro audit su foglio A4" style="font-size:11px;">
                🖨️ STAMPA
              </button>
              <button class="btn-outline-sm font-mono" id="btn-clear-audit-logs" title="Svuota registro (Richiede PIN Admin)" style="font-size:11px; border-color:#FF4444; color:#FF4444;">
                🗑️ SVUOTA
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
    `;
  }

  // --- UTILITY FORMATTAZIONE ---

  getStatusLabel(status) {
    switch (status) {
      case 'completed': return 'COMPLETATO';
      case 'in_progress':
      case 'wip': return 'IN CORSO';
      case 'paused': return 'IN SOSPESO';
      case 'planned': return 'PROGRAMMATO';
      default: return 'DA INIZIARE';
    }
  }

  getStatusClass(status) {
    switch (status) {
      case 'completed': return 'status-done';
      case 'in_progress':
      case 'wip': return 'status-wip';
      case 'paused': return 'status-paused';
      default: return 'status-todo';
    }
  }


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

    const btnClearAudit = document.getElementById('btn-clear-audit-logs');
    if (btnClearAudit) {
      btnClearAudit.addEventListener('click', () => {
        AUTH.requireAdmin(() => {
          this.showConfirmModal({
            title: 'SVUOTA REGISTRO AUDIT',
            message: 'Sei sicuro di voler eliminare TUTTI i movimenti registrati nello storico?<br><br>L\'operazione è permanente ed irreversibile.',
            confirmText: 'ELIMINA DEFINITIVAMENTE',
            cancelText: 'ANNULLA',
            isDestructive: true,
            onConfirm: () => {
              DB.clearAuditLogs();
              this.renderAuditTable();
              this.sound.playTick();
            }
          });
        }, 'Svuotamento Storico Movimenti');
      });
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return '--';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dateStr;
  }

  calculateDaysRemaining(deadlineStr) {
    if (!deadlineStr) return '';
    const now = new Date();
    const d = new Date(deadlineStr);
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `SCADUTO`;
    if (diff === 0) return `SCADE OGGI`;
    return `${diff} GG`;
  }
}

// Inizializzazione Applicazione
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
