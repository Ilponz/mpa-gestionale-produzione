# -*- coding: utf-8 -*-
"""
Append audit styles to app/css/style.css
"""

audit_css = r'''
/* ==========================================================================
   PANNELLO ADMIN: STORICO MOVIMENTI GLOBALE & AUDIT PRODUZIONE
   ========================================================================== */

.admin-audit-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #FFFFFF;
  padding: 5px 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 120ms ease;
  letter-spacing: 0.04em;
}

.admin-audit-btn:hover {
  background: #FFFFFF;
  color: #000000;
  border-color: #FFFFFF;
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.4);
}

.audit-kpi-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding: 14px 20px;
  background: rgba(8, 10, 14, 0.95);
  border-bottom: var(--glass-border-light);
}

.audit-kpi-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.audit-kpi-val {
  font-size: 20px;
  font-weight: 800;
  font-family: var(--font-display);
  color: #FFFFFF;
  letter-spacing: 0.04em;
}

.audit-kpi-label {
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.audit-table th {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(16, 20, 28, 0.98);
}

.audit-table td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  vertical-align: middle;
}

.audit-table tr:hover td {
  background: rgba(255, 255, 255, 0.04);
  color: #FFFFFF;
}

.audit-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 700;
  font-family: var(--font-mono);
  padding: 2px 7px;
  text-transform: uppercase;
  border-radius: 0 !important;
  white-space: nowrap;
}

.audit-badge-cut {
  background: rgba(0, 255, 136, 0.12);
  color: #00FF88;
  border: 1px solid rgba(0, 255, 136, 0.35);
}

.audit-badge-assembly {
  background: rgba(0, 229, 255, 0.12);
  color: #00E5FF;
  border: 1px solid rgba(0, 229, 255, 0.35);
}

.audit-badge-timer {
  background: rgba(255, 174, 66, 0.12);
  color: #FFAE42;
  border: 1px solid rgba(255, 174, 66, 0.35);
}

.audit-badge-cad {
  background: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.audit-badge-print {
  background: rgba(199, 125, 255, 0.12);
  color: #C77DFF;
  border: 1px solid rgba(199, 125, 255, 0.35);
}

.audit-badge-admin {
  background: rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
  border: 1px solid #FFFFFF;
}

.audit-badge-delete {
  background: rgba(255, 68, 68, 0.15);
  color: #FF5555;
  border: 1px solid rgba(255, 68, 68, 0.4);
}

/* Stampa Report Audit A4 */
@media print {
  #audit-print-area, #audit-print-area * {
    visibility: visible !important;
  }
  #audit-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    background: #FFFFFF !important;
    color: #000000 !important;
  }
  #audit-print-area table {
    color: #000000 !important;
  }
  #audit-print-area th, #audit-print-area td {
    color: #000000 !important;
    border-color: #000000 !important;
  }
}
'''

with open('app/css/style.css', 'a', encoding='utf-8') as f:
    f.write(audit_css)

print("SUCCESS: Audit styles appended to app/css/style.css.")
