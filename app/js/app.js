/**
 * CONTROLLER APPLICATIVO PRINCIPALE (M.P.A. DI MAURIZIO CAVALLARO)
 * Estetica Architetturale Liquid Glass (Vetro Liquido & Frosted Glass B&W).
 * Funzionalità:
 * 1. Barra di Completamento con percentuale in tempo reale per ogni commessa.
 * 2. Transizione Fluida (Slide Smooth) tra Lista Commesse e Parti del Progetto (Telai).
 * 3. Tasto destro (Context Menu) su Commesse e Telai per Modificare o Eliminare.
 * 4. Caricamento File PDF SEMA (con rendering client-side e split pagine/telai automatico).
 * 5. Tutti i Pop-up di Conferma sono finestre a tema Liquid Glass centrate a schermo (zero alert/confirm nativi).
 */

class AppController {
  constructor() {
    this.currentNavLevel = 'projects'; // 'projects' oppure 'components'
    this.selectedProjectId = 'proj-1';
    this.selectedComponentId = null;   // null = vedi sfondo finché non selezioni il primo pezzo
    this.compSearchQuery = '';
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;

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

  setupEventListeners() {
    window.addEventListener('online', () => this.updateConnectionStatus(true));
    window.addEventListener('offline', () => this.updateConnectionStatus(false));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
        this.closeAllModals();
      }
    });

    // Chiusura menu contestuale cliccando altrove
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

  // --- RENDERING GENERALE ---

  render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      ${this.renderHeader()}
      <div class="workspace-layout">
        ${this.renderSidebarNavigator()}
        ${this.renderMainStage()}
      </div>
      ${this.renderStealthAdminButton()}
      ${this.renderContextMenu()}
      ${this.renderModals()}
    `;

    this.bindEvents();
    this.bindCadZoomEvents();
  }

  // --- HEADER: SOLO NOME AZIENDA, ZERO SOTTOTITOLO O MENU ---

  renderHeader() {
    const op = AUTH.activeOperator;

    return `
      <header class="app-header">
        <div class="brand-section">
          <div class="brand-title">MPA di Maurizio Cavallaro</div>
        </div>

        <div class="header-actions">
          <div class="operator-box" id="btn-change-operator" title="Gestione / Selezione Operatore">
            <span class="operator-label">OPERATORE:</span>
            <span class="operator-val">${op.name}</span>
          </div>

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

  // --- BARRA LATERALE NAVIGATRICE A TRANSIZIONE FLUIDA (DUE LIVELLI) ---

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

  renderProjectsPanelContent() {
    const projects = DB.getProjects(AUTH.isAdmin);

    return `
      <div class="panel-header">
        <span class="panel-title">COMMESSE (${projects.length})</span>
        ${AUTH.isAdmin ? `
          <button class="btn-outline-sm" id="btn-open-new-project">
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
            <div class="liquid-glass-card project-item-card ${isSelected ? 'active' : ''}" 
                 data-select-project-id="${proj.id}" 
                 data-context-project-id="${proj.id}"
                 title="Tasto sinistro per aprire · Tasto destro per opzioni">
              <div class="p-card-top font-mono">
                <span class="p-card-code">${proj.code}</span>
                <span class="p-card-deadline">${this.formatDate(proj.deadline)}</span>
              </div>
              
              <div class="p-card-title">${proj.title}</div>
              <div class="p-card-client font-mono">${proj.client}</div>

              <!-- Barra di completamento con percentuale in tempo reale -->
              <div class="p-progress-box">
                <div class="p-progress-track">
                  <div class="p-progress-fill" style="width: ${progress}%;"></div>
                </div>
                <div class="p-progress-val font-mono">${progress}%</div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                <span class="status-pill ${this.getStatusClass(proj.status)} font-mono">
                  ${this.getStatusLabel(proj.status)}
                </span>
                <span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono);">
                  ${remaining}
                </span>
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
      <!-- Header con Pulsante per Tornare alla Sezione Antecedente -->
      <div class="panel-header">
        <button class="btn-nav-back" id="btn-back-to-projects" title="Torna all'elenco delle commesse">
          ← COMMESSE
        </button>
        ${AUTH.isAdmin ? `
          <button class="btn-outline-sm" id="btn-edit-active-proj" title="Modifica commessa">
            [ MODIFICA ]
          </button>
        ` : ''}
      </div>

      <!-- Intestazione Commessa e Barra Avanzamento -->
      <div style="padding:14px 18px; border-bottom:var(--glass-border-light); background:rgba(18,21,28,0.4);">
        <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">
          ${project.code} · ${project.client}
        </div>
        <div style="font-size:15px; font-weight:700; color:#FFFFFF; margin-top:2px;">
          ${project.title}
        </div>
        <div class="p-progress-box" style="margin-top:8px;">
          <div class="p-progress-track">
            <div class="p-progress-fill" style="width: ${progress}%;"></div>
          </div>
          <div class="p-progress-val font-mono">${progress}%</div>
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
            <div class="liquid-glass-card component-item-card ${isSelected ? 'active' : ''}" 
                 data-select-component-id="${comp.id}"
                 data-context-component-id="${comp.id}"
                 title="Tasto sinistro per aprire · Tasto destro per opzioni">
              <div class="comp-card-header font-mono">
                <span class="comp-card-page">PAG. ${comp.pageNumber}</span>
                <span class="comp-card-code">${comp.code}</span>
              </div>

              <div class="comp-card-title">${comp.title}</div>

              <div class="comp-card-meta font-mono">
                <span style="color:var(--text-secondary);">${checkedCount}/${moraliCount} PEZZI</span>
                <span class="status-pill ${this.getStatusClass(comp.cutStatus)}" style="padding:2px 6px;">
                  TAGLIO: ${comp.cutStatus.toUpperCase()}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- SPAZIO PRINCIPALE: SFONDO FINCHÉ NON SELEZIONI IL PRIMO PEZZO ---

  renderMainStage() {
    const project = DB.getProjectById(this.selectedProjectId);

    // Se nessun componente è selezionato: VEDI SFONDO con raffinata HUD Glass
    if (!this.selectedComponentId || !project) {
      return `
        <main class="main-stage">
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
        </main>
      `;
    }

    // Altrimenti: VIENE FUORI NELLO SPAZIO VUOTO LA SEZIONE DEL COMPONENTE IN LIQUID GLASS
    const comp = DB.getComponent(this.selectedProjectId, this.selectedComponentId);
    if (!comp) {
      return `
        <main class="main-stage">
          <div class="empty-stage-hud liquid-glass">
            <p class="hud-desc font-mono">Telaio non trovato.</p>
          </div>
        </main>
      `;
    }

    const morali = comp.morali || [];
    const checkedCount = morali.filter(m => m.checked).length;
    const totalCount = morali.length;

    return `
      <main class="main-stage">
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
              <!-- Azione Rapida Taglio -->
              <button class="btn-solid-white font-mono" data-action-toggle-cut="${comp.id}" style="${comp.cutStatus === 'completed' ? 'background:#FFFFFF; color:#000000;' : 'background:transparent; color:#FFFFFF; border:1px solid #FFFFFF;'}">
                TAGLIO: ${comp.cutStatus === 'completed' ? 'COMPLETATO' : 'IN CORSO (SEGNA FATTO)'}
              </button>

              <!-- Azione Rapida Montaggio Banco -->
              <button class="btn-outline-white font-mono" data-action-toggle-assembly="${comp.id}" style="${comp.assemblyStatus === 'completed' ? 'background:#FFFFFF; color:#000000;' : ''}">
                MONTAGGIO: ${comp.assemblyStatus === 'completed' ? 'COMPLETATO' : 'BANCO (SEGNA FATTO)'}
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
            <div class="workstation-cad-box" id="cad-drawing-container">
              <img 
                id="cad-drawing-preview" 
                src="${comp.image}" 
                alt="${comp.title}" 
                style="max-width:100%; max-height:520px; object-fit:contain; transform: scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px); transition: transform 120ms ease; pointer-events:none;" 
              />

              <!-- Controlli Zoom CAD Liquid Glass -->
              <div class="cad-zoom-bar">
                <button class="zoom-btn" id="btn-zoom-in" title="Ingrandisci">[ + ]</button>
                <button class="zoom-btn" id="btn-zoom-out" title="Riduci">[ - ]</button>
                <button class="zoom-btn" id="btn-zoom-reset" title="Reimposta">[ 1:1 ]</button>
                <button class="zoom-btn" id="btn-zoom-fullscreen" title="Schermo Intero">[ ⛶ ]</button>
              </div>
            </div>

            <!-- Distinta Morali e Spunta Pezzi in Millimetri -->
            <div class="workstation-morali-box">
              <div class="section-title">
                <span>DISTINTA MORALI & PEZZI (${checkedCount}/${totalCount})</span>
                <span class="font-mono" style="font-size:11px; color:var(--text-secondary);">
                  ${totalCount > 0 && checkedCount === totalCount ? 'TUTTI TAGLIATI' : 'IN LAVORAZIONE'}
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
      </main>
    `;
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

    // Posizionamento entro i margini dello schermo
    menu.style.display = 'flex';
    const menuWidth = 240;
    const menuHeight = items.length * 38 + 36;
    const posX = (x + menuWidth > window.innerWidth) ? (x - menuWidth) : x;
    const posY = (y + menuHeight > window.innerHeight) ? (y - menuHeight) : y;

    menu.style.left = `${Math.max(10, posX)}px`;
    menu.style.top = `${Math.max(10, posY)}px`;

    // Associazione azioni
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

    // Clone per pulire vecchi listener
    const newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newConfirm.addEventListener('click', () => {
      modal.style.display = 'none';
      if (onConfirm) onConfirm();
    });

    newCancel.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.style.display = 'flex';
  }

  // --- EVENT BINDING ---

  bindEvents() {
    // Clic su Commessa: transizione a componenti
    document.querySelectorAll('[data-select-project-id]').forEach(card => {
      card.addEventListener('click', () => {
        const projId = card.dataset.selectProjectId;
        this.selectedProjectId = projId;
        this.currentNavLevel = 'components';
        this.selectedComponentId = null; // Mostra sfondo finché non seleziona pezzo
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.render();
      });

      // Tasto Destro su Commessa (Modifica / Cancella / Sostituisci PDF)
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
                  this.render();
                }
              });
            }
          }
        ], proj.code);
      });
    });

    // Pulsante per Tornare alla Sezione Antecedente (Commesse)
    const backBtn = document.getElementById('btn-back-to-projects');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.currentNavLevel = 'projects';
        this.render();
      });
    }

    // Clic su un Pezzo / Telaio: viene fuori nello spazio vuoto la sezione del componente
    document.querySelectorAll('[data-select-component-id]').forEach(card => {
      card.addEventListener('click', () => {
        const compId = card.dataset.selectComponentId;
        this.selectedComponentId = compId;
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.render();
      });

      // Tasto Destro su Telaio (Rinomina / Elimina Telaio)
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
                  this.render();
                }
              });
            }
          }
        ], comp.code);
      });
    });

    // Pulsante Chiudi Workstation (torna allo sfondo)
    const closeWorkstationBtn = document.getElementById('btn-close-workstation');
    if (closeWorkstationBtn) {
      closeWorkstationBtn.addEventListener('click', () => {
        this.selectedComponentId = null;
        this.render();
      });
    }

    // Filtro Ricerca Telai
    const filterInput = document.getElementById('input-filter-components');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        this.compSearchQuery = e.target.value;
        this.render();
        const newInput = document.getElementById('input-filter-components');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });
    }

    // Spunta Checkbox Morali (con ricalcolo % in tempo reale)
    document.querySelectorAll('[data-moral-comp-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.moral-delete-btn')) return;
        const compId = el.dataset.moralCompId;
        const moralId = el.dataset.moralId;
        DB.toggleMoral(this.selectedProjectId, compId, moralId);
        this.render();
      });
    });

    // Eliminazione Morale (Michele Admin) con pop-up centrale a tema
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
            this.render();
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
        const nextStatus = comp.cutStatus === 'completed' ? 'todo' : 'completed';
        DB.updateOperationStatus(this.selectedProjectId, compId, 'cut', nextStatus, AUTH.activeOperator.name);
        this.render();
      });
    });

    // Toggle Azione Assemblaggio
    document.querySelectorAll('[data-action-toggle-assembly]').forEach(btn => {
      btn.addEventListener('click', () => {
        const compId = btn.dataset.actionToggleAssembly;
        const comp = DB.getComponent(this.selectedProjectId, compId);
        if (!comp) return;
        const nextStatus = comp.assemblyStatus === 'completed' ? 'todo' : 'completed';
        DB.updateOperationStatus(this.selectedProjectId, compId, 'assembly', nextStatus, AUTH.activeOperator.name);
        this.render();
      });
    });

    // Dropzone Caricamento PDF (Nuova Commessa)
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

    // Stealth Admin Trigger
    const stealthBtn = document.getElementById('btn-stealth-admin');
    if (stealthBtn) {
      stealthBtn.addEventListener('click', () => {
        AUTH.enteredPin = '';
        this.updatePinDots();
        document.getElementById('modal-admin-pin').style.display = 'flex';
      });
    }

    // Modal Timesheet
    const btnTimesheet = document.getElementById('btn-open-timesheet-modal');
    if (btnTimesheet) {
      btnTimesheet.addEventListener('click', () => {
        document.getElementById('modal-timesheet').style.display = 'flex';
      });
    }
    const closeTimesheet = document.getElementById('btn-close-timesheet-modal');
    if (closeTimesheet) closeTimesheet.addEventListener('click', () => this.closeAllModals());

    // Gestione Operatori
    document.querySelectorAll('.operator-select-btn[data-operator-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const opId = parseInt(btn.dataset.operatorId, 10);
        const op = DB.getOperators().find(o => o.id === opId);
        if (op) {
          AUTH.setActiveOperator(op);
          this.closeAllModals();
          this.render();
        }
      });
    });

    document.querySelectorAll('[data-remove-op-id]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        const opId = parseInt(link.dataset.removeOpId, 10);
        this.showConfirmModal({
          title: 'RIMOZIONE OPERATORE',
          message: 'Confermi la rimozione di questo operatore dalla squadra aziendale?',
          confirmText: 'RIMUOVI OPERATORE',
          isDestructive: true,
          onConfirm: () => {
            DB.deleteOperator(opId);
            this.render();
            document.getElementById('modal-operator').style.display = 'flex';
          }
        });
      });
    });

    const saveNewOpBtn = document.getElementById('btn-save-new-operator');
    if (saveNewOpBtn) {
      saveNewOpBtn.addEventListener('click', () => {
        const name = document.getElementById('new-op-name').value.trim();
        const role = document.getElementById('new-op-role').value.trim();
        if (!name) return;
        DB.addOperator(name, role);
        this.render();
        document.getElementById('modal-operator').style.display = 'flex';
      });
    }

    const closeOpBtn = document.getElementById('btn-close-operator-modal');
    if (closeOpBtn) closeOpBtn.addEventListener('click', () => this.closeAllModals());

    // Tastierino PIN Stealth
    document.querySelectorAll('.pin-key[data-digit]').forEach(key => {
      key.addEventListener('click', () => {
        if (AUTH.enteredPin.length < 4) {
          AUTH.enteredPin += key.dataset.digit;
          this.updatePinDots();
          if (AUTH.enteredPin.length === 4) {
            setTimeout(() => {
              if (AUTH.verifyAdminPin(AUTH.enteredPin)) {
                this.closeAllModals();
                this.render();
              } else {
                AUTH.enteredPin = '';
                this.updatePinDots();
              }
            }, 60);
          }
        }
      });
    });

    const pinBack = document.getElementById('btn-pin-backspace');
    if (pinBack) {
      pinBack.addEventListener('click', () => {
        AUTH.enteredPin = AUTH.enteredPin.slice(0, -1);
        this.updatePinDots();
      });
    }

    const pinCancel = document.getElementById('btn-pin-cancel');
    if (pinCancel) pinCancel.addEventListener('click', () => this.closeAllModals());

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
    const closeNewProjBtn = document.getElementById('btn-close-new-project');
    if (closeNewProjBtn) closeNewProjBtn.addEventListener('click', () => this.closeAllModals());

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

        // Se nessun file caricato, carica preset tavole reali SEMA (photo_1 - photo_4)
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
        this.closeAllModals();
        this.render();
      });
    }

    // Modifica Commessa
    const editProjBtn = document.getElementById('btn-edit-active-proj');
    if (editProjBtn) {
      editProjBtn.addEventListener('click', () => {
        this.openEditProjectModal(this.selectedProjectId);
      });
    }
    const closeEditProjBtn = document.getElementById('btn-close-edit-proj');
    if (closeEditProjBtn) closeEditProjBtn.addEventListener('click', () => this.closeAllModals());

    const saveEditProjBtn = document.getElementById('btn-save-edit-proj');
    if (saveEditProjBtn) {
      saveEditProjBtn.addEventListener('click', () => {
        const title = document.getElementById('edit-proj-title').value.trim();
        const client = document.getElementById('edit-proj-client').value.trim();
        const deadline = document.getElementById('edit-proj-deadline').value;
        DB.updateProject(this.selectedProjectId, { title, client, deadline });
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
        this.closeAllModals();
        this.render();
      });
    }
    const closeReplacePdfBtn = document.getElementById('btn-close-replace-pdf');
    if (closeReplacePdfBtn) closeReplacePdfBtn.addEventListener('click', () => this.closeAllModals());

    // Modale Modifica Telaio
    const saveEditCompBtn = document.getElementById('btn-save-edit-comp');
    if (saveEditCompBtn) {
      saveEditCompBtn.addEventListener('click', () => {
        if (!this.targetEditCompId) return;
        const code = document.getElementById('edit-comp-code').value.trim();
        const title = document.getElementById('edit-comp-title').value.trim();
        const note = document.getElementById('edit-comp-note').value.trim();

        DB.updateComponent(this.selectedProjectId, this.targetEditCompId, { code, title, note });
        this.closeAllModals();
        this.render();
      });
    }
    const closeEditCompBtn = document.getElementById('btn-close-edit-comp');
    if (closeEditCompBtn) closeEditCompBtn.addEventListener('click', () => this.closeAllModals());

    // Modal Aggiunta Morale
    document.querySelectorAll('[data-add-moral-comp-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.targetMoralCompId = btn.dataset.addMoralCompId;
        document.getElementById('modal-add-moral').style.display = 'flex';
      });
    });

    const closeAddMoralBtn = document.getElementById('btn-close-add-moral');
    if (closeAddMoralBtn) closeAddMoralBtn.addEventListener('click', () => this.closeAllModals());

    const saveAddMoralBtn = document.getElementById('btn-save-new-moral');
    if (saveAddMoralBtn) {
      saveAddMoralBtn.addEventListener('click', () => {
        const qty = document.getElementById('new-moral-qty').value;
        const len = document.getElementById('new-moral-len').value.trim();
        const desc = document.getElementById('new-moral-desc').value.trim();
        if (!len || !this.targetMoralCompId) return;

        DB.addMoral(this.selectedProjectId, this.targetMoralCompId, qty, len, desc);
        this.closeAllModals();
        this.render();
      });
    }
  }

  // --- DROPZONE & PDF.JS PROCESSING ---

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
    // Se è un PDF e PDF.js è disponibile nel browser
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

          // Estrazione testo per individuare codice telaio e morali
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

            // Cerca righe morali tipo "NR 04 L. 3034.00"
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

    // Se è un'immagine singola
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

  // --- CONTROLLI ZOOM & PAN CAD ---

  bindCadZoomEvents() {
    const img = document.getElementById('cad-drawing-preview');
    const container = document.getElementById('cad-drawing-container');
    if (!img || !container) return;

    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomResetBtn = document.getElementById('btn-zoom-reset');
    const zoomFullscreenBtn = document.getElementById('btn-zoom-fullscreen');

    const updateTransform = () => {
      img.style.transform = `scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px)`;
    };

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.zoomLevel = Math.min(4.0, this.zoomLevel + 0.25);
        updateTransform();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.zoomLevel = Math.max(0.7, this.zoomLevel - 0.25);
        updateTransform();
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        updateTransform();
      });
    }

    if (zoomFullscreenBtn) {
      zoomFullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
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

  // --- MODALI & STEALTH ADMIN ---

  renderStealthAdminButton() {
    return `
      <div class="stealth-admin-trigger" id="btn-stealth-admin" title="Accesso Amministratore Riservato">
        [ ADMIN ]
      </div>
    `;
  }

  renderModals() {
    const operators = DB.getOperators();
    const workLogs = DB.data.workLogs || [];

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
        <div class="modal-box" style="max-width:750px;">
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
                  <th>ORARI</th>
                  <th>STATO</th>
                </tr>
              </thead>
              <tbody>
                ${workLogs.map(log => `
                  <tr>
                    <td><strong>${log.projectName}</strong><br><span style="color:var(--text-muted); font-size:10px;">${log.componentCode}</span></td>
                    <td>${log.phase}</td>
                    <td>${log.operator}</td>
                    <td>${log.startTime} - ${log.endTime}</td>
                    <td><span class="status-pill status-done">${log.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
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

            <!-- Area Dropzone PDF SEMA -->
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

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
