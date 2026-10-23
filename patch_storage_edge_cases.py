# -*- coding: utf-8 -*-
"""
Patch per app/js/storage.js per sistemare tutte le casistiche di logica:
1. calculate1DNesting con algoritmo FFD
2. usedIn in getBatchCuttingList
3. Reversione automatica montaggio se un morale viene annullato su telaio montato
4. Normalizzazione date in getRapportinoData
"""

with open('app/js/storage.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Inserisci calculate1DNesting e fissa usedIn in getBatchCuttingList
old_batch_list_end = r'''    const list = Array.from(map.values()).map(item => {
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
  }'''

new_batch_list_end = r'''    const list = Array.from(map.values()).map(item => {
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
  }'''

assert old_batch_list_end in code, 'old_batch_list_end not found'
code = code.replace(old_batch_list_end, new_batch_list_end, 1)

# 2. Gatekeeper Integrity: Se un pezzo viene annullato su telaio già montato, riapri montaggio
target_unchecked_audit = r'''        this.logAuditAction({
          operator: operatorName,
          actionType: 'UNCUT_PIECE',
          actionLabel: 'ANNULLO TAGLIO',
          details: `${operatorName} ha annullato la spunta per Morale NR ${moral.qty} L. ${moral.length} mm (${moral.desc}) su telaio ${comp.code}`,
          projectCode: comp.code,
          componentCode: comp.code,
          station: 'Postazione Troncatrice 1'
        });
      }'''

replacement_unchecked_audit = r'''        this.logAuditAction({
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
      }'''

assert target_unchecked_audit in code, 'target_unchecked_audit not found'
code = code.replace(target_unchecked_audit, replacement_unchecked_audit, 1)

# 3. Normalizzazione universale date in getRapportinoData
old_rap_date = r'''  getRapportinoData(targetDate = null) {
    const dateStr = targetDate || new Date().toLocaleDateString('it-IT');
    const logs = (this.data.workLogs || []).filter(l => l.date === dateStr || l.date === 'OGGI');'''

new_rap_date = r'''  getRapportinoData(targetDate = null) {
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
    });'''

assert old_rap_date in code, 'old_rap_date not found'
code = code.replace(old_rap_date, new_rap_date, 1)

with open('app/js/storage.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: storage.js patched with edge cases logic.")
