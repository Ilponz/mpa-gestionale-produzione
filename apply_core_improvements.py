# -*- coding: utf-8 -*-
"""
Script per applicare le 7 migliorie pratiche d'officina su ciò che abbiamo già:
1. Pan & Drag del disegno CAD (Mouse drag, Touch drag, Wheel zoom)
2. Tasti [ ← PREC ] e [ SUCC → ] per scorrere i telai direttamente nella workstation
3. Filtro distinta morali: [ TUTTI ] [ DA TAGLIARE ] [ TAGLIATI ]
4. Riassegnazione rapida operatore di fase cliccando sul badge nella workstation
5. Badge visivo chiaro nel Livello 2: [ 🔨 PRONTO AL BANCO ] quando il taglio è finito
6. Cliccando una notifica nel drawer attività, l'app apre direttamente quel telaio
7. Tasto [ + AGGIUNGI RIGA ] e ricalcolo ore in tempo reale nel Rapportino Giornaliero
"""

with open('build_app_js.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Aggiungi this.moralFilterTab = 'all' nel constructor
old_ctor_filters = r'''    // Filtri Pannello Admin: Storico Movimenti & Audit Produzione
    this.auditFilterOp = 'all';
    this.auditActionCategory = 'all';
    this.auditSearchQuery = '';
    this.auditDateRange = 'all';'''

new_ctor_filters = r'''    // Filtri Pannello Admin: Storico Movimenti & Audit Produzione
    this.auditFilterOp = 'all';
    this.auditActionCategory = 'all';
    this.auditSearchQuery = '';
    this.auditDateRange = 'all';

    // Filtro rapido distinta morali: 'all' | 'todo' | 'done'
    this.moralFilterTab = 'all';'''

assert old_ctor_filters in code, 'old_ctor_filters not found'
code = code.replace(old_ctor_filters, new_ctor_filters, 1)

# 2. Miglioramento Level 2 Sidebar: Badge visivo PRONTO AL BANCO
old_status_pill = r'''                      <div class="comp-card-meta font-mono" data-atropos-offset="2">
                        <span style="color:var(--text-secondary);">${checkedCount}/${moraliCount} PEZZI TAGLIATI</span>
                        <span class="status-pill ${this.getStatusClass(comp.cutStatus)}" style="padding:2px 6px;">
                          ${comp.cutStatus === 'completed' ? 'TAGLIATO' : (comp.cutStatus === 'wip' ? 'IN TAGLIO' : 'DA TAGLIARE')}
                        </span>
                      </div>'''

new_status_pill = r'''                      <div class="comp-card-meta font-mono" data-atropos-offset="2">
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
                      </div>'''

assert old_status_pill in code, 'old_status_pill not found'
code = code.replace(old_status_pill, new_status_pill, 1)

# 3. Workstation Header: Tasti [ ← PREC ] e [ SUCC → ] e Clickable Operator Tags
old_workstation_header = r'''    return `
      <section class="liquid-glass component-workstation">
        <!-- Barra Superiore della Workstation Telaio -->
        <div class="workstation-header">
          <div class="workstation-title-box">
            <div class="workstation-page-tag font-mono">
              PAGINA ${comp.pageNumber} DI ${project.totalComponents || project.components.length} · TAVOLA ${comp.code}
            </div>
            <div class="workstation-main-title">${comp.title}</div>
            
            <!-- Barra Assegnazione Operatori e Timestamp Lavorazione -->
            <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-top:6px; font-size:10px; font-family:var(--font-mono);">
              <div style="display:flex; align-items:center; gap:5px;">
                <span style="color:var(--text-muted);">OP. TAGLIO:</span>
                <span class="badge-op-tag ${this.getOperatorBadgeClass(cutOp)}">${cutOp}</span>
                <span class="comp-timestamp-tag">${comp.cutDate ? comp.cutDate + ' ' + (comp.cutStartTime ? comp.cutStartTime + '-' + (comp.cutEndTime || '') : '') : ''}</span>
              </div>

              <div style="display:flex; align-items:center; gap:5px;">
                <span style="color:var(--text-muted);">OP. BANCO:</span>
                <span class="badge-op-tag ${this.getOperatorBadgeClass(asmOp)}">${asmOp}</span>
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
            <!-- Cronometro Tattile Lavorazione Attiva -->
            <button class="btn-timer ${isTimerActiveOnThisComp ? 'running' : ''}" id="btn-toggle-work-timer" data-timer-comp-id="${comp.id}" title="Avvia/Arresta cronometro reale lavorazione">
              ${isTimerActiveOnThisComp 
                ? `⏱ IN CORSO: ${this.formatTimerTime(this.activeTimer.elapsedSeconds)} [ STOP & SALVA ]` 
                : `⏱ AVVIA CRONOMETRO`}
            </button>'''

new_workstation_header = r'''    const allComps = project.components || [];
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
            </button>'''

assert old_workstation_header in code, 'old_workstation_header not found'
code = code.replace(old_workstation_header, new_workstation_header, 1)

# 4. Distinta Morali: Filtro rapido [ TUTTI ] [ DA TAGLIARE ] [ TAGLIATI ]
old_morali_box_header = r'''          <!-- Distinta Morali e Spunta Pezzi in Millimetri con Attribuzione Operatore e Data -->
          <div class="workstation-morali-box">
            <div class="section-title">
              <span>DISTINTA MORALI & PEZZI</span>
              <span class="font-mono" id="workstation-morali-status-text" style="font-size:11px; color:var(--text-secondary);">
                ${checkedCount}/${totalCount} PEZZI · ${totalCount > 0 && checkedCount === totalCount ? 'TUTTI TAGLIATI' : 'IN LAVORAZIONE'}
              </span>
            </div>

            <div class="morali-list" style="flex:1; overflow-y:auto; max-height:440px;">'''

new_morali_box_header = r'''          <!-- Distinta Morali con Filtro Rapido e Spunta Pezzi -->
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

            <div class="morali-list" style="flex:1; overflow-y:auto; max-height:440px;">'''

assert old_morali_box_header in code, 'old_morali_box_header not found'
code = code.replace(old_morali_box_header, new_morali_box_header, 1)

# Filtra morali a seconda di this.moralFilterTab
old_morali_map = r'''            <div class="morali-list" style="flex:1; overflow-y:auto; max-height:440px;">
              ${morali.length === 0 ? `
                <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:11px; font-family:var(--font-mono);">
                  Nessun pezzo associato a questa tavola.
                </div>
              ` : morali.map(m => `'''

new_morali_map = r'''            <div class="morali-list" style="flex:1; overflow-y:auto; max-height:440px;">
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

                return filteredMorali.map(m => `'''

assert old_morali_map in code, 'old_morali_map not found'
code = code.replace(old_morali_map, new_morali_map, 1)

old_morali_map_end = r'''                </div>
              `).join('')}
            </div>'''

new_morali_map_end = r'''                </div>
                `;
              }).join('')}
            </div>'''

assert old_morali_map_end in code, 'old_morali_map_end not found'
code = code.replace(old_morali_map_end, new_morali_map_end, 1)

# 5. CAD Blueprint: Aggiungi Pan & Drag (Mouse, Wheel, Touch)
old_cad_zoom = r'''    const zoomFullscreenBtn = document.getElementById('btn-zoom-fullscreen');
    if (zoomFullscreenBtn) {
      zoomFullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }'''

new_cad_zoom = r'''    const zoomFullscreenBtn = document.getElementById('btn-zoom-fullscreen');
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
  }'''

assert old_cad_zoom in code, 'old_cad_zoom not found'
code = code.replace(old_cad_zoom, new_cad_zoom, 1)

# 6. Event listeners per Navigazione Siblings e Filtri Morali in bindWorkstationEvents
old_workstation_binds = r'''    // Setup Dropzone PDF
    this.setupPdfDropzone('pdf-dropzone', 'pdf-file-input', 'pdf-dropzone-selected');
    this.setupPdfDropzone('replace-pdf-dropzone', 'replace-pdf-file-input', 'replace-pdf-dropzone-selected');
  }'''

# Inserisci i nuovi listener in bindWorkstationEvents
target_workstation_bind_end = r'''    this.bindCadZoomEvents();
  }'''

new_workstation_bind_additions = r'''    // Navigazione Rapida Telaio Precedente / Successivo
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
  }'''

assert target_workstation_bind_end in code, 'target_workstation_bind_end not found'
code = code.replace(target_workstation_bind_end, new_workstation_bind_additions, 1)

# 7. Activity Drawer: Click su notifica naviga direttamente al telaio
old_activity_item_render = r'''    body.innerHTML = notifs.map(n => `
      <div class="activity-item type-${n.type || 'info'}">
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
      </div>
    `).join('');'''

new_activity_item_render = r'''    body.innerHTML = notifs.map(n => `
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
    });'''

assert old_activity_item_render in code, 'old_activity_item_render not found'
code = code.replace(old_activity_item_render, new_activity_item_render, 1)

# 8. Rapportino Giornaliero: Pulsante + AGGIUNGI RIGA e Ricalcolo Ore Dinamico
old_rap_controls = r'''            <div style="display:flex; gap:8px; align-items:center;">
              <input type="date" id="rapportino-date-picker" class="form-control" style="padding:4px 8px; font-size:11px; width:130px;" value="${new Date().toISOString().split('T')[0]}" />
              <button class="btn-outline-sm font-mono" id="btn-autofill-rapportino" title="Compila automaticamente dai lavori completati oggi">
                ⚡ AUTO-COMPILA
              </button>
              <button class="btn-solid-white font-mono" id="btn-print-rapportino-a4" style="font-weight:700;">
                🖨️ STAMPA A4
              </button>
            </div>'''

new_rap_controls = r'''            <div style="display:flex; gap:8px; align-items:center;">
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
            </div>'''

assert old_rap_controls in code, 'old_rap_controls not found'
code = code.replace(old_rap_controls, new_rap_controls, 1)

# Aggiungi listener per btn-add-rapportino-row e ricalcolo ore in bindRapportinoEvents
old_rap_bind = r'''    const btnAutoFill = document.getElementById('btn-autofill-rapportino');
    if (btnAutoFill) {
      btnAutoFill.addEventListener('click', () => {
        this.autoFillRapportino();
      });
    }'''

new_rap_bind = r'''    const btnAutoFill = document.getElementById('btn-autofill-rapportino');
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
    }'''

assert old_rap_bind in code, 'old_rap_bind not found'
code = code.replace(old_rap_bind, new_rap_bind, 1)

with open('build_app_js.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: build_app_js.py patched with all 7 core improvements!")
