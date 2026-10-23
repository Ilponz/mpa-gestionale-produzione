# -*- coding: utf-8 -*-
"""
Script di aggiornamento per build_app_js.py con gestione di tutte le casistiche di logica.
"""

with open('build_app_js.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Chiamata restoreActiveTimerIfAny in init()
old_init = r'''  init() {
    this.initMultiDeviceSync();
    this.setupEventListeners();
    this.render();
    this.startLiveTickerLoop();
  }'''

new_init = r'''  init() {
    this.initMultiDeviceSync();
    this.setupEventListeners();
    this.restoreActiveTimerIfAny();
    this.render();
    this.startLiveTickerLoop();
  }'''

assert old_init in code, 'old_init not found'
code = code.replace(old_init, new_init, 1)

# 2. Metodi persistenza e concorrenza Cronometro
old_toggle_timer = r'''  toggleWorkTimer(compId) {
    const comp = DB.getComponent(this.selectedProjectId, compId);
    const proj = DB.getProjectById(this.selectedProjectId);
    if (!comp || !proj) return;

    if (this.isTimerRunningFor(compId)) {
      // STOP CRONOMETRO E REGISTRAZIONE AUTOMATICA NEL TIMESHEET
      clearInterval(this.activeTimer.intervalId);
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
      // AVVIA CRONOMETRO
      if (this.activeTimer.intervalId) {
        clearInterval(this.activeTimer.intervalId);
      }
      const now = new Date();
      const startStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      this.activeTimer = {
        compId: compId,
        startTime: Date.now(),
        startTimeStr: startStr,
        elapsedSeconds: 0,
        intervalId: setInterval(() => {
          this.activeTimer.elapsedSeconds = Math.floor((Date.now() - this.activeTimer.startTime) / 1000);
          const btn = document.getElementById('btn-toggle-work-timer');
          if (btn) {
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
  }'''

new_toggle_timer = r'''  restoreActiveTimerIfAny() {
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
  }'''

assert old_toggle_timer in code, 'old_toggle_timer not found'
code = code.replace(old_toggle_timer, new_toggle_timer, 1)

# 3. Aggiorna confirmToggleMoral, confirmToggleCut, confirmToggleAssembly
old_confirm_methods = r'''  // --- CONFERMA SPUNTA PEZZI & FASI ---

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
      this.showConfirmModal({
        title: 'ANNULLA SPUNTA PEZZO',
        message: `Vuoi ripristinare il pezzo <strong>${moral.desc}</strong> come non ancora tagliato?`,
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
      this.showConfirmModal({
        title: 'CONFERMA COMPLETAMENTO TAGLIO',
        message: `Confermi che tutti i pezzi del telaio <strong>${comp.code} - ${comp.title}</strong> sono stati tagliati e verificati da <strong style="color:${this.getOperatorColor(op.name)};">${op.name}</strong>?`,
        confirmText: 'SEGNA COMPLETATO',
        cancelText: 'ANNULLA',
        onConfirm: () => {
          DB.updateOperationStatus(this.selectedProjectId, compId, 'cut', 'completed', op.name);
          this.broadcastDataUpdate();
          this.sound.playSuccess();
          this.render();
        }
      });
    } else {
      this.showConfirmModal({
        title: 'RIAPRI FASE DI TAGLIO',
        message: `Vuoi riaprire la fase di taglio per il telaio <strong>${comp.code}</strong>?`,
        confirmText: 'RIAPRI TAGLIO',
        cancelText: 'ANNULLA',
        isDestructive: true,
        onConfirm: () => {
          DB.updateOperationStatus(this.selectedProjectId, compId, 'cut', 'todo', op.name);
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
      this.showConfirmModal({
        title: 'VINCOLO GATEKEEPER PRODUZIONE',
        message: `Impossibile completare il montaggio al banco.<br><br>Risultano ancora <strong>${uncompleted.length} morali non tagliati</strong> alla troncatrice. Taglia e spunta tutti i pezzi prima di procedere all'assemblaggio.`,
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
          DB.updateOperationStatus(this.selectedProjectId, compId, 'assembly', 'todo', op.name);
          this.broadcastDataUpdate();
          this.render();
        }
      });
    }
  }'''

new_confirm_methods = r'''  // --- CONFERMA SPUNTA PEZZI & FASI (CON GESTIONE TUTTI GLI EDGE CASES) ---

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
  }'''

assert old_confirm_methods in code, 'old_confirm_methods not found'
code = code.replace(old_confirm_methods, new_confirm_methods, 1)

# 4. Sostituzione alert() nativo con popup showConfirmModal nella creazione commessa
old_alert = r'''        if (!title || !client) {
          alert('Inserisci titolo e cliente.');
          return;
        }'''

new_alert = r'''        if (!title || !client) {
          this.showConfirmModal({
            title: 'CAMPI OBBLIGATORI',
            message: 'Inserisci sia il titolo della commessa che il cliente per poter procedere.',
            confirmText: 'HO CAPITO',
            cancelText: '',
            isDestructive: true,
            onConfirm: () => {}
          });
          return;
        }'''

assert old_alert in code, 'old_alert not found'
code = code.replace(old_alert, new_alert, 1)

# 5. Eliminazione commessa: Selezione pulita del primo progetto rimanente
old_del_proj = r'''              DB.deleteProject(this.selectedProjectId);
              this.selectedProjectId = 'proj-1';
              this.selectedComponentId = null;'''

new_del_proj = r'''              DB.deleteProject(this.selectedProjectId);
              const remaining = DB.getProjects(true);
              this.selectedProjectId = remaining.length > 0 ? remaining[0].id : null;
              this.selectedComponentId = null;'''

assert old_del_proj in code, 'old_del_proj not found'
code = code.replace(old_del_proj, new_del_proj, 1)

# 6. Celle modificabili inline (contenteditable="true") nel Rapportino Giornaliero
old_rap_cantiere_cell = r'''                  <td style="border:1px solid #000; padding:6px;">${r.lavorazione}</td>
                  <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:700;">${r.oreLavorate}</td>
                  <td style="border:1px solid #000; padding:6px; text-align:center;">${r.quantita}</td>'''

new_rap_cantiere_cell = r'''                  <td style="border:1px solid #000; padding:6px;" contenteditable="true" title="Clicca per modificare prima di stampare">${r.lavorazione}</td>
                  <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:700;" contenteditable="true" title="Clicca per modificare ore">${r.oreLavorate}</td>
                  <td style="border:1px solid #000; padding:6px; text-align:center;" contenteditable="true" title="Clicca per modificare quantità">${r.quantita}</td>'''

assert old_rap_cantiere_cell in code, 'old_rap_cantiere_cell not found'
code = code.replace(old_rap_cantiere_cell, new_rap_cantiere_cell, 1)

old_rap_fiscale_cell = r'''                  <td style="border:1px solid #000; padding:5px;">${r.operaContratto || r.lavorazione}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;">${r.data}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;">${r.oraEntrata}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;">${r.oraUscita}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:700;">${r.oreLavorate}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center; font-size:10px;">${r.operatore}</td>'''

new_rap_fiscale_cell = r'''                  <td style="border:1px solid #000; padding:5px;" contenteditable="true" title="Clicca per modificare">${r.operaContratto || r.lavorazione}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">${r.data}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">${r.oraEntrata}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center;" contenteditable="true">${r.oraUscita}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:700;" contenteditable="true">${r.oreLavorate}</td>
                  <td style="border:1px solid #000; padding:5px; text-align:center; font-size:10px;" contenteditable="true">${r.operatore}</td>'''

assert old_rap_fiscale_cell in code, 'old_rap_fiscale_cell not found'
code = code.replace(old_rap_fiscale_cell, new_rap_fiscale_cell, 1)

# 7. Tasto Svuota Log in Audit Log Toolbar
old_audit_buttons = r'''            <!-- Pulsanti Export CSV & Stampa -->
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="btn-solid-white font-mono" id="btn-export-audit-csv" title="Esporta storico movimenti in CSV per Excel" style="font-size:11px;">
                📥 ESPORTA CSV
              </button>
              <button class="btn-outline-sm font-mono" id="btn-print-audit-report" title="Stampa registro audit su foglio A4" style="font-size:11px;">
                🖨️ STAMPA
              </button>
            </div>'''

new_audit_buttons = r'''            <!-- Pulsanti Export CSV, Stampa & Svuota -->
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
            </div>'''

assert old_audit_buttons in code, 'old_audit_buttons not found'
code = code.replace(old_audit_buttons, new_audit_buttons, 1)

# 8. Event listener per btn-clear-audit-logs
old_audit_bind_end = r'''    const btnPrint = document.getElementById('btn-print-audit-report');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }
  }'''

new_audit_bind_end = r'''    const btnPrint = document.getElementById('btn-print-audit-report');
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
  }'''

assert old_audit_bind_end in code, 'old_audit_bind_end not found'
code = code.replace(old_audit_bind_end, new_audit_bind_end, 1)

with open('build_app_js.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: build_app_js.py patched with all edge cases!")
