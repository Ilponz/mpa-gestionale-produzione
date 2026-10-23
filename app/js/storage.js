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
      } else {
        delete moral.checkedBy;
        delete moral.checkedAt;
        delete moral.checkedDate;
        delete moral.checkedTimestamp;
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
        componentCodesStr: Array.from(item.componentCodes).join(', '),
        totalLinearM,
        barsNeeded,
        wasteM,
        wastePercent,
        isCompleted: item.checkedQty >= item.totalQty
      };
    });

    // Ordine decrescente: si tagliano prima i pezzi più lunghi
    return list.sort((a, b) => b.length - a.length);
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
    const dateStr = targetDate || new Date().toLocaleDateString('it-IT');
    const logs = (this.data.workLogs || []).filter(l => l.date === dateStr || l.date === 'OGGI');

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
}

const DB = new StorageManager();
