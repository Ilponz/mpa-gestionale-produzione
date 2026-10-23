# -*- coding: utf-8 -*-
"""
Patch per app/js/storage.js per integrare Audit Trail / Storico Movimenti Globale
"""

with open('app/js/storage.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Assicurati che parsed.auditLogs venga caricato in loadData()
old_load = '''        if (!parsed.workLogs) {
          parsed.workLogs = this.getInitialWorkLogs();
        }'''

new_load = '''        if (!parsed.workLogs) {
          parsed.workLogs = this.getInitialWorkLogs();
        }
        if (!parsed.auditLogs || parsed.auditLogs.length === 0) {
          parsed.auditLogs = this.getInitialAuditLogs();
        }'''

assert old_load in code, 'old_load not found in storage.js'
code = code.replace(old_load, new_load, 1)

old_init_save = '''    initial.notifications = this.getInitialNotifications();
    initial.workLogs = this.getInitialWorkLogs();'''

new_init_save = '''    initial.notifications = this.getInitialNotifications();
    initial.workLogs = this.getInitialWorkLogs();
    initial.auditLogs = this.getInitialAuditLogs();'''

assert old_init_save in code, 'old_init_save not found in storage.js'
code = code.replace(old_init_save, new_init_save, 1)

# 2. Aggiungi i metodi di audit prima della chiusura della classe
audit_methods = r'''
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
'''

# Inserisci i metodi audit prima dell'ultima parentesi graffa di StorageManager
last_brace = code.rfind('}')
assert last_brace != -1
code = code[:last_brace] + audit_methods + '\n}\n\nconst DB = new StorageManager();\n'

with open('app/js/storage.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: app/js/storage.js patched with Audit Trail engine.")
