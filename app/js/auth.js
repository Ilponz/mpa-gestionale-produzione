/**
 * AUTH & ROLE MANAGER (M.P.A. DI MAURIZIO CAVALLARO)
 * Gestisce l'identificazione operatore e la protezione rigida PIN Admin (1991) per Michele.
 */

const AUTH_KEYS = {
  ACTIVE_OP: 'mpa_active_operator',
  DEVICE_PAIR: 'mpa_device_paired',
  ADMIN_SESSION: 'mpa_admin_active'
};

const DEFAULT_ADMIN_PIN = '1991'; // Anno fondazione M.P.A.

class AuthManager {
  constructor() {
    this.activeOperator = this.loadActiveOperator();
    this.isAdmin = false;
    this.enteredPin = '';
    this.pendingAdminAction = null;
    this.pendingAdminTitle = '';
  }

  loadActiveOperator() {
    const saved = localStorage.getItem(AUTH_KEYS.ACTIVE_OP);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Operatore di default: Francesca
    const defaultOp = (typeof INITIAL_DATA !== 'undefined' && INITIAL_DATA.operators) 
      ? INITIAL_DATA.operators[0] 
      : { id: 'op-1', name: 'Francesca', role: 'Troncatrice & CAD', color: '#FFAE42', badgeClass: 'op-francesca' };
    this.setActiveOperator(defaultOp);
    return defaultOp;
  }

  setActiveOperator(operator) {
    this.activeOperator = operator;
    localStorage.setItem(AUTH_KEYS.ACTIVE_OP, JSON.stringify(operator));
  }

  setActiveOperatorById(id) {
    const ops = (typeof DB !== 'undefined' && DB.getOperators) ? DB.getOperators() : (INITIAL_DATA ? INITIAL_DATA.operators : []);
    const found = ops.find(o => o.id === id);
    if (found) {
      this.setActiveOperator(found);
      return found;
    }
    return null;
  }

  // Verifica PIN Admin per Michele
  verifyAdminPin(pin) {
    if (pin === DEFAULT_ADMIN_PIN) {
      this.isAdmin = true;
      return true;
    }
    return false;
  }

  logoutAdmin() {
    this.isAdmin = false;
    this.pendingAdminAction = null;
    this.pendingAdminTitle = '';
  }

  /**
   * Richiede privilegi Admin Michele per eseguire un'azione sensibile.
   * Se l'utente è già autenticato come Admin, esegue subito la callback.
   * Altrimenti apre il modal PIN 1991 e salva la callback per l'esecuzione post-sblocco.
   */
  requireAdmin(callback, actionName = 'Modifica riservata ad Admin') {
    if (this.isAdmin) {
      callback();
      return;
    }

    this.pendingAdminAction = callback;
    this.pendingAdminTitle = actionName;
    this.enteredPin = '';

    const modal = document.getElementById('modal-admin-pin');
    const pinTitle = document.getElementById('pin-modal-custom-title');
    if (pinTitle) {
      pinTitle.textContent = `PROTEZIONE: ${actionName.toUpperCase()}`;
    }

    if (window.app && typeof window.app.updatePinDots === 'function') {
      window.app.updatePinDots();
    }

    if (modal) {
      modal.style.display = 'flex';
      if (typeof gsap !== 'undefined') {
        const box = modal.querySelector('.modal-pin-box');
        if (box) {
          gsap.fromTo(box, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power2.out' });
        }
      }
    }
  }

  executePendingAction() {
    if (typeof this.pendingAdminAction === 'function') {
      const act = this.pendingAdminAction;
      this.pendingAdminAction = null;
      this.pendingAdminTitle = '';
      act();
    }
  }
}

const AUTH = new AuthManager();
