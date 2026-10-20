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
 */

// ==========================================================================
// 1. SINTETIZZATORE AUDIO TASSILE (WEB AUDIO API NATIVO)
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
    this.isPanning = false;
    this.isCadInverted = false; // Alto contrasto da officina (Dark CAD Blueprint)

    // Motori Tattili ed Effetti 3D
    this.sound = new SoundEngine();
    this.atroposInstances = [];

    // Timer Attivo Lavorazione
    this.activeTimer = {
      running: false,
      projectId: null,
      componentId: null,
      componentCode: '',
      projectName: '',
      startTimeStr: '',
      startTimeObj: null,
      elapsedSeconds: 0,
      intervalId: null
    };

    // Sincronizzazione Multi-Dispositivo
    this.broadcastChannel = null;
    this.initMultiDeviceSync();

    // File PDF selezionato per nuova commessa o sostituzione
    this.selectedPdfFile = null;
    this.targetUploadProjectId = null;

    // Componente target per modifica
    this.targetEditCompId = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.render();
  }

  // --- SINCRONIZZAZIONE REAL-TIME MULTI-SCHEDA & MULTI-DEVICE ---

  initMultiDeviceSync() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('mpa_workshop_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'DATA_UPDATED') {
            DB.data = DB.loadData();
            this.refreshCurrentViewSilently();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel non disponibile', e);
      }
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'mpa_gestionale_data_v7') {
        DB.data = DB.loadData();
        this.refreshCurrentViewSilently();
      }
    });
  }

  broadcastDataUpdate() {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
      } catch (e) {}
    }
  }

  refreshCurrentViewSilently() {
    // Aggiorna barre di progresso e contatori senza resettare lo zoom della tavola CAD
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!proj) return;

    const progress = DB.calculateProjectProgress(proj);
    this.updateProjectProgressBar(this.selectedProjectId, progress);

    if (this.currentNavLevel === 'components') {
      const compPanel = document.querySelector('.nav-panel-components');
      if (compPanel) {
        compPanel.innerHTML = this.renderComponentsPanelContent();
        this.initAtroposCards();
        this.bindComponentPanelEvents();
        this.bindBackBtnEvent();
      }
    }
  }

  setupEventListeners() {
    window.addEventListener('online', () => this.updateConnectionStatus(true));
    window.addEventListener('offline', () => this.updateConnectionStatus(false));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
        this.closeAllModals();
      }
    });

    window.addEventListener('click', () => {
      this.hideContextMenu();
    });
  }

  updateConnectionStatus(isOnline) {
    const el = document.getElementById('connection-status');
    if (!el) return;
    if (isOnline) {
      el.className = 'connection-status';
      el.textContent = 'ONLINE';
    } else {
      el.className = 'connection-status offline';
      el.textContent = 'OFFLINE';
    }
  }

  // --- RENDERING GENERALE DELL'INTERFACCIA ---

  render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      ${this.renderHeader()}
      <div class="workspace-layout">
        ${this.renderSidebarNavigator()}
        <main class="main-stage">
          ${this.renderMainStageContent()}
        </main>
      </div>
      ${this.renderStealthAdminButton()}
      ${this.renderContextMenu()}
      ${this.renderModals()}
    `;

    this.bindEvents();
    this.initAtroposCards();
  }

  // --- HEADER: SOLO NOME AZIENDA, CONTROLLO AUDIO, OPERATORE, STATO ---

  renderHeader() {
    const op = AUTH.activeOperator;

    return `
      <header class="app-header">
        <div class="brand-section">
          <div class="brand-title">MPA di Maurizio Cavallaro</div>
        </div>

        <div class="header-actions">
          <!-- Tasto Switch Audio Meccanico -->
          <button class="sound-toggle-btn ${this.sound.enabled ? '' : 'muted'}" id="btn-toggle-sound" title="Attiva/Disattiva Suoni Tattili">
            ${this.sound.enabled ? 'AUDIO: ON' : 'AUDIO: OFF'}
          </button>

          <!-- Selettore Operatore Squadra -->
          <div class="operator-box" id="btn-change-operator" title="Gestione / Selezione Operatore">
            <span class="operator-label">OPERATORE:</span>
            <span class="operator-val">${op.name}</span>
          </div>

          <!-- Stato Connessione Locale / Rete -->
          <div id="connection-status" class="connection-status">
            ONLINE
          </div>

          ${AUTH.isAdmin ? `
            <div class="admin-badge-active" id="btn-admin-logout" title="Clicca per uscire dalla modalità amministratore">
              MICHELE (ADMIN) [ ESCI ]
            </div>
          ` : ''}
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

  // CONTENUTO LIVELLO 1: COMMESSE CON ATROPOS 3D TILT E BARRA DI COMPLETAMENTO
  renderProjectsPanelContent() {
    const projects = DB.getProjects(AUTH.isAdmin);

    return `
      <div class="panel-header">
        <span class="panel-title">COMMESSE (${projects.length})</span>
        ${AUTH.isAdmin ? `
          <button class="btn-outline-sm" id="btn-open-new-project" title="Crea nuova commessa da PDF">
            [ + NUOVA ]
          </button>
        ` : ''}
      </div>

      <div class="panel-scroll-content">
        ${projects.map(proj => {
          const isSelected = proj.id === this.selectedProjectId;
          const progress = DB.calculateProjectProgress(proj);
          const remaining = this.calculateDaysRemaining(proj.deadline);

          return `
            <div class="atropos atropos-card-wrapper" data-atropos-proj="${proj.id}">
              <div class="atropos-scale">
                <div class="atropos-rotate">
                  <div class="atropos-inner">
                    <div class="liquid-glass-card project-item-card ${isSelected ? 'active' : ''}" 
                         data-select-project-id="${proj.id}" 
                         data-context-project-id="${proj.id}"
                         title="Tasto sinistro per aprire · Tasto destro per opzioni">
                      <div class="p-card-top font-mono" data-atropos-offset="2">
                        <span class="p-card-code">${proj.code}</span>
                        <span class="p-card-deadline">${this.formatDate(proj.deadline)}</span>
                      </div>
                      
                      <div class="p-card-title" data-atropos-offset="5">${proj.title}</div>
                      <div class="p-card-client font-mono" data-atropos-offset="3">${proj.client}</div>

                      <!-- Barra di completamento con percentuale in tempo reale -->
                      <div class="p-progress-box" data-atropos-offset="4">
                        <div class="p-progress-track">
                          <div class="p-progress-fill" id="proj-progress-bar-${proj.id}" style="width: ${progress}%;"></div>
                        </div>
                        <div class="p-progress-val font-mono" id="proj-progress-val-${proj.id}">${progress}%</div>
                      </div>

                      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;" data-atropos-offset="2">
                        <span class="status-pill ${this.getStatusClass(proj.status)} font-mono">
                          ${this.getStatusLabel(proj.status)}
                        </span>
                        <span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono);">
                          ${remaining}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="panel-footer">
        <button class="btn-panel-action" id="btn-open-timesheet-modal">
          REGISTRO TEMPI & PRODUTTIVITÀ
        </button>
      </div>
    `;
  }

  // CONTENUTO LIVELLO 2: PARTI DEL PROGETTO (TELAI) CON BATCH TRONCATRICE
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
      <!-- Header con Pulsante per Tornare alla Sezione Antecedente e Tasto Troncatrice Batch -->
      <div class="panel-header">
        <button class="btn-nav-back" id="btn-back-to-projects" title="Torna all'elenco delle commesse">
          ← COMMESSE
        </button>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn-outline-sm font-mono" id="btn-open-batch-saw" title="Distinta cumulativa troncatrice & calcolo sfrido barre grezze">
            🪚 BATCH TRONCATRICE
          </button>
          ${AUTH.isAdmin ? `
            <button class="btn-outline-sm" id="btn-edit-active-proj" title="Modifica commessa">
              [ MODIFICA ]
            </button>
          ` : ''}
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

      <!-- Elenco Parti del Progetto (Telai / Componenti) -->
      <div class="panel-scroll-content">
        ${components.length === 0 ? `
          <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:11px; font-family:var(--font-mono);">
            Nessun telaio presente o trovato.
          </div>
        ` : components.map(comp => {
          const isSelected = comp.id === this.selectedComponentId;
          const moraliCount = comp.morali ? comp.morali.length : 0;
          const checkedCount = comp.morali ? comp.morali.filter(m => m.checked).length : 0;

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
                        <span style="color:var(--text-secondary);">${checkedCount}/${moraliCount} PEZZI</span>
                        <span class="status-pill ${this.getStatusClass(comp.cutStatus)}" style="padding:2px 6px;">
                          TAGLIO: ${comp.cutStatus.toUpperCase()}
                        </span>
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

  // --- SPAZIO PRINCIPALE: SFONDO FINCHÉ NON SELEZIONI IL PRIMO PEZZO ---

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

    return `
      <section class="liquid-glass component-workstation">
        <!-- Barra Superiore della Workstation Telaio -->
        <div class="workstation-header">
          <div class="workstation-title-box">
            <div class="workstation-page-tag font-mono">
              PAGINA ${comp.pageNumber} DI ${project.totalComponents || project.components.length} · TAVOLA ${comp.code}
            </div>
            <div class="workstation-main-title">${comp.title}</div>
            ${comp.note ? `
              <div style="font-size:11px; font-family:var(--font-mono); color:#FFFFFF; background:var(--glass-subtle); border:var(--glass-border-light); padding:4px 8px; margin-top:4px;">
                NOTA OFFICINA: ${comp.note}
              </div>
            ` : ''}
          </div>

          <div class="workstation-actions">
            <!-- Cronometro Tattile Lavorazione Attiva -->
            <button class="btn-timer ${isTimerActiveOnThisComp ? 'running' : ''}" id="btn-toggle-work-timer" data-timer-comp-id="${comp.id}" title="Avvia/Arresta cronometro reale lavorazione">
              ${isTimerActiveOnThisComp 
                ? `⏱ IN CORSO: ${this.formatTimerTime(this.activeTimer.elapsedSeconds)} [ STOP & SALVA ]` 
                : `⏱ AVVIA CRONOMETRO`}
            </button>

            <!-- Azione Rapida Taglio -->
            <button class="btn-solid-white font-mono" data-action-toggle-cut="${comp.id}" style="${comp.cutStatus === 'completed' ? 'background:#FFFFFF; color:#000000;' : 'background:transparent; color:#FFFFFF; border:1px solid #FFFFFF;'}">
              TAGLIO: ${comp.cutStatus === 'completed' ? 'COMPLETATO' : 'IN CORSO (SEGNA FATTO)'}
            </button>

            <!-- Azione Rapida Montaggio Banco (con Vincolo Bloccante Gatekeeper) -->
            <button class="btn-outline-white font-mono" data-action-toggle-assembly="${comp.id}" style="${comp.assemblyStatus === 'completed' ? 'background:#FFFFFF; color:#000000;' : ''}">
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

          <!-- Distinta Morali e Spunta Pezzi in Millimetri -->
          <div class="workstation-morali-box">
            <div class="section-title">
              <span>DISTINTA MORALI & PEZZI</span>
              <span class="font-mono" id="workstation-morali-status-text" style="font-size:11px; color:var(--text-secondary);">
                ${checkedCount}/${totalCount} PEZZI · ${totalCount > 0 && checkedCount === totalCount ? 'TUTTI TAGLIATI' : 'IN LAVORAZIONE'}
              </span>
            </div>

            <div class="morali-list" style="flex:1; overflow-y:auto; max-height:440px;">
              ${morali.length === 0 ? `
                <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:11px; font-family:var(--font-mono);">
                  Nessun pezzo associato a questa tavola.
                </div>
              ` : morali.map(m => `
                <div class="moral-item ${m.checked ? 'checked' : ''}" data-moral-comp-id="${comp.id}" data-moral-id="${m.id}">
                  <div class="moral-checkbox">
                    ${m.checked ? '✓' : ''}
                  </div>

                  <div class="moral-details font-mono">
                    <span class="moral-qty">NR ${m.qty}</span>
                    <span class="moral-len">L. ${m.length} MM</span>
                    <span class="moral-desc">${m.desc}</span>
                  </div>

                  ${AUTH.isAdmin ? `
                    <button class="moral-delete-btn" data-delete-moral-comp-id="${comp.id}" data-delete-moral-id="${m.id}" title="Elimina pezzo">
                      [X]
                    </button>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            ${AUTH.isAdmin ? `
              <button class="btn-add-moral" data-add-moral-comp-id="${comp.id}">
                + AGGIUNGI MORALE A MATITA
              </button>
            ` : ''}
          </div>
        </div>
      </section>
    `;
  }

  // --- GESTIONE CRONOMETRO TATTILE LAVORAZIONE ---

  isTimerRunningFor(compId) {
    return this.activeTimer.running && this.activeTimer.componentId === compId;
  }

  formatTimerTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  toggleWorkTimer(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!comp || !proj) return;

    if (this.isTimerRunningFor(compId)) {
      // Ferma e registra
      clearInterval(this.activeTimer.intervalId);
      const durationMins = Math.max(1, Math.round(this.activeTimer.elapsedSeconds / 60));
      const now = new Date();
      const endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      DB.logWork(
        proj.title,
        comp.code,
        'Lavorazione Banco/Troncatrice',
        AUTH.activeOperator.name,
        this.activeTimer.startTimeStr,
        endTimeStr,
        durationMins
      );

      this.sound.playSuccess();
      this.broadcastDataUpdate();

      this.activeTimer = {
        running: false,
        projectId: null,
        componentId: null,
        componentCode: '',
        projectName: '',
        startTimeStr: '',
        startTimeObj: null,
        elapsedSeconds: 0,
        intervalId: null
      };

      this.selectComponent(compId);
    } else {
      // Se c'era un altro timer attivo, resettalo
      if (this.activeTimer.intervalId) {
        clearInterval(this.activeTimer.intervalId);
      }

      this.sound.playTick();
      const now = new Date();
      const startTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      this.activeTimer = {
        running: true,
        projectId: this.selectedProjectId,
        componentId: compId,
        componentCode: comp.code,
        projectName: proj.title,
        startTimeStr,
        startTimeObj: now,
        elapsedSeconds: 0,
        intervalId: setInterval(() => {
          this.activeTimer.elapsedSeconds++;
          const btn = document.getElementById('btn-toggle-work-timer');
          if (btn) {
            btn.textContent = `⏱ IN CORSO: ${this.formatTimerTime(this.activeTimer.elapsedSeconds)} [ STOP & SALVA ]`;
          }
        }, 1000)
      };

      this.selectComponent(compId);
    }
  }

  // --- MENU CONTESTUALE TASTO DESTRO (LIQUID GLASS) ---

  renderContextMenu() {
    return `<div id="liquid-context-menu" class="liquid-context-menu"></div>`;
  }

  showContextMenu(x, y, items, title = 'OPZIONI') {
    const menu = document.getElementById('liquid-context-menu');
    if (!menu) return;

    menu.innerHTML = `
      <div class="context-menu-header">${title}</div>
      ${items.map((item, idx) => `
        <div class="context-menu-item ${item.destructive ? 'destructive' : ''}" data-menu-action="${idx}">
          ${item.label}
        </div>
      `).join('')}
    `;

    menu.style.display = 'flex';
    const menuWidth = 240;
    const menuHeight = items.length * 38 + 36;
    const posX = (x + menuWidth > window.innerWidth) ? (x - menuWidth) : x;
    const posY = (y + menuHeight > window.innerHeight) ? (y - menuHeight) : y;

    menu.style.left = `${Math.max(10, posX)}px`;
    menu.style.top = `${Math.max(10, posY)}px`;

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(menu,
        { opacity: 0, scale: 0.94, y: -4 },
        { opacity: 1, scale: 1, y: 0, duration: 0.16, ease: 'power2.out' }
      );
    }

    // Associazione eventi
    items.forEach((item, idx) => {
      const el = menu.querySelector(`[data-menu-action="${idx}"]`);
      if (el) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hideContextMenu();
          item.action();
        });
      }
    });
  }

  hideContextMenu() {
    const menu = document.getElementById('liquid-context-menu');
    if (menu) menu.style.display = 'none';
  }

  // --- POP-UP DI CONFERMA A TEMA AL CENTRO DELLA PAGINA (ZERO ALERT NATIVI) ---

  showConfirmModal({ title, message, confirmText = 'CONFERMA', cancelText = 'ANNULLA', isDestructive = false, onConfirm }) {
    const modal = document.getElementById('modal-theme-confirm');
    if (!modal) return;

    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;

    const confirmBtn = document.getElementById('btn-confirm-modal-action');
    const cancelBtn = document.getElementById('btn-confirm-modal-cancel');

    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    if (isDestructive) {
      confirmBtn.className = 'btn-solid-white';
      confirmBtn.style.background = '#FF3333';
      confirmBtn.style.borderColor = '#FF3333';
      confirmBtn.style.color = '#FFFFFF';
    } else {
      confirmBtn.className = 'btn-solid-white';
      confirmBtn.style.background = '#FFFFFF';
      confirmBtn.style.borderColor = '#FFFFFF';
      confirmBtn.style.color = '#000000';
    }

    const card = modal.querySelector('.confirm-popup-card');

    const newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    const closeModalAnimated = (callback) => {
      if (typeof gsap !== 'undefined' && card) {
        gsap.to(card, {
          opacity: 0,
          scale: 0.95,
          duration: 0.18,
          ease: 'power2.in',
          onComplete: () => {
            modal.style.display = 'none';
            if (callback) callback();
          }
        });
      } else {
        modal.style.display = 'none';
        if (callback) callback();
      }
    };

    newConfirm.addEventListener('click', () => {
      closeModalAnimated(onConfirm);
    });

    newCancel.addEventListener('click', () => {
      closeModalAnimated();
    });

    modal.style.display = 'flex';
    if (typeof gsap !== 'undefined' && card) {
      gsap.fromTo(card,
        { opacity: 0, scale: 0.94, rotateX: -6, y: -10 },
        { opacity: 1, scale: 1, rotateX: 0, y: 0, duration: 0.32, ease: 'power3.out' }
      );
    }
  }

  // ==========================================================================
  // 3. TRANSIZIONI FLUIDE E 3D SWITCHING CHOREOGRAPHY
  // ==========================================================================

  switchToComponents(projectId) {
    this.sound.playSwitch();
    this.selectedProjectId = projectId;
    this.currentNavLevel = 'components';
    this.selectedComponentId = null;
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;

    const projectsPanel = document.querySelector('.nav-panel-projects');
    const componentsPanel = document.querySelector('.nav-panel-components');
    const mainStage = document.querySelector('.main-stage');

    if (projectsPanel && componentsPanel) {
      componentsPanel.innerHTML = this.renderComponentsPanelContent();

      if (typeof gsap !== 'undefined') {
        gsap.to(projectsPanel, {
          x: -75,
          rotateY: -22,
          z: -90,
          opacity: 0,
          filter: 'blur(4px)',
          duration: 0.42,
          ease: 'power3.inOut',
          onComplete: () => {
            projectsPanel.classList.remove('state-active');
            projectsPanel.classList.add('state-hidden');
          }
        });

        componentsPanel.classList.remove('state-hidden');
        componentsPanel.classList.add('state-active');
        gsap.fromTo(componentsPanel,
          { x: 75, rotateY: 22, z: -90, opacity: 0, filter: 'blur(4px)' },
          { x: 0, rotateY: 0, z: 0, opacity: 1, filter: 'blur(0px)', duration: 0.48, ease: 'power3.out' }
        );

        gsap.fromTo('.component-item-card',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, stagger: 0.035, duration: 0.35, delay: 0.1, ease: 'power2.out' }
        );
      } else {
        projectsPanel.classList.remove('state-active');
        projectsPanel.classList.add('state-hidden');
        componentsPanel.classList.remove('state-hidden');
        componentsPanel.classList.add('state-active');
      }
    }

    if (mainStage) {
      mainStage.innerHTML = this.renderMainStageContent();
      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.empty-stage-hud',
          { opacity: 0, scale: 0.96, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'power3.out' }
        );
      }
    }

    this.initAtroposCards();
    this.bindComponentPanelEvents();
    this.bindBackBtnEvent();
  }

  switchToProjects() {
    this.sound.playSwitch();
    this.currentNavLevel = 'projects';

    const projectsPanel = document.querySelector('.nav-panel-projects');
    const componentsPanel = document.querySelector('.nav-panel-components');

    if (projectsPanel && componentsPanel) {
      if (typeof gsap !== 'undefined') {
        gsap.to(componentsPanel, {
          x: 75,
          rotateY: 22,
          z: -90,
          opacity: 0,
          filter: 'blur(4px)',
          duration: 0.42,
          ease: 'power3.inOut',
          onComplete: () => {
            componentsPanel.classList.remove('state-active');
            componentsPanel.classList.add('state-hidden');
          }
        });

        projectsPanel.classList.remove('state-hidden');
        projectsPanel.classList.add('state-active');
        gsap.fromTo(projectsPanel,
          { x: -75, rotateY: -22, z: -90, opacity: 0, filter: 'blur(4px)' },
          { x: 0, rotateY: 0, z: 0, opacity: 1, filter: 'blur(0px)', duration: 0.48, ease: 'power3.out' }
        );

        gsap.fromTo('.project-item-card',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, stagger: 0.035, duration: 0.35, delay: 0.1, ease: 'power2.out' }
        );
      } else {
        componentsPanel.classList.remove('state-active');
        componentsPanel.classList.add('state-hidden');
        projectsPanel.classList.remove('state-hidden');
        projectsPanel.classList.add('state-active');
      }
    }

    this.initAtroposCards();
  }

  selectComponent(compId) {
    this.sound.playSwitch();
    this.selectedComponentId = compId;
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;

    // Aggiorna stato attivo nella lista telai
    document.querySelectorAll('.component-item-card').forEach(c => {
      if (c.dataset.selectComponentId === compId) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    const mainStage = document.querySelector('.main-stage');
    if (mainStage) {
      mainStage.innerHTML = this.renderMainStageContent();

      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.component-workstation',
          { opacity: 0, rotateX: 7, z: -45, y: 22 },
          { opacity: 1, rotateX: 0, z: 0, y: 0, duration: 0.52, ease: 'power3.out' }
        );
        gsap.fromTo('.workstation-cad-box',
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.45, delay: 0.08, ease: 'power2.out' }
        );
        gsap.fromTo('.moral-item',
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, stagger: 0.035, duration: 0.35, delay: 0.15, ease: 'power2.out' }
        );
      }

      this.bindCadZoomEvents();
      this.bindWorkstationEvents();
    }
  }

  closeWorkstation() {
    this.sound.playSwitch();
    this.selectedComponentId = null;

    document.querySelectorAll('.component-item-card').forEach(c => c.classList.remove('active'));

    const mainStage = document.querySelector('.main-stage');
    if (mainStage) {
      if (typeof gsap !== 'undefined') {
        gsap.to('.component-workstation', {
          opacity: 0,
          rotateX: -6,
          y: -15,
          duration: 0.32,
          ease: 'power2.in',
          onComplete: () => {
            mainStage.innerHTML = this.renderMainStageContent();
            gsap.fromTo('.empty-stage-hud',
              { opacity: 0, scale: 0.96 },
              { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }
            );
          }
        });
      } else {
        mainStage.innerHTML = this.renderMainStageContent();
      }
    }
  }

  // --- SPUNTA MORALE & AGGIORNAMENTO DINAMICO DEI CONTATORI IN TEMPO REALE ---

  toggleMoral(compId, moralId) {
    this.sound.playTick();
    DB.toggleMoral(this.selectedProjectId, compId, moralId);
    this.broadcastDataUpdate();

    const comp = DB.getComponent(this.selectedProjectId, compId);
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!comp || !proj) return;

    // Aggiorna l'elemento riga morale senza distruggere zoom/pan CAD
    const item = document.querySelector(`[data-moral-comp-id="${compId}"][data-moral-id="${moralId}"]`);
    if (item) {
      const moral = comp.morali.find(m => m.id === moralId);
      if (moral) {
        if (moral.checked) {
          item.classList.add('checked');
          const chk = item.querySelector('.moral-checkbox');
          if (chk) chk.textContent = '✓';
        } else {
          item.classList.remove('checked');
          const chk = item.querySelector('.moral-checkbox');
          if (chk) chk.textContent = '';
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
      if (countMeta) countMeta.textContent = `${checkedCount}/${totalCount} PEZZI`;
    }

    // Ricalcola e anima la barra e percentuale della commessa
    const progress = DB.calculateProjectProgress(proj);
    this.updateProjectProgressBar(this.selectedProjectId, progress);

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
    if (barL1) barL1.style.width = `${targetPercent}%`;
    const valL1 = document.getElementById(`proj-progress-val-${projId}`);
    if (valL1) this.animateCounter(valL1, targetPercent);

    // Aggiorna Livello 2 (Header Telai Commessa Attiva)
    const barL2 = document.getElementById('comp-panel-progress-bar');
    if (barL2) barL2.style.width = `${targetPercent}%`;
    const valL2 = document.getElementById('comp-panel-progress-val');
    if (valL2) this.animateCounter(valL2, targetPercent);
  }

  animateCounter(el, target) {
    if (!el) return;
    if (typeof gsap === 'undefined') {
      el.textContent = `${target}%`;
      return;
    }
    const current = parseInt(el.textContent, 10) || 0;
    const obj = { val: current };
    gsap.to(obj, {
      val: target,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = `${Math.round(obj.val)}%`;
      }
    });
  }

  celebrateCompletion(isProjectTotal = false) {
    this.sound.playSuccess();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: isProjectTotal ? 90 : 45,
        spread: isProjectTotal ? 80 : 50,
        origin: { y: 0.75 },
        colors: ['#FFFFFF', '#E5E7EB', '#9CA3AF', '#4B5563', '#111827'] // Stile Architetturale Silver & Graphite B&W
      });
    }
  }

  // --- INIZIALIZZAZIONE ATROPOS 3D TILT CARDS ---

  initAtroposCards() {
    if (this.atroposInstances && this.atroposInstances.length) {
      this.atroposInstances.forEach(inst => {
        try { inst.destroy(); } catch (e) {}
      });
    }
    this.atroposInstances = [];

    if (typeof Atropos === 'undefined') return;

    document.querySelectorAll('.atropos-card-wrapper').forEach(el => {
      try {
        const inst = Atropos({
          el: el,
          activeOffset: 24,
          shadow: false,
          highlight: true,
          rotateTouch: 'scroll-y',
          rotateXMax: 10,
          rotateYMax: 10
        });
        this.atroposInstances.push(inst);
      } catch (err) {
        console.warn('Atropos init warning:', err);
      }
    });
  }

  // ==========================================================================
  // 4. EVENT BINDING & GESTIONE INTERAZIONI
  // ==========================================================================

  bindEvents() {
    // Interruttore Audio Feedback
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const enabled = this.sound.toggle();
        btnSound.className = `sound-toggle-btn ${enabled ? '' : 'muted'}`;
        btnSound.textContent = enabled ? 'AUDIO: ON' : 'AUDIO: OFF';
      });
    }

    this.bindProjectCardsEvents();
    this.bindComponentPanelEvents();
    this.bindBackBtnEvent();
    this.bindCadZoomEvents();
    this.bindWorkstationEvents();
    this.bindAdminAndModalsEvents();
  }

  bindProjectCardsEvents() {
    // Clic su Commessa: transizione fluida 3D a telai
    document.querySelectorAll('[data-select-project-id]').forEach(card => {
      card.addEventListener('click', () => {
        const projId = card.dataset.selectProjectId;
        this.switchToComponents(projId);
      });

      // Tasto Destro su Commessa (Modifica / Sostituisci PDF / Elimina)
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projId = card.dataset.contextProjectId;
        const proj = DB.getProjectById(projId);
        if (!proj) return;

        this.showContextMenu(e.clientX, e.clientY, [
          {
            label: '✎ MODIFICA DETTAGLI',
            action: () => this.openEditProjectModal(projId)
          },
          {
            label: '📄 CARICA / SOSTITUISCI PDF',
            action: () => this.openUploadPdfModal(projId)
          },
          {
            label: '🗑 ELIMINA COMMESSA',
            destructive: true,
            action: () => {
              this.showConfirmModal({
                title: 'ELIMINAZIONE COMMESSA',
                message: `Sei sicuro di voler eliminare definitivamente la commessa "${proj.title}"? Tutte le tavole e i pezzi andranno persi.`,
                confirmText: 'ELIMINA DEFINITIVAMENTE',
                isDestructive: true,
                onConfirm: () => {
                  DB.deleteProject(projId);
                  this.selectedProjectId = DB.getProjects(true)[0]?.id || '';
                  this.currentNavLevel = 'projects';
                  this.selectedComponentId = null;
                  this.broadcastDataUpdate();
                  this.render();
                }
              });
            }
          }
        ], proj.code);
      });
    });

    // Timesheet
    const timesheetBtn = document.getElementById('btn-open-timesheet-modal');
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
      backBtn.addEventListener('click', () => {
        this.switchToProjects();
      });
    }
  }

  bindComponentPanelEvents() {
    // Clic su un Telaio: carica la workstation nello spazio vuoto
    document.querySelectorAll('[data-select-component-id]').forEach(card => {
      card.addEventListener('click', () => {
        const compId = card.dataset.selectComponentId;
        this.selectComponent(compId);
      });

      // Tasto Destro su Telaio
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const compId = card.dataset.contextComponentId;
        const comp = DB.getComponent(this.selectedProjectId, compId);
        if (!comp) return;

        this.showContextMenu(e.clientX, e.clientY, [
          {
            label: '✎ MODIFICA TELAIO',
            action: () => this.openEditComponentModal(compId)
          },
          {
            label: '🖨 STAMPA ETICHETTA QR',
            action: () => this.openQrLabelModal(compId)
          },
          {
            label: '🗑 ELIMINA TELAIO',
            destructive: true,
            action: () => {
              this.showConfirmModal({
                title: 'ELIMINAZIONE TELAIO',
                message: `Confermi l'eliminazione del telaio "${comp.code} - ${comp.title}" da questa commessa?`,
                confirmText: 'ELIMINA TELAIO',
                isDestructive: true,
                onConfirm: () => {
                  DB.deleteComponent(this.selectedProjectId, compId);
                  if (this.selectedComponentId === compId) {
                    this.selectedComponentId = null;
                  }
                  this.broadcastDataUpdate();
                  this.switchToComponents(this.selectedProjectId);
                }
              });
            }
          }
        ], comp.code);
      });
    });

    // Filtro Ricerca Telai
    const filterInput = document.getElementById('input-filter-components');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        this.compSearchQuery = e.target.value;
        const compPanel = document.querySelector('.nav-panel-components');
        if (compPanel) {
          compPanel.innerHTML = this.renderComponentsPanelContent();
          this.initAtroposCards();
          this.bindComponentPanelEvents();
          this.bindBackBtnEvent();
          const newInput = document.getElementById('input-filter-components');
          if (newInput) {
            newInput.focus();
            newInput.setSelectionRange(newInput.value.length, newInput.value.length);
          }
        }
      });
    }

    // Modalità Batch Troncatrice
    const btnBatchSaw = document.getElementById('btn-open-batch-saw');
    if (btnBatchSaw) {
      btnBatchSaw.addEventListener('click', () => {
        this.openBatchSawModal();
      });
    }

    // Modifica Commessa da Header Livello 2
    const editProjBtn = document.getElementById('btn-edit-active-proj');
    if (editProjBtn) {
      editProjBtn.addEventListener('click', () => {
        this.openEditProjectModal(this.selectedProjectId);
      });
    }
  }

  bindWorkstationEvents() {
    // Chiudi Workstation
    const closeWorkstationBtn = document.getElementById('btn-close-workstation');
    if (closeWorkstationBtn) {
      closeWorkstationBtn.addEventListener('click', () => {
        this.closeWorkstation();
      });
    }

    // Cronometro Tattile Lavorazione
    const btnTimer = document.getElementById('btn-toggle-work-timer');
    if (btnTimer) {
      btnTimer.addEventListener('click', () => {
        const compId = btnTimer.dataset.timerCompId;
        this.toggleWorkTimer(compId);
      });
    }

    // Etichetta QR Posa Cantiere
    const btnQr = document.getElementById('btn-print-qr-label');
    if (btnQr) {
      btnQr.addEventListener('click', () => {
        const compId = btnQr.dataset.qrCompId;
        this.openQrLabelModal(compId);
      });
    }

    // Spunta Checkbox Morali
    document.querySelectorAll('[data-moral-comp-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.moral-delete-btn')) return;
        const compId = el.dataset.moralCompId;
        const moralId = el.dataset.moralId;
        this.toggleMoral(compId, moralId);
      });
    });

    // Eliminazione Morale con Conferma a Tema
    document.querySelectorAll('[data-delete-moral-comp-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const compId = btn.dataset.deleteMoralCompId;
        const moralId = btn.dataset.deleteMoralId;

        this.showConfirmModal({
          title: 'ELIMINAZIONE MORALE',
          message: 'Sei sicuro di voler rimuovere questo pezzo dalla distinta di taglio?',
          confirmText: 'RIMUOVI PEZZO',
          isDestructive: true,
          onConfirm: () => {
            DB.deleteMoral(this.selectedProjectId, compId, moralId);
            this.broadcastDataUpdate();
            this.selectComponent(compId);
          }
        });
      });
    });

    // Toggle Azione Taglio
    document.querySelectorAll('[data-action-toggle-cut]').forEach(btn => {
      btn.addEventListener('click', () => {
        const compId = btn.dataset.actionToggleCut;
        const comp = DB.getComponent(this.selectedProjectId, compId);
        if (!comp) return;
        this.sound.playTick();
        const nextStatus = comp.cutStatus === 'completed' ? 'todo' : 'completed';
        DB.updateOperationStatus(this.selectedProjectId, compId, 'cut', nextStatus, AUTH.activeOperator.name);
        this.broadcastDataUpdate();
        this.selectComponent(compId);
      });
    });

    // Toggle Azione Assemblaggio con VINCOLO BLOCCANTE GATEKEEPER
    document.querySelectorAll('[data-action-toggle-assembly]').forEach(btn => {
      btn.addEventListener('click', () => {
        const compId = btn.dataset.actionToggleAssembly;
        const comp = DB.getComponent(this.selectedProjectId, compId);
        if (!comp) return;

        const morali = comp.morali || [];
        const uncompletedMorali = morali.filter(m => !m.checked);

        // Se si sta completando il montaggio ma ci sono morali ancora da tagliare:
        if (comp.assemblyStatus !== 'completed' && uncompletedMorali.length > 0) {
          this.sound.playTick();
          this.showConfirmModal({
            title: 'VINCOLO PRODUZIONE: MORALI NON TAGLIATI',
            message: `ATTENZIONE: Il telaio "${comp.code} - ${comp.title}" ha ancora ${uncompletedMorali.length} pezzo/i non spuntati alla troncatrice da Francesca.\n\nVuoi procedere forzando il completamento del montaggio al banco?`,
            confirmText: 'FORZA MONTAGGIO',
            cancelText: 'ANNULLA',
            isDestructive: true,
            onConfirm: () => {
              DB.updateOperationStatus(this.selectedProjectId, compId, 'assembly', 'completed', AUTH.activeOperator.name);
              this.sound.playSuccess();
              this.broadcastDataUpdate();
              this.selectComponent(compId);
            }
          });
          return;
        }

        this.sound.playTick();
        const nextStatus = comp.assemblyStatus === 'completed' ? 'todo' : 'completed';
        DB.updateOperationStatus(this.selectedProjectId, compId, 'assembly', nextStatus, AUTH.activeOperator.name);
        this.broadcastDataUpdate();
        this.selectComponent(compId);
      });
    });

    // Aggiungi Morale
    document.querySelectorAll('[data-add-moral-comp-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.targetMoralCompId = btn.dataset.addMoralCompId;
        document.getElementById('modal-add-moral').style.display = 'flex';
      });
    });
  }

  // --- CONTROLLI ZOOM, PAN & CAD DARK BLUEPRINT INVERTED MODE ---

  bindCadZoomEvents() {
    const img = document.getElementById('cad-drawing-preview');
    const container = document.getElementById('cad-drawing-container');
    if (!img || !container) return;

    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomResetBtn = document.getElementById('btn-zoom-reset');
    const zoomInvertBtn = document.getElementById('btn-zoom-invert');
    const zoomFullscreenBtn = document.getElementById('btn-zoom-fullscreen');

    const updateTransform = () => {
      img.style.transform = `scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px)`;
    };

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.sound.playTick();
        this.zoomLevel = Math.min(4.0, this.zoomLevel + 0.25);
        updateTransform();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.sound.playTick();
        this.zoomLevel = Math.max(0.7, this.zoomLevel - 0.25);
        updateTransform();
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        this.sound.playTick();
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        updateTransform();
      });
    }

    if (zoomInvertBtn) {
      zoomInvertBtn.addEventListener('click', () => {
        this.sound.playTick();
        this.isCadInverted = !this.isCadInverted;
        if (this.isCadInverted) {
          container.classList.add('cad-inverted');
          zoomInvertBtn.style.background = '#FFFFFF';
          zoomInvertBtn.style.color = '#000000';
        } else {
          container.classList.remove('cad-inverted');
          zoomInvertBtn.style.background = 'transparent';
          zoomInvertBtn.style.color = 'var(--text-secondary)';
        }
      });
    }

    if (zoomFullscreenBtn) {
      zoomFullscreenBtn.addEventListener('click', () => {
        this.sound.playTick();
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  // --- MODALITÀ TRONCATRICE BATCH (DISTINTA CUMULATIVA & NESTING) ---

  openBatchSawModal() {
    const list = DB.getBatchCuttingList(this.selectedProjectId);
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!proj) return;

    this.sound.playSwitch();
    const modal = document.getElementById('modal-batch-saw');
    if (!modal) return;

    // Calcolo totali aggregati
    const totalMeters = list.reduce((acc, i) => acc + parseFloat(i.totalLinearM), 0).toFixed(1);
    const totalBars = list.reduce((acc, i) => acc + i.barsNeeded, 0);
    const avgWaste = list.length > 0 ? (list.reduce((acc, i) => acc + parseFloat(i.wastePercent), 0) / list.length).toFixed(1) : '0.0';

    const summaryEl = document.getElementById('batch-saw-metrics');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="nesting-metric">
          <span class="nesting-metric-label">COMMESSA</span>
          <span class="nesting-metric-val">${proj.code}</span>
        </div>
        <div class="nesting-metric">
          <span class="nesting-metric-label">SVILUPPO LINEARE TOTALE</span>
          <span class="nesting-metric-val">${totalMeters} M</span>
        </div>
        <div class="nesting-metric">
          <span class="nesting-metric-label">BARRE STANDARD 6.00M</span>
          <span class="nesting-metric-val">${totalBars} BARRE</span>
        </div>
        <div class="nesting-metric">
          <span class="nesting-metric-label">SFRIDO MEDIO STIMATO</span>
          <span class="nesting-metric-val">${avgWaste}%</span>
        </div>
      `;
    }

    const tbody = document.getElementById('batch-saw-tbody');
    if (tbody) {
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">Nessun pezzo da tagliare per questa commessa.</td></tr>`;
      } else {
        tbody.innerHTML = list.map(item => `
          <tr class="${item.isCompleted ? 'completed' : ''}">
            <td style="font-weight:700; color:#FFFFFF;">NR ${item.totalQty}</td>
            <td style="font-weight:700;">${item.lengthStr} MM</td>
            <td style="color:var(--text-secondary);">${item.desc}</td>
            <td style="color:var(--text-muted); font-size:10px;">${item.componentCodesStr}</td>
            <td>${item.barsNeeded} BARRE (6m)</td>
            <td style="color:${parseFloat(item.wastePercent) > 10 ? '#FF8888' : '#88FF88'};">${item.wastePercent}% SFRIDO</td>
          </tr>
        `).join('');
      }
    }

    modal.style.display = 'flex';
  }

  // --- ETICHETTA QR CODE TECNICA PER CANTIERE ---

  openQrLabelModal(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!comp || !proj) return;

    this.sound.playSwitch();
    const modal = document.getElementById('modal-qr-label');
    if (!modal) return;

    document.getElementById('qr-label-code').textContent = comp.code;
    document.getElementById('qr-label-title').textContent = comp.title;
    document.getElementById('qr-label-project').textContent = `${proj.title} (${proj.code})`;
    document.getElementById('qr-label-client').textContent = proj.client;
    document.getElementById('qr-label-page').textContent = `TAVOLA SEMA PAGINA ${comp.pageNumber} DI ${proj.totalComponents || proj.components.length}`;
    document.getElementById('qr-label-notes').textContent = comp.note ? `NOTE OFFICINA: ${comp.note}` : 'NESSUNA NOTA SPECIFICA (POSA STANDARD)';
    document.getElementById('qr-label-date').textContent = new Date().toLocaleDateString('it-IT');

    // Generazione Codice QR reale
    const qrContainer = document.getElementById('qr-code-svg-slot');
    if (qrContainer) {
      const qrPayload = `MPA_SEMA|COMM:${proj.code}|TELAIO:${comp.code}|PAGE:${comp.pageNumber}|CLIENT:${proj.client}`;
      qrContainer.innerHTML = this.generateQrSvg(qrPayload);
    }

    modal.style.display = 'flex';
  }

  generateQrSvg(text) {
    if (typeof qrcode !== 'undefined') {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        return qr.createSvgTag(4, 0);
      } catch (e) {
        console.warn('Errore rendering qrcode-generator:', e);
      }
    }
    // Fallback SVG QR geometrico puro
    return `
      <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="140" height="140" fill="white"/>
        <rect x="10" y="10" width="40" height="40" fill="black"/>
        <rect x="16" y="16" width="28" height="28" fill="white"/>
        <rect x="22" y="22" width="16" height="16" fill="black"/>
        <rect x="90" y="10" width="40" height="40" fill="black"/>
        <rect x="96" y="16" width="28" height="28" fill="white"/>
        <rect x="102" y="22" width="16" height="16" fill="black"/>
        <rect x="10" y="90" width="40" height="40" fill="black"/>
        <rect x="16" y="96" width="28" height="28" fill="white"/>
        <rect x="22" y="102" width="16" height="16" fill="black"/>
        <rect x="60" y="20" width="20" height="10" fill="black"/>
        <rect x="60" y="40" width="10" height="20" fill="black"/>
        <rect x="80" y="60" width="20" height="20" fill="black"/>
        <rect x="60" y="90" width="20" height="10" fill="black"/>
        <rect x="90" y="90" width="10" height="30" fill="black"/>
        <rect x="110" y="100" width="20" height="20" fill="black"/>
      </svg>
    `;
  }

  populateTimesheetModal() {
    const workLogs = DB.data.workLogs || [];
    const tbody = document.getElementById('timesheet-tbody');
    if (!tbody) return;

    if (workLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">Nessuna lavorazione registrata.</td></tr>`;
      return;
    }

    tbody.innerHTML = workLogs.map(log => `
      <tr>
        <td><strong>${log.projectName}</strong><br><span style="color:var(--text-muted); font-size:10px;">${log.componentCode}</span></td>
        <td>${log.phase}</td>
        <td>${log.operator}</td>
        <td>${log.startTime} - ${log.endTime} ${log.durationMinutes ? `(${log.durationMinutes} min)` : ''}</td>
        <td><span class="status-pill status-done">${log.status}</span></td>
      </tr>
    `).join('');
  }

  // --- MODALI, PDF PROCESSING & ADMIN AUTH ---

  bindAdminAndModalsEvents() {
    this.setupPdfDropzone('pdf-dropzone', 'pdf-file-input', 'pdf-dropzone-selected');
    this.setupPdfDropzone('replace-pdf-dropzone', 'replace-pdf-file-input', 'replace-pdf-dropzone-selected');

    // Pulsante Cambio Operatore
    const btnOp = document.getElementById('btn-change-operator');
    if (btnOp) {
      btnOp.addEventListener('click', () => {
        document.getElementById('modal-operator').style.display = 'flex';
      });
    }

    // Logout Admin
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    if (btnAdminLogout) {
      btnAdminLogout.addEventListener('click', () => {
        AUTH.logoutAdmin();
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

    // Selezione Operatore
    document.querySelectorAll('.operator-select-btn').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.operator-remove-link')) return;
        const opId = card.dataset.operatorId;
        AUTH.setActiveOperator(opId);
        this.closeAllModals();
        this.render();
      });
    });

    // Rimozione Operatore (Michele Admin)
    document.querySelectorAll('.operator-remove-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        const opId = link.dataset.removeOpId;
        this.showConfirmModal({
          title: 'RIMOZIONE OPERATORE',
          message: 'Sei sicuro di voler rimuovere questo operatore dalla squadra di produzione?',
          confirmText: 'RIMUOVI',
          isDestructive: true,
          onConfirm: () => {
            DB.removeOperator(opId);
            this.broadcastDataUpdate();
            this.render();
          }
        });
      });
    });

    // Aggiunta Nuovo Operatore (Michele Admin)
    const btnSaveNewOp = document.getElementById('btn-save-new-operator');
    if (btnSaveNewOp) {
      btnSaveNewOp.addEventListener('click', () => {
        const name = document.getElementById('new-op-name').value.trim();
        const role = document.getElementById('new-op-role').value.trim();
        if (!name) return;
        DB.addOperator({
          id: 'op-' + Date.now(),
          name,
          role: role || 'Operatore di Produzione'
        });
        this.broadcastDataUpdate();
        this.closeAllModals();
        this.render();
      });
    }

    // PIN Pad Digit Handling
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
                this.sound.playSuccess();
                this.closeAllModals();
                this.render();
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
        this.sound.playTick();
        AUTH.enteredPin = AUTH.enteredPin.slice(0, -1);
        this.updatePinDots();
      });
    }

    // Nuova Commessa Admin con Caricamento PDF
    const openNewProjBtn = document.getElementById('btn-open-new-project');
    if (openNewProjBtn) {
      openNewProjBtn.addEventListener('click', () => {
        this.selectedPdfFile = null;
        const sel = document.getElementById('pdf-dropzone-selected');
        if (sel) sel.style.display = 'none';
        document.getElementById('modal-new-project').style.display = 'flex';
      });
    }

    const saveNewProjBtn = document.getElementById('btn-save-new-project');
    if (saveNewProjBtn) {
      saveNewProjBtn.addEventListener('click', async () => {
        const title = document.getElementById('new-proj-title').value.trim();
        const client = document.getElementById('new-proj-client').value.trim();
        const deadline = document.getElementById('new-proj-deadline').value;
        const isConfidential = document.getElementById('new-proj-confidential')?.checked || false;
        if (!title) return;

        saveNewProjBtn.textContent = 'ELABORAZIONE PDF...';
        saveNewProjBtn.disabled = true;

        let components = [];
        if (this.selectedPdfFile) {
          components = await this.processPdfOrImageFile(this.selectedPdfFile);
        }

        // Se nessun file caricato, carica preset tavole reali SEMA
        if (components.length === 0) {
          components = [
            {
              id: 'comp-' + Date.now() + '-1',
              code: 'PM 01',
              title: 'TELAIO DI BASE',
              pageNumber: 1,
              image: 'assets/drawings/photo_1_2026-10-01_15-40-04.jpg',
              cutStatus: 'todo',
              assemblyStatus: 'todo',
              morali: [
                { id: 'm1', qty: 2, length: '3034.00', desc: 'Correnti longitudinali', checked: false },
                { id: 'm2', qty: 2, length: '1200.00', desc: 'Montanti testata', checked: false },
                { id: 'm3', qty: 4, length: '900.00', desc: 'Ritti divisori', checked: false }
              ]
            },
            {
              id: 'comp-' + Date.now() + '-2',
              code: 'PM 02',
              title: 'TELAIO COPERTURA',
              pageNumber: 2,
              image: 'assets/drawings/photo_2_2026-10-01_15-40-04.jpg',
              cutStatus: 'todo',
              assemblyStatus: 'todo',
              morali: [
                { id: 'm4', qty: 4, length: '2150.00', desc: 'Arcarecci falda', checked: false },
                { id: 'm5', qty: 2, length: '3200.00', desc: 'Banchina e colmo', checked: false }
              ]
            }
          ];
        }

        const newId = 'proj-' + Date.now();
        DB.addProject({
          id: newId,
          code: 'COM-' + new Date().getFullYear() + '-' + Math.floor(10 + Math.random() * 90),
          title,
          client: client || 'Generale',
          category: 'Produzione SEMA',
          status: 'in_progress',
          isConfidential,
          deadline: deadline || '2026-11-30',
          coverNotes: 'Caricata da PDF SEMA',
          cadSoftware: 'SEMA Software 4.0',
          totalComponents: components.length,
          components
        });

        this.selectedProjectId = newId;
        this.currentNavLevel = 'components';
        this.selectedComponentId = null;
        this.broadcastDataUpdate();
        this.closeAllModals();
        this.render();
      });
    }

    // Modifica Commessa
    const saveEditProjBtn = document.getElementById('btn-save-edit-proj');
    if (saveEditProjBtn) {
      saveEditProjBtn.addEventListener('click', () => {
        const title = document.getElementById('edit-proj-title').value.trim();
        const client = document.getElementById('edit-proj-client').value.trim();
        const deadline = document.getElementById('edit-proj-deadline').value;
        DB.updateProject(this.selectedProjectId, { title, client, deadline });
        this.broadcastDataUpdate();
        this.closeAllModals();
        this.render();
      });
    }

    const deleteProjBtn = document.getElementById('btn-delete-active-proj');
    if (deleteProjBtn) {
      deleteProjBtn.addEventListener('click', () => {
        const proj = DB.getProjectById(this.selectedProjectId);
        this.showConfirmModal({
          title: 'ELIMINAZIONE COMMESSA',
          message: `Confermi l'eliminazione della commessa "${proj?.title}"? L'azione è irreversibile.`,
          confirmText: 'ELIMINA DEFINITIVAMENTE',
          isDestructive: true,
          onConfirm: () => {
            DB.deleteProject(this.selectedProjectId);
            this.selectedProjectId = DB.getProjects(true)[0]?.id || '';
            this.currentNavLevel = 'projects';
            this.selectedComponentId = null;
            this.broadcastDataUpdate();
            this.closeAllModals();
            this.render();
          }
        });
      });
    }

    // Modale Sostituisci PDF
    const saveReplacePdfBtn = document.getElementById('btn-save-replace-pdf');
    if (saveReplacePdfBtn) {
      saveReplacePdfBtn.addEventListener('click', async () => {
        if (!this.selectedPdfFile || !this.targetUploadProjectId) return;
        saveReplacePdfBtn.textContent = 'ELABORAZIONE...';
        saveReplacePdfBtn.disabled = true;

        const components = await this.processPdfOrImageFile(this.selectedPdfFile);
        if (components.length > 0) {
          DB.updateProject(this.targetUploadProjectId, {
            components,
            totalComponents: components.length
          });
        }
        this.broadcastDataUpdate();
        this.closeAllModals();
        this.render();
      });
    }

    // Modale Modifica Telaio
    const saveEditCompBtn = document.getElementById('btn-save-edit-comp');
    if (saveEditCompBtn) {
      saveEditCompBtn.addEventListener('click', () => {
        if (!this.targetEditCompId) return;
        const code = document.getElementById('edit-comp-code').value.trim();
        const title = document.getElementById('edit-comp-title').value.trim();
        const note = document.getElementById('edit-comp-note').value.trim();

        DB.updateComponent(this.selectedProjectId, this.targetEditCompId, { code, title, note });
        this.broadcastDataUpdate();
        this.closeAllModals();
        this.render();
      });
    }

    // Modal Aggiunta Morale
    const saveAddMoralBtn = document.getElementById('btn-save-new-moral');
    if (saveAddMoralBtn) {
      saveAddMoralBtn.addEventListener('click', () => {
        const qty = document.getElementById('new-moral-qty').value;
        const len = document.getElementById('new-moral-len').value.trim();
        const desc = document.getElementById('new-moral-desc').value.trim();
        if (!len || !this.targetMoralCompId) return;

        DB.addMoral(this.selectedProjectId, this.targetMoralCompId, qty, len, desc);
        this.broadcastDataUpdate();
        this.closeAllModals();
        this.selectComponent(this.targetMoralCompId);
      });
    }
  }

  // --- DROPZONE & MOTORE PDF.JS ---

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
      selectedLabel.style.display = 'inline-block';
      selectedLabel.textContent = `File: ${file.name} (${Math.round(file.size / 1024)} KB)`;
    }
  }

  async processPdfOrImageFile(file) {
    if (file.type === 'application/pdf' && window.pdfjsLib) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const components = [];

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.75 });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport }).promise;
          const imageUrl = canvas.toDataURL('image/jpeg', 0.85);

          let code = `PM ${String(pageNum).padStart(2, '0')}`;
          let title = `TELAIO PAGINA ${pageNum}`;
          let morali = [];

          try {
            const textContent = await page.getTextContent();
            const text = textContent.items.map(i => i.str).join(' ');

            const pmMatch = text.match(/PM\s*\d+(\s*-\s*PM\s*\d+)?/i);
            if (pmMatch) code = pmMatch[0].toUpperCase();

            const titleMatch = text.match(/NR\s*\d+\s*TELAIO[^\n\r,]+/i);
            if (titleMatch) title = titleMatch[0].toUpperCase();

            const moraliMatches = [...text.matchAll(/NR\s*(\d+)\s*L\.?\s*([\d\.,]+)/gi)];
            morali = moraliMatches.map((m, idx) => ({
              id: `m-pdf-${pageNum}-${idx + 1}`,
              qty: parseInt(m[1], 10),
              length: m[2],
              desc: 'Elemento strutturale',
              checked: false
            }));
          } catch (e) {
            console.warn('Errore parsing testo pagina PDF', e);
          }

          if (morali.length === 0) {
            morali = [
              { id: `m-def-${pageNum}-1`, qty: 2, length: '3034.00', desc: 'Montanti principali', checked: false },
              { id: `m-def-${pageNum}-2`, qty: 4, length: '1200.00', desc: 'Traversini di raccordo', checked: false }
            ];
          }

          components.push({
            id: `comp-pdf-${Date.now()}-${pageNum}`,
            code,
            title,
            pageNumber: pageNum,
            image: imageUrl,
            cutStatus: 'todo',
            assemblyStatus: 'todo',
            morali
          });
        }

        return components;
      } catch (err) {
        console.error('Errore rendering PDF.js:', err);
      }
    }

    if (file.type.startsWith('image/')) {
      const dataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      return [{
        id: `comp-img-${Date.now()}`,
        code: 'PM 01',
        title: file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
        pageNumber: 1,
        image: dataUrl,
        cutStatus: 'todo',
        assemblyStatus: 'todo',
        morali: [
          { id: 'm-img-1', qty: 2, length: '3034.00', desc: 'Correnti longitudinali', checked: false },
          { id: 'm-img-2', qty: 4, length: '1100.00', desc: 'Traversini', checked: false }
        ]
      }];
    }

    return [];
  }

  openEditProjectModal(projId) {
    const proj = DB.getProjectById(projId);
    if (!proj) return;
    this.selectedProjectId = projId;
    document.getElementById('edit-proj-title').value = proj.title;
    document.getElementById('edit-proj-client').value = proj.client;
    document.getElementById('edit-proj-deadline').value = proj.deadline;
    document.getElementById('modal-edit-project').style.display = 'flex';
  }

  openUploadPdfModal(projId) {
    this.targetUploadProjectId = projId;
    this.selectedPdfFile = null;
    const sel = document.getElementById('replace-pdf-dropzone-selected');
    if (sel) sel.style.display = 'none';
    document.getElementById('modal-replace-pdf').style.display = 'flex';
  }

  openEditComponentModal(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    if (!comp) return;
    this.targetEditCompId = compId;
    document.getElementById('edit-comp-code').value = comp.code;
    document.getElementById('edit-comp-title').value = comp.title;
    document.getElementById('edit-comp-note').value = comp.note || '';
    document.getElementById('modal-edit-component').style.display = 'flex';
  }

  updatePinDots() {
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`pin-dot-${i}`);
      if (dot) {
        if (i <= AUTH.enteredPin.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      }
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    const confirmOverlay = document.getElementById('modal-theme-confirm');
    if (confirmOverlay) confirmOverlay.style.display = 'none';
    AUTH.enteredPin = '';
  }

  renderStealthAdminButton() {
    return `
      <div class="stealth-admin-trigger" id="btn-stealth-admin" title="Accesso Amministratore Riservato">
        [ ADMIN ]
      </div>
    `;
  }

  renderModals() {
    const operators = DB.getOperators();

    return `
      <!-- POP-UP DI CONFERMA A TEMA AL CENTRO DELLA PAGINA (ZERO ALERT NATIVI) -->
      <div id="modal-theme-confirm" class="confirm-popup-overlay">
        <div class="confirm-popup-card">
          <div class="confirm-popup-header">
            <h3 class="confirm-popup-title" id="confirm-modal-title">CONFERMA OPERAZIONE</h3>
          </div>
          <div class="confirm-popup-body" id="confirm-modal-message">
            Sei sicuro di voler procedere?
          </div>
          <div class="confirm-popup-footer">
            <button class="btn-outline-white font-mono" id="btn-confirm-modal-cancel">ANNULLA</button>
            <button class="btn-solid-white font-mono" id="btn-confirm-modal-action">CONFERMA</button>
          </div>
        </div>
      </div>

      <!-- Modal Batch Troncatrice & Nesting Cumulativo Commessa -->
      <div id="modal-batch-saw" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:820px;">
          <div class="modal-header">
            <h3>DISTINTA CUMULATIVA TRONCATRICE & CALCOLO BARRE GREZZE (6.00 M)</h3>
            <button class="btn-outline-sm" id="btn-close-batch-saw">[X]</button>
          </div>
          <div class="modal-body">
            <div class="nesting-summary-card" id="batch-saw-metrics"></div>
            <div style="overflow-x:auto; max-height:450px;">
              <table class="batch-saw-table">
                <thead>
                  <tr>
                    <th>Q.TÀ TOTALE</th>
                    <th>LUNGHEZZA</th>
                    <th>DESCRIZIONE</th>
                    <th>TELAI DESTINAZIONE</th>
                    <th>BARRE 6M STIMATE</th>
                    <th>% SFRIDO</th>
                  </tr>
                </thead>
                <tbody id="batch-saw-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Etichetta QR Posa Cantiere -->
      <div id="modal-qr-label" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:540px;">
          <div class="modal-header">
            <h3>ETICHETTA TECNICA CON QR CODE (POSA IN OPERA)</h3>
            <button class="btn-outline-sm" id="btn-close-qr-label">[X]</button>
          </div>
          <div class="modal-body" id="qr-label-print-area">
            <div class="qr-label-card">
              <div class="qr-label-header">
                <div>
                  <div class="qr-label-brand">MPA DI MAURIZIO CAVALLARO</div>
                  <div style="font-size:9px; color:#666; margin-top:2px;">SEMA CAD/CAM 4.0 · CONTROLLO PRODUZIONE</div>
                </div>
                <div style="font-size:10px; font-weight:700;" id="qr-label-date"></div>
              </div>

              <div class="qr-label-grid">
                <div>
                  <div class="qr-label-field">
                    <label>CODICE TELAIO</label>
                    <div class="val val-big" id="qr-label-code"></div>
                  </div>
                  <div class="qr-label-field">
                    <label>DESCRIZIONE ELEMENTO</label>
                    <div class="val" id="qr-label-title"></div>
                  </div>
                  <div class="qr-label-field">
                    <label>COMMESSA / CANTIERE</label>
                    <div class="val" id="qr-label-project"></div>
                  </div>
                  <div class="qr-label-field">
                    <label>DESTINAZIONE / CLIENTE</label>
                    <div class="val" id="qr-label-client"></div>
                  </div>
                  <div class="qr-label-field">
                    <label>POSIZIONE IN TAVOLA</label>
                    <div class="val" id="qr-label-page" style="font-size:11px;"></div>
                  </div>
                </div>

                <div class="qr-canvas-box">
                  <div id="qr-code-svg-slot"></div>
                  <div style="font-size:8px; font-weight:700; margin-top:6px; text-align:center;">INQUADRA COL TELEFONO PER LA TAVOLA CAD</div>
                </div>
              </div>

              <div style="border-top:2px dashed #000; margin-top:14px; padding-top:10px;">
                <div style="font-size:10px; font-weight:700; color:#000;" id="qr-label-notes"></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-solid-white font-mono" id="btn-action-print-qr">🖨 STAMPA ETICHETTA</button>
          </div>
        </div>
      </div>

      <!-- Modal Operatore & Gestione Squadra -->
      <div id="modal-operator" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:440px;">
          <div class="modal-header">
            <h3>SELEZIONA OPERATORE ATTIVO</h3>
            <button class="btn-outline-sm" id="btn-close-operator-modal">[X]</button>
          </div>
          <div class="modal-body">
            <div class="operator-grid">
              ${operators.map(op => `
                <div class="operator-select-btn ${op.id === AUTH.activeOperator.id ? 'active' : ''}" data-operator-id="${op.id}">
                  <div>${op.name}</div>
                  <div style="font-size:9px; color:var(--text-muted); margin-top:2px;">${op.role}</div>
                  ${AUTH.isAdmin && op.name !== 'Michele' ? `
                    <span class="operator-remove-link" data-remove-op-id="${op.id}">[ RIMUOVI ]</span>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            ${AUTH.isAdmin ? `
              <div style="margin-top:22px; border-top:var(--glass-border); padding-top:16px;">
                <div style="font-size:11px; font-family:var(--font-mono); font-weight:700; color:#FFFFFF; margin-bottom:10px;">
                  + AGGIUNGI OPERATORE ALLA SQUADRA
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <input type="text" id="new-op-name" class="form-control" placeholder="NOME (ES. MARCO)" />
                  <input type="text" id="new-op-role" class="form-control" placeholder="MANSIONE (ES. TAGLIO / MONTAGGIO)" />
                  <button class="btn-solid-white" id="btn-save-new-operator">+ CONFERMA INSERIMENTO</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Modal PIN Admin Michele -->
      <div id="modal-admin-pin" class="modal-overlay" style="display:none;">
        <div class="modal-pin-box">
          <h3 style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#FFFFFF;">
            ACCESSO RISERVATO MICHELE
          </h3>
          <p style="font-size:11px; color:var(--text-muted); margin-top:6px; font-family:var(--font-mono);">
            DIGITA IL PIN AMMINISTRATORE
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
