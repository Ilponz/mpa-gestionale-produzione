/**
 * AUTH & ROLE MANAGER (M.P.A. PRODUZIONE)
 * Gestisce l'identificazione operatore a un tocco e la protezione PIN Admin per Maurizio.
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
  }

  loadActiveOperator() {
    const saved = localStorage.getItem(AUTH_KEYS.ACTIVE_OP);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Operatore di default: Francesca
    const defaultOp = INITIAL_DATA.operators[0];
    this.setActiveOperator(defaultOp);
    return defaultOp;
  }

  setActiveOperator(operator) {
    this.activeOperator = operator;
    localStorage.setItem(AUTH_KEYS.ACTIVE_OP, JSON.stringify(operator));
  }

  // Verifica PIN Admin per Maurizio
  verifyAdminPin(pin) {
    if (pin === DEFAULT_ADMIN_PIN) {
      this.isAdmin = true;
      return true;
    }
    return false;
  }

  logoutAdmin() {
    this.isAdmin = false;
  }
}

const AUTH = new AuthManager();
