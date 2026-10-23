# -*- coding: utf-8 -*-
"""
Patch hook audit su storage.js
"""

with open('app/js/storage.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Hook su toggleMoral
target_checked = r'''        this.addNotification(
          `TAGLIO MORALE ${comp.code}`,
          `${operatorName} ha tagliato e spuntato: NR ${moral.qty} L. ${moral.length} mm (${moral.desc}) su ${comp.code}.`,
          'info',
          operatorName,
          comp.code,
          projectId
        );'''

replacement_checked = r'''        this.addNotification(
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
        });'''

assert target_checked in code, 'target_checked not found'
code = code.replace(target_checked, replacement_checked, 1)

target_unchecked = r'''      } else {
        delete moral.checkedBy;
        delete moral.checkedAt;
        delete moral.checkedDate;
        delete moral.checkedTimestamp;
      }'''

replacement_unchecked = r'''      } else {
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
      }'''

assert target_unchecked in code, 'target_unchecked not found'
code = code.replace(target_unchecked, replacement_unchecked, 1)

# 2. Hook su allChecked
target_all_checked = r'''        this.addNotification(
          `TAGLIO COMPLETATO ${comp.code}`,
          `${operatorName} ha completato il taglio di tutti i morali del telaio ${comp.title}.`,
          'success',
          operatorName,
          comp.code,
          projectId
        );'''

replacement_all_checked = r'''        this.addNotification(
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
        });'''

assert target_all_checked in code, 'target_all_checked not found'
code = code.replace(target_all_checked, replacement_all_checked, 1)

with open('app/js/storage.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: toggleMoral audit hooks added.")
