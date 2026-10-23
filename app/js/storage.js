/**
 * STORAGE ENGINE & STATO LOCALE (OFFLINE-FIRST) v2.0
 * Gestisce la persistenza in LocalStorage, gestione operatori da Michele (Admin),
 * calcolo percentuali e distinta morali.
 */

const STORAGE_KEY = 'mpa_gestionale_data_v8';
const SYNC_QUEUE_KEY = 'mpa_sync_queue_v4';

class StorageManager {
  constructor() {
    this.data = this.loadData();
    this.syncQueue = this.loadSyncQueue();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.notifications) {
          parsed.notifications = this.getInitialNotifications();
        }
        if (!parsed.workLogs) {
          parsed.workLogs = this.getInitialWorkLogs();
        }
        if (!parsed.auditLogs || parsed.auditLogs.length === 0) {
          parsed.auditLogs = this.getInitialAuditLogs();
        }
        if (!parsed.operators) {
          parsed.operators = JSON.parse(JSON.stringify(INITIAL_DATA.operators));
        } else {
          // Rimozione Federica se presente da vecchie sessioni
          parsed.operators = parsed.operators.filter(o => o.name.toLowerCase() !== 'federica');
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Errore lettura localStorage, uso dati iniziali', e);
    }
    
    // Salva i dati iniziali con notifiche e log
    const initial = JSON.parse(JSON.stringify(INITIAL_DATA));
    initial.notifications = this.getInitialNotifications();
    initial.workLogs = this.getInitialWorkLogs();
    initial.auditLogs = this.getInitialAuditLogs();
    this.saveData(initial);
    return initial;
  }

  getInitialNotifications() {
    return [
      {
        id: 'notif-1',
        title: 'TAGLIO COMPLETATO PM 09',
        message: 'Francesca ha completato il taglio del Telaio Posteriore PM 09 (6 pezzi).',
        type: 'success',
        operator: 'Francesca',
        componentCode: 'PM 09',
        time: '11:50',
        date: 'OGGI',
        timestamp: Date.now() - 1000 * 60 * 20,
        read: false
      },
      {
        id: 'notif-2',
        title: 'ASSEMBLAGGIO AVVIATO PM 01',
        message: 'Daniel ha iniziato l\'assemblaggio al banco del Telaio Anteriore PM 01.',
        type: 'info',
        operator: 'Daniel',
        componentCode: 'PM 01',
        time: '11:00',
        date: 'OGGI',
        timestamp: Date.now() - 1000 * 60 * 70,
        read: false
      },
      {
        id: 'notif-3',
        title: 'TAGLIO MORALI PM 01',
        message: 'Francesca ha spuntato i 4 montanti L. 3034 mm su PM 01.',
        type: 'info',
        operator: 'Francesca',
        componentCode: 'PM 01',
        time: '09:45',
        date: 'OGGI',
        timestamp: Date.now() - 1000 * 60 * 140,
        read: false
      },
      {
        id: 'notif-4',
        title: 'APPROVAZIONE TAVOLE SEMA',
        message: 'Maurizio ha approvato le tavole CAD SEMA per Cabine Etruria Nuova.',
        type: 'success',
        operator: 'Maurizio',
        componentCode: 'SEMA 4.0',
        time: '08:30',
        date: 'OGGI',
        timestamp: Date.now() - 1000 * 60 * 210,
        read: true
      },
      {
        id: 'notif-5',
        title: 'ACCESSO AMMINISTRATORE',
        message: 'Michele (Admin) ha controllato il registro tempi e avanzamento commesse.',
        type: 'warning',
        operator: 'Michele',
        componentCode: 'ADMIN',
        time: '08:00',
        date: 'OGGI',
        timestamp: Date.now() - 1000 * 60 * 240,
        read: true
      }
    ];
  }

  getInitialWorkLogs() {
    return [
      {
        id: 'log-1',
        projectName: 'Cabine Etruria Nuova',
        componentCode: 'PM 01 - PM 02',
        phase: 'Taglio Troncatrice',
        operator: 'Francesca',
        startTime: '08:30',
        endTime: '10:45',
        durationMinutes: 135,
        status: 'COMPLETATO',
        date: '06.10.2026'
      },
      {
        id: 'log-2',
        projectName: 'Cabine Etruria Nuova',
        componentCode: 'PM 09',
        phase: 'Taglio Troncatrice',
        operator: 'Francesca',
        startTime: '10:15',
        endTime: '11:50',
        durationMinutes: 95,
        status: 'COMPLETATO',
        date: '06.10.2026'
      }
    ];
  }

  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.data = data;
    } catch (e) {
      console.error('Errore salvataggio localStorage', e);
    }
  }

  loadSyncQueue() {
    try {
      const queue = localStorage.getItem(SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      return [];
    }
  }

  queueAction(action) {
    this.syncQueue.push({
      ...action,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
  }

  // --- GESTIONE OPERATORI (PER MICHELE ADMIN) ---

  getOperators() {
    return this.data.operators || INITIAL_DATA.operators;
  }

  addOperator(name, role) {
    if (!this.data.operators) {
      this.data.operators = JSON.parse(JSON.stringify(INITIAL_DATA.operators));
    }
    const newOp = {
      id: Date.now(),
      name: name.trim(),
      role: role.trim() || 'Operatore di Produzione',
      avatar: name.trim().charAt(0).toUpperCase()
    };
    this.data.operators.push(newOp);
    this.saveData(this.data);
    this.queueAction({ type: 'ADD_OPERATOR', operator: newOp });
    return newOp;
  }

  deleteOperator(operatorId) {
    if (!this.data.operators) return false;
    this.data.operators = this.data.operators.filter(o => o.id !== operatorId);
    this.saveData(this.data);
    this.queueAction({ type: 'DELETE_OPERATOR', operatorId });
    return true;
  }

  // --- QUERY & AGGIORNAMENTI PROGETTI ---

  getProjects(includeConfidential = false) {
    if (includeConfidential) {
      return this.data.projects;
    }
    return this.data.projects.filter(p => !p.isConfidential);
  }

  getProjectById(projectId) {
    return this.data.projects.find(p => p.id === projectId) || null;
  }

  getComponent(projectId, componentId) {
    const project = this.getProjectById(projectId);
    if (!project || !project.components) return null;
    return project.components.find(c => c.id === componentId) || null;
  }

  toggleMoral(projectId, componentId, moralId, operatorName = 'Francesca') {
    const comp = this.getComponent(projectId, componentId);
    if (!comp || !comp.morali) return false;

    const moral = comp.morali.find(m => m.id === moralId);
    if (moral) {
      moral.checked = !moral.checked;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;

      if (moral.checked) {
        moral.checkedBy = operatorName;
        moral.checkedAt = timeStr;
        moral.checkedDate = dateStr;
        moral.checkedTimestamp = Date.now();

        this.addNotification(
          `TAGLIO MORALE ${comp.code}`,
          `${operatorName} ha tagliato e spuntato: NR ${moral.qty} L. ${moral.length} mm (${moral.desc}) su ${comp.code}.`,
          'info',
          operatorName,
          comp.code,
          projectId
        );

        this.logAuditAction({
          operator: operatorName,
          actionType: 'CUT_PIECE',
          actionLabel: 'SPUNTA TAGLIO',
          details: `${operatorName} ha tagliato e spuntato Morale NR ${moral.qty} L. ${moral.length} mm (${moral.desc}) su telaio ${comp.code}`,
          projectCode: comp.code,
          componentCode: comp.code,
          station: 'Postazione Troncatrice 1'
        });
      } else {
        delete moral.checkedBy;
        delete moral.checkedAt;
        delete moral.checkedDate;
        delete moral.checkedTimestamp;

        this.logAuditAction({
          operator: operatorName,
          actionType: 'UNCUT_PIECE',
          actionLabel: 'ANNULLO TAGLIO',
          details: `${operatorName} ha annullato la spunta per Morale NR ${moral.qty} L. ${moral.length} mm (${moral.desc}) su telaio ${comp.code}`,
          projectCode: comp.code,
          componentCode: comp.code,
          station: 'Postazione Troncatrice 1'
        });

        // INTEGRITÀ GATEKEEPER: Se il telaio risultava montato, la fase viene riaperta!
        if (comp.assemblyStatus === 'completed') {
          comp.assemblyStatus = 'todo';
          this.addNotification(
            `MONTAGGIO RIAPERTO ${comp.code}`,
            `Attenzione: ${operatorName} ha annullato un morale su ${comp.code}. La fase di montaggio al banco è stata automaticamente riaperta.`,
            'warning',
            operatorName,
            comp.code,
            projectId
          );
          this.logAuditAction({
            operator: operatorName,
            actionType: 'ASSEMBLY_REOPEN',
            actionLabel: 'RIAPERTURA MONTAGGIO',
            details: `Montaggio riaperto per ${comp.code} a seguito dell'annullo pezzo morale da parte di ${operatorName}`,
            projectCode: comp.code,
            componentCode: comp.code,
            station: 'Postazione Troncatrice 1'
          });
        }
      }

      comp.lastModified = `${dateStr} ${timeStr}`;
      comp.lastModifiedBy = operatorName;

      const allChecked = comp.morali.every(m => m.checked);
      const someChecked = comp.morali.some(m => m.checked);

      if (allChecked) {
        comp.cutStatus = 'completed';
        comp.cutOperator = operatorName;
        comp.cutDate = dateStr;
        if (!comp.cutEndTime) {
          comp.cutEndTime = timeStr;
        }

        this.addNotification(
          `TAGLIO COMPLETATO ${comp.code}`,
          `${operatorName} ha completato il taglio di tutti i morali del telaio ${comp.title}.`,
          'success',
          operatorName,
          comp.code,
          projectId
        );

        this.logAuditAction({
          operator: operatorName,
          actionType: 'CUT_FRAME_COMPLETE',
          actionLabel: 'TAGLIO COMPLETATO',
          details: `${operatorName} ha completato il taglio di tutti i morali del telaio ${comp.code} (${comp.title})`,
          componentCode: comp.code,
          station: 'Postazione Troncatrice 1'
        });
      } else if (someChecked) {
        comp.cutStatus = 'wip';
        if (!comp.cutOperator) comp.cutOperator = operatorName;
        if (!comp.cutStartTime) {
          comp.cutStartTime = timeStr;
          comp.cutDate = dateStr;
        }
      } else {
        comp.cutStatus = 'todo';
      }

      this.saveData(this.data);
      this.queueAction({ type: 'TOGGLE_MORAL', projectId, componentId, moralId, checked: moral.checked, operator: operatorName });
      return true;
    }
    return false;
  }

  addMoral(projectId, componentId, qty, length, desc) {
    const comp = this.getComponent(projectId, componentId);
    if (!comp) return false;

    if (!comp.morali) comp.morali = [];
    const newMoral = {
      id: 'moral-' + Date.now(),
      qty: parseInt(qty, 10) || 1,
      length: String(length).trim(),
      desc: desc ? desc.toUpperCase() : 'VARIANTE A MATITA',
      checked: false
    };

    comp.morali.push(newMoral);
    this.saveData(this.data);
    this.queueAction({ type: 'ADD_MORAL', projectId, componentId, moral: newMoral });
    return true;
  }

  deleteMoral(projectId, componentId, moralId) {
    const comp = this.getComponent(projectId, componentId);
    if (!comp || !comp.morali) return false;

    comp.morali = comp.morali.filter(m => m.id !== moralId);
    this.saveData(this.data);
    this.queueAction({ type: 'DELETE_MORAL', projectId, componentId, moralId });
    return true;
  }

  updateOperationStatus(projectId, componentId, phase, newStatus, operatorName) {
    const comp = this.getComponent(projectId, componentId);
    const proj = this.getProjectById(projectId);
    if (!comp) return false;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (phase === 'cut') {
      comp.cutStatus = newStatus;
      if (operatorName) comp.cutOperator = operatorName;

      if (newStatus === 'wip' && !comp.cutStartTime) {
        comp.cutStartTime = timeStr;
      } else if (newStatus === 'completed') {
        comp.cutEndTime = timeStr;
        if (comp.morali) comp.morali.forEach(m => m.checked = true);

        this.addNotification(
          `TAGLIO COMPLETATO ${comp.code}`,
          `${operatorName || 'Operatore'} ha completato il taglio per ${comp.title}. Pronto per assemblaggio banco.`,
          'success'
        );

        this.logWork(proj ? proj.title : 'Commessa', comp.code, 'Taglio Troncatrice', operatorName, comp.cutStartTime, timeStr);
      }
    } else if (phase === 'assembly') {
      comp.assemblyStatus = newStatus;
      if (operatorName) comp.assemblyOperator = operatorName;

      if (newStatus === 'wip' && !comp.assemblyStartTime) {
        comp.assemblyStartTime = timeStr;
      } else if (newStatus === 'completed') {
        comp.assemblyEndTime = timeStr;

        this.addNotification(
          `ASSEMBLAGGIO COMPLETATO ${comp.code}`,
          `${operatorName || 'Operatore'} ha terminato l'assemblaggio di ${comp.title}.`,
          'success'
        );

        this.logWork(proj ? proj.title : 'Commessa', comp.code, 'Assemblaggio Banco', operatorName, comp.assemblyStartTime, timeStr);
      }
    }

    this.saveData(this.data);
    this.queueAction({ type: 'UPDATE_STATUS', projectId, componentId, phase, newStatus, operatorName, time: timeStr });
    return true;
  }

  logWork(projectName, componentCode, phase, operator, startTime, endTime, durationMinutes = null) {
    if (!this.data.workLogs) this.data.workLogs = [];
    
    let calcDuration = durationMinutes;
    if (!calcDuration && startTime && endTime && startTime.includes(':') && endTime.includes(':')) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      calcDuration = Math.max(1, (eh * 60 + em) - (sh * 60 + sm));
    }

    const logEntry = {
      id: 'log-' + Date.now(),
      projectName,
      componentCode,
      phase,
      operator: operator || 'NON SPECIFICATO',
      startTime: startTime || '--',
      endTime: endTime || '--',
      durationMinutes: calcDuration || 1,
      date: new Date().toLocaleDateString('it-IT'),
      status: 'COMPLETATO'
    };

    this.data.workLogs.unshift(logEntry);
    this.saveData(this.data);
    this.queueAction({ type: 'LOG_WORK', log: logEntry });
    return logEntry;
  }

  // --- ALGORITMO DI NESTING & AGGREGAZIONE CUMULATIVA COMMESSA PER TRONCATRICE ---
  getBatchCuttingList(projectId) {
    const project = this.getProjectById(projectId);
    if (!project || !project.components) return [];

    const map = new Map();

    project.components.forEach(comp => {
      (comp.morali || []).forEach(m => {
        const len = parseFloat(m.length) || 0;
        const desc = m.desc || 'Elemento strutturale';
        const key = `${desc.trim().toLowerCase()}__${len.toFixed(2)}`;

        if (!map.has(key)) {
          map.set(key, {
            desc: desc,
            length: len,
            lengthStr: m.length,
            totalQty: 0,
            checkedQty: 0,
            componentCodes: new Set()
          });
        }
        const item = map.get(key);
        const qty = parseInt(m.qty, 10) || 1;
        item.totalQty += qty;
        if (m.checked) {
          item.checkedQty += qty;
        }
        item.componentCodes.add(comp.code);
      });
    });

    const list = Array.from(map.values()).map(item => {
      const totalLinearMm = item.totalQty * item.length;
      const totalLinearM = (totalLinearMm / 1000).toFixed(2);
      const codesStr = Array.from(item.componentCodes).join(', ');
      
      // Standard barre da 6000 mm (6.0 metri)
      const STANDARD_BAR_MM = 6000;
      const piecesPerBar = Math.floor(STANDARD_BAR_MM / item.length);
      let barsNeeded = 0;
      let wasteM = 0;
      let wastePercent = 0;

      if (piecesPerBar > 0) {
        barsNeeded = Math.ceil(item.totalQty / piecesPerBar);
        const totalRawMm = barsNeeded * STANDARD_BAR_MM;
        const totalUsedMm = item.totalQty * item.length;
        wasteM = Math.max(0, (totalRawMm - totalUsedMm) / 1000).toFixed(2);
        wastePercent = totalRawMm > 0 ? Math.max(0, ((totalRawMm - totalUsedMm) / totalRawMm) * 100).toFixed(1) : 0;
      } else {
        barsNeeded = item.totalQty;
        wasteM = '0.00';
        wastePercent = '0.0';
      }

      return {
        ...item,
        usedIn: codesStr,
        componentCodesStr: codesStr,
        totalLinearM,
        barsNeeded,
        wasteM,
        wastePercent,
        isOversized: item.length > STANDARD_BAR_MM,
        isCompleted: item.checkedQty >= item.totalQty
      };
    });

    // Ordine decrescente: si tagliano prima i pezzi più lunghi
    return list.sort((a, b) => b.length - a.length);
  }

  // Algoritmo di Nesting 1D Ottimizzato (First-Fit Decreasing) per Troncatrice
  calculate1DNesting(projectId, standardBarMm = 6000) {
    const project = this.getProjectById(projectId);
    if (!project || !project.components) {
      return { totalPieces: 0, totalLinearMeters: 0, totalRawBarsNeeded: 0, wastePercentage: 0, bars: [] };
    }

    const pieces = [];
    project.components.forEach(comp => {
      (comp.morali || []).forEach(m => {
        const len = parseFloat(m.length) || 0;
        const qty = parseInt(m.qty, 10) || 1;
        for (let i = 0; i < qty; i++) {
          pieces.push({ length: len, desc: m.desc || 'Elemento', compCode: comp.code });
        }
      });
    });

    if (pieces.length === 0) {
      return { totalPieces: 0, totalLinearMeters: 0, totalRawBarsNeeded: 0, wastePercentage: 0, bars: [] };
    }

    // Ordine decrescente FFD
    pieces.sort((a, b) => b.length - a.length);

    const bars = [];
    pieces.forEach(p => {
      let placed = false;
      for (const bar of bars) {
        if (bar.remainingMm >= p.length) {
          bar.cuts.push(p);
          bar.remainingMm -= p.length;
          placed = true;
          break;
        }
      }
      if (!placed) {
        const newBarLength = Math.max(standardBarMm, p.length);
        bars.push({
          barLengthMm: newBarLength,
          remainingMm: newBarLength - p.length,
          cuts: [p]
        });
      }
    });

    const totalPieces = pieces.length;
    const totalLinearMm = pieces.reduce((sum, p) => sum + p.length, 0);
    const totalLinearMeters = totalLinearMm / 1000;
    const totalRawMm = bars.reduce((sum, b) => sum + b.barLengthMm, 0);
    const wasteMm = Math.max(0, totalRawMm - totalLinearMm);
    const wastePercentage = totalRawMm > 0 ? ((wasteMm / totalRawMm) * 100).toFixed(1) : 0;

    return {
      totalPieces,
      totalLinearMeters,
      totalRawBarsNeeded: bars.length,
      wastePercentage,
      bars
    };
  }

  assignComponentOperator(projectId, componentId, phase, operatorName) {
    const comp = this.getComponent(projectId, componentId);
    if (!comp) return false;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (phase === 'cut') {
      comp.cutOperator = operatorName;
    } else if (phase === 'assembly') {
      comp.assemblyOperator = operatorName;
    }
    comp.lastModified = `${dateStr} ${timeStr}`;
    comp.lastModifiedBy = operatorName;

    this.saveData(this.data);
    this.addNotification(
      `ASSEGNAZIONE ${comp.code}`,
      `${operatorName} assegnato a ${phase === 'cut' ? 'Taglio' : 'Montaggio Banco'} su ${comp.code}.`,
      'info',
      operatorName,
      comp.code,
      projectId
    );
    return true;
  }

  // --- DATI PER RAPPORTINO DI LAVORO GIORNALIERO (DA FOTO ALLEGATE) ---
  getRapportinoData(targetDate = null) {
    let dateStr = targetDate;
    if (!dateStr) {
      dateStr = new Date().toLocaleDateString('it-IT');
    } else if (dateStr.includes('-')) {
      const [yyyy, mm, dd] = dateStr.split('-');
      dateStr = `${dd}.${mm}.${yyyy}`;
    }

    const normalize = (d) => String(d || '').replace(/\//g, '.').trim();
    const targetNorm = normalize(dateStr);

    const logs = (this.data.workLogs || []).filter(l => {
      const lDate = normalize(l.date);
      return lDate === targetNorm || lDate === 'OGGI';
    });

    const rows = logs.map((l, idx) => ({
      numero: idx + 1,
      lavorazione: `${l.projectName} · ${l.componentCode} (${l.phase})`,
      operaContratto: `${l.projectName} - ${l.componentCode}`,
      operatore: l.operator || 'Francesca',
      data: l.date || dateStr,
      oraEntrata: l.startTime || '08:00',
      oraUscita: l.endTime || '12:00',
      oreLavorate: l.durationMinutes ? (l.durationMinutes / 60).toFixed(1) : '2.0',
      quantita: '1 TELAIO',
      materiale: 'Morali abete C24 piallato, listelli di fermo'
    }));

    if (rows.length === 0) {
      // Dati realistici iniziali per il foglio stampabile
      rows.push(
        {
          numero: 1,
          lavorazione: 'Cabine Etruria Nuova · PM 01 - PM 02 (Taglio Troncatrice)',
          operaContratto: 'Cabine Balneari Etruria - PM 01 Telaio Anteriore DX/SX',
          operatore: 'Francesca',
          data: dateStr,
          oraEntrata: '08:30',
          oraUscita: '10:45',
          oreLavorate: '2.25',
          quantita: '2 TELAI',
          materiale: 'Morali lamellare 60x80, listelli fermo'
        },
        {
          numero: 2,
          lavorazione: 'Cabine Etruria Nuova · PM 09 (Taglio Troncatrice)',
          operaContratto: 'Cabine Balneari Etruria - PM 09 Telaio Posteriore',
          operatore: 'Francesca',
          data: dateStr,
          oraEntrata: '10:45',
          oraUscita: '12:30',
          oreLavorate: '1.75',
          quantita: '1 TELAIO',
          materiale: 'Correnti 3034 mm, montanti 1200 mm'
        },
        {
          numero: 3,
          lavorazione: 'Cabine Etruria Nuova · PM 01 (Banco Assemblaggio)',
          operaContratto: 'Cabine Balneari Etruria - Assemblaggio Telaio Anteriore',
          operatore: 'Daniel',
          data: dateStr,
          oraEntrata: '11:00',
          oraUscita: '13:00',
          oreLavorate: '2.00',
          quantita: '1 TELAIO',
          materiale: 'Viteria inox, colla poliuretanica D4'
        }
      );
    }

    const totaleOre = rows.reduce((acc, r) => acc + (parseFloat(r.oreLavorate) || 0), 0).toFixed(2);

    return {
      data: dateStr,
      rows,
      totaleOre,
      cantierePredefinito: 'Cantiere 1: Marina di Grosseto (GR)',
      clientePredefinito: 'Stabilimento Balneare Etruria Nuova',
      numeroRapportino: 'RP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 899 + 100))
    };
  }

    calculateProjectProgress(project) {
    if (!project || !project.components || project.components.length === 0) {
      return project.status === 'completed' ? 100 : 0;
    }

    let totalPoints = project.components.length * 2;
    let earnedPoints = 0;

    project.components.forEach(comp => {
      if (comp.cutStatus === 'completed') {
        earnedPoints += 1;
      } else if (comp.cutStatus === 'wip' || comp.cutStatus === 'paused') {
        if (comp.morali && comp.morali.length > 0) {
          const checkedCount = comp.morali.filter(m => m.checked).length;
          earnedPoints += (checkedCount / comp.morali.length) * 0.9;
        } else {
          earnedPoints += 0.5;
        }
      }

      if (comp.assemblyStatus === 'completed') {
        earnedPoints += 1;
      } else if (comp.assemblyStatus === 'wip' || comp.assemblyStatus === 'paused') {
        earnedPoints += 0.5;
      }
    });

    const percent = Math.round((earnedPoints / totalPoints) * 100);
    return Math.min(100, Math.max(0, percent));
  }

  addNotification(title, message, type = 'info', operatorName = null, componentCode = null, projectId = null) {
    if (!this.data.notifications) this.data.notifications = [];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;

    const notif = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type, // 'success' | 'info' | 'warning'
      operator: operatorName || 'Operatore',
      componentCode: componentCode || '',
      projectId: projectId || '',
      time: timeStr,
      date: dateStr,
      timestamp: Date.now(),
      read: false
    };

    this.data.notifications.unshift(notif);
    if (this.data.notifications.length > 80) {
      this.data.notifications.pop();
    }
    this.saveData(this.data);
    return notif;
  }

  getNotifications() {
    return this.data.notifications || [];
  }

  getUnreadNotificationsCount() {
    return (this.data.notifications || []).filter(n => !n.read).length;
  }

  markNotificationsRead() {
    if (this.data.notifications) {
      this.data.notifications.forEach(n => n.read = true);
      this.saveData(this.data);
    }
  }

  updateProject(projectId, fields) {
    const project = this.getProjectById(projectId);
    if (!project) return false;

    Object.assign(project, fields);
    this.saveData(this.data);
    this.queueAction({ type: 'UPDATE_PROJECT', projectId, fields });
    return true;
  }

  deleteProject(projectId) {
    this.data.projects = this.data.projects.filter(p => p.id !== projectId);
    this.saveData(this.data);
    this.queueAction({ type: 'DELETE_PROJECT', projectId });
  }

  addProject(newProj) {
    this.data.projects.unshift(newProj);
    this.saveData(this.data);
    this.queueAction({ type: 'ADD_PROJECT', project: newProj });
  }

  updateComponent(projectId, componentId, fields) {
    const comp = this.getComponent(projectId, componentId);
    if (!comp) return false;
    Object.assign(comp, fields);
    this.saveData(this.data);
    this.queueAction({ type: 'UPDATE_COMPONENT', projectId, componentId, fields });
    return true;
  }

  deleteComponent(projectId, componentId) {
    const project = this.getProjectById(projectId);
    if (!project || !project.components) return false;
    project.components = project.components.filter(c => c.id !== componentId);
    project.totalComponents = project.components.length;
    this.saveData(this.data);
    this.queueAction({ type: 'DELETE_COMPONENT', projectId, componentId });
    return true;
  }

  // ==========================================================================
  // AUDIT TRAIL ENGINE (STORICO COMPLETO MOVIMENTI & AZIONI OPERATORI PER ADMIN)
  // ==========================================================================

  getInitialAuditLogs() {
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = `${String(yesterday.getDate()).padStart(2, '0')}.${String(yesterday.getMonth() + 1).padStart(2, '0')}.${yesterday.getFullYear()}`;

    return [
      {
        id: 'audit-1',
        timestamp: Date.now() - 1000 * 60 * 18,
        date: dateStr,
        time: '11:52:14',
        operator: 'Francesca',
        actionType: 'CUT_PIECE',
        actionLabel: 'SPUNTA TAGLIO',
        details: 'Francesca ha tagliato e spuntato Morale NR 2 L. 2800.00 mm (Montanti portanti C24) su telaio PM 01',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'PM 01',
        station: 'Postazione Troncatrice 1'
      },
      {
        id: 'audit-2',
        timestamp: Date.now() - 1000 * 60 * 20,
        date: dateStr,
        time: '11:50:02',
        operator: 'Francesca',
        actionType: 'CUT_FRAME_COMPLETE',
        actionLabel: 'TAGLIO COMPLETATO',
        details: 'Francesca ha completato il taglio di tutti i 6 morali del Telaio Posteriore PM 09',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'PM 09',
        station: 'Postazione Troncatrice 1'
      },
      {
        id: 'audit-3',
        timestamp: Date.now() - 1000 * 60 * 35,
        date: dateStr,
        time: '11:35:10',
        operator: 'Daniel',
        actionType: 'TIMER_STOP',
        actionLabel: 'REGISTRAZIONE TEMPO',
        details: 'Daniel ha registrato 95 minuti di lavorazione al banco su PM 09 (Assemblaggio Banco)',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'PM 09',
        station: 'Banco Assemblaggio 1'
      },
      {
        id: 'audit-4',
        timestamp: Date.now() - 1000 * 60 * 70,
        date: dateStr,
        time: '11:00:15',
        operator: 'Daniel',
        actionType: 'TIMER_START',
        actionLabel: 'AVVIO CRONOMETRO',
        details: 'Daniel ha avviato cronometro reale per Assemblaggio Banco telaio PM 01',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'PM 01',
        station: 'Banco Assemblaggio 1'
      },
      {
        id: 'audit-5',
        timestamp: Date.now() - 1000 * 60 * 82,
        date: dateStr,
        time: '10:48:33',
        operator: 'Daniel',
        actionType: 'ASSEMBLY_COMPLETE',
        actionLabel: 'MONTAGGIO COMPLETATO',
        details: 'Daniel ha concluso assemblaggio strutturale e collaudo banco telaio PM 01',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'PM 01',
        station: 'Banco Assemblaggio 1'
      },
      {
        id: 'audit-6',
        timestamp: Date.now() - 1000 * 60 * 115,
        date: dateStr,
        time: '10:15:20',
        operator: 'Francesca',
        actionType: 'QR_PRINT',
        actionLabel: 'STAMPA ETICHETTA QR',
        details: 'Francesca ha generato e stampato etichetta tecnica QR per posa in cantiere telaio PM 01',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'PM 01',
        station: 'Postazione Troncatrice 1'
      },
      {
        id: 'audit-7',
        timestamp: Date.now() - 1000 * 60 * 145,
        date: dateStr,
        time: '09:45:10',
        operator: 'Francesca',
        actionType: 'CUT_PIECE',
        actionLabel: 'SPUNTA TAGLIO',
        details: 'Francesca ha tagliato e spuntato 3 traversi L. 1450.00 mm (Traversi orizzontali C24) su PM 01',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'PM 01',
        station: 'Postazione Troncatrice 1'
      },
      {
        id: 'audit-8',
        timestamp: Date.now() - 1000 * 60 * 180,
        date: dateStr,
        time: '09:10:00',
        operator: 'Maurizio',
        actionType: 'RAPPORTINO_PRINT',
        actionLabel: 'RAPPORTINO GIORNALIERO',
        details: 'Maurizio ha compilato e verificato il Rapportino Giornaliero Officina & Cantiere',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: '--',
        station: 'Ufficio Amministrazione'
      },
      {
        id: 'audit-9',
        timestamp: Date.now() - 1000 * 60 * 220,
        date: dateStr,
        time: '08:30:00',
        operator: 'Maurizio',
        actionType: 'CAD_APPROVAL',
        actionLabel: 'APPROVAZIONE SEMA CAD',
        details: 'Maurizio ha approvato le tavole tecniche CAD SEMA per produzione Cabine Etruria Nuova',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'SEMA 4.0',
        station: 'Ufficio Tecnico'
      },
      {
        id: 'audit-10',
        timestamp: Date.now() - 1000 * 60 * 250,
        date: dateStr,
        time: '08:00:12',
        operator: 'Michele',
        actionType: 'ADMIN_LOGIN',
        actionLabel: 'ACCESSO ADMIN PIN 1991',
        details: 'Michele (Admin) ha effettuato accesso privilegiato con PIN 1991 per controllo turni e distinte',
        projectCode: '--',
        projectName: '--',
        componentCode: 'ADMIN',
        station: 'Postazione Ufficio Tecnico'
      },
      {
        id: 'audit-11',
        timestamp: Date.now() - 1000 * 60 * 1350,
        date: yestStr,
        time: '17:40:05',
        operator: 'Michele',
        actionType: 'PROJECT_CREATE',
        actionLabel: 'IMPORTAZIONE PDF SEMA',
        details: 'Michele ha creato la commessa COMM-4012 Cabine Balneari Etruria con parsing 12 telai da PDF SEMA',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'TUTTI',
        station: 'Postazione Ufficio Tecnico'
      },
      {
        id: 'audit-12',
        timestamp: Date.now() - 1000 * 60 * 1420,
        date: yestStr,
        time: '16:30:00',
        operator: 'Francesca',
        actionType: 'BATCH_SAW_CALC',
        actionLabel: 'CALCOLO NESTING BARRE',
        details: 'Francesca ha calcolato il fabbisogno barre grezze da 6m con nesting 1D per commessa COMM-4012 (sfrido 8.2%)',
        projectCode: 'COMM-4012',
        projectName: 'Cabine Balneari Etruria Nuova',
        componentCode: 'TRONCATRICE',
        station: 'Postazione Troncatrice 1'
      }
    ];
  }

  logAuditAction({
    operator = null,
    actionType = 'INFO',
    actionLabel = 'MOVIMENTO',
    details = '',
    projectCode = '',
    projectName = '',
    componentCode = '',
    station = 'Officina Produzione'
  }) {
    if (!this.data.auditLogs) this.data.auditLogs = [];

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const entry = {
      id: 'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      operator: operator || (typeof AUTH !== 'undefined' && AUTH.activeOperator ? AUTH.activeOperator.name : 'Operatore'),
      actionType,
      actionLabel,
      details,
      projectCode,
      projectName,
      componentCode,
      station,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now()
    };

    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.saveData(this.data);
    this.queueAction({ type: 'AUDIT_LOG', log: entry });
    return entry;
  }

  getAuditLogs(filters = {}) {
    let logs = this.data.auditLogs || [];

    if (filters.operator && filters.operator !== 'all') {
      const op = filters.operator.toLowerCase();
      logs = logs.filter(l => l.operator && l.operator.toLowerCase() === op);
    }

    if (filters.actionCategory && filters.actionCategory !== 'all') {
      switch (filters.actionCategory) {
        case 'CUT':
          logs = logs.filter(l => l.actionType && (l.actionType.includes('CUT') || (l.actionLabel && l.actionLabel.includes('TAGLIO'))));
          break;
        case 'ASSEMBLY':
          logs = logs.filter(l => l.actionType && (l.actionType.includes('ASSEMBLY') || (l.actionLabel && l.actionLabel.includes('MONTAGGIO'))));
          break;
        case 'TIMER':
          logs = logs.filter(l => l.actionType && (l.actionType.includes('TIMER') || (l.actionLabel && l.actionLabel.includes('TEMPO'))));
          break;
        case 'CAD_PROJECT':
          logs = logs.filter(l => l.actionType && (l.actionType.includes('PROJECT') || l.actionType.includes('COMPONENT') || l.actionType.includes('MORAL') || l.actionType.includes('CAD')));
          break;
        case 'PRINT':
          logs = logs.filter(l => l.actionType && (l.actionType.includes('PRINT') || l.actionType.includes('QR') || (l.actionLabel && l.actionLabel.includes('STAMPA'))));
          break;
        case 'ADMIN':
          logs = logs.filter(l => l.actionType && (l.actionType.includes('ADMIN') || l.operator === 'Michele'));
          break;
      }
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      logs = logs.filter(l =>
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.actionLabel && l.actionLabel.toLowerCase().includes(q)) ||
        (l.operator && l.operator.toLowerCase().includes(q)) ||
        (l.componentCode && l.componentCode.toLowerCase().includes(q)) ||
        (l.projectName && l.projectName.toLowerCase().includes(q)) ||
        (l.station && l.station.toLowerCase().includes(q))
      );
    }

    if (filters.dateRange === 'today') {
      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
      logs = logs.filter(l => l.date === todayStr || l.date === 'OGGI');
    }

    return logs;
  }

  getAuditKPIs() {
    const logs = this.data.auditLogs || [];
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    const todayLogs = logs.filter(l => l.date === todayStr || l.date === 'OGGI');

    const opCount = {};
    todayLogs.forEach(l => {
      const op = l.operator || 'Non Assegnato';
      opCount[op] = (opCount[op] || 0) + 1;
    });

    let topOp = '--';
    let maxCount = 0;
    for (const [op, cnt] of Object.entries(opCount)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        topOp = `${op} (${cnt})`;
      }
    }

    const latest = logs.length > 0 ? logs[0] : null;

    return {
      totalCount: logs.length,
      todayCount: todayLogs.length,
      topOperator: topOp,
      latestAction: latest ? `${latest.operator} · ${latest.time}` : '--'
    };
  }

  exportAuditLogsCSV(filters = {}) {
    const logs = this.getAuditLogs(filters);
    const headers = ['ID', 'Data', 'Ora', 'Operatore', 'Azione', 'Commessa', 'Telaio', 'Dettagli Movimento', 'Postazione'];

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    const csvRows = [headers.join(';')];

    logs.forEach(l => {
      csvRows.push([
        escapeCsv(l.id),
        escapeCsv(l.date),
        escapeCsv(l.time),
        escapeCsv(l.operator),
        escapeCsv(l.actionLabel || l.actionType),
        escapeCsv(l.projectCode ? `${l.projectCode} - ${l.projectName}` : (l.projectName || '--')),
        escapeCsv(l.componentCode || '--'),
        escapeCsv(l.details),
        escapeCsv(l.station || 'Officina')
      ].join(';'));
    });

    return '\uFEFF' + csvRows.join('\r\n');
  }

  clearAuditLogs() {
    this.data.auditLogs = [];
    this.saveData(this.data);
    this.queueAction({ type: 'CLEAR_AUDIT_LOGS' });
  }

}

const DB = new StorageManager();
