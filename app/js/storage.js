/**
 * STORAGE ENGINE & STATO LOCALE (OFFLINE-FIRST) v2.0
 * Gestisce la persistenza in LocalStorage, gestione operatori da Michele (Admin),
 * calcolo percentuali e distinta morali.
 */

const STORAGE_KEY = 'mpa_gestionale_data_v7';
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
        message: 'Francesca ha completato il taglio del Telaio Posteriore PM 09.',
        type: 'success',
        time: '11:50',
        date: 'OGGI',
        read: false
      },
      {
        id: 'notif-2',
        title: 'ASSEMBLAGGIO AVVIATO PM 01',
        message: 'Daniel ha iniziato l\'assemblaggio del Telaio Anteriore al banco.',
        type: 'info',
        time: '11:00',
        date: 'OGGI',
        read: false
      },
      {
        id: 'notif-3',
        title: 'SCADENZA COMMESSA',
        message: 'Cabine Etruria Nuova in scadenza il 15.10.2026.',
        type: 'warning',
        time: '08:00',
        date: 'IERI',
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

  toggleMoral(projectId, componentId, moralId) {
    const comp = this.getComponent(projectId, componentId);
    if (!comp || !comp.morali) return false;

    const moral = comp.morali.find(m => m.id === moralId);
    if (moral) {
      moral.checked = !moral.checked;

      const allChecked = comp.morali.every(m => m.checked);
      const someChecked = comp.morali.some(m => m.checked);

      if (allChecked) {
        comp.cutStatus = 'completed';
        if (!comp.cutEndTime) {
          const now = new Date();
          comp.cutEndTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
      } else if (someChecked && comp.cutStatus === 'todo') {
        comp.cutStatus = 'wip';
        if (!comp.cutStartTime) {
          const now = new Date();
          comp.cutStartTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
      }

      this.saveData(this.data);
      this.queueAction({ type: 'TOGGLE_MORAL', projectId, componentId, moralId, checked: moral.checked });
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

  logWork(projectName, componentCode, phase, operator, startTime, endTime) {
    if (!this.data.workLogs) this.data.workLogs = [];
    this.data.workLogs.unshift({
      id: 'log-' + Date.now(),
      projectName,
      componentCode,
      phase,
      operator: operator || 'NON SPECIFICATO',
      startTime: startTime || '--',
      endTime: endTime || '--',
      date: new Date().toLocaleDateString('it-IT'),
      status: 'COMPLETATO'
    });
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

  addNotification(title, message, type = 'info') {
    if (!this.data.notifications) this.data.notifications = [];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const notif = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      time: timeStr,
      date: 'OGGI',
      read: false
    };

    this.data.notifications.unshift(notif);
    this.saveData(this.data);
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
