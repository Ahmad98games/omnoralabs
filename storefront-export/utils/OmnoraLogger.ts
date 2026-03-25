/**
 * 🛠️ OMNORA LABS | KERNEL LOGGING UTILITY
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Precision is the foundation of industrial scale."
 * ---------------------------------------------------------
 */

export const OmnoraLogger = {
  /**
   * Dispatches a system information payload to the terminal.
   * @param message Industrial log message
   * @param payload Optional technical metadata
   */
  info: (message: string, payload?: unknown): void => {
    console.log(`[OMNORA-SYSTEM-INTEGRITY]: ${message}`, payload ?? "");
  },

  /**
   * Reports a critical system integrity fault.
   * @param message Error description
   * @param fault Exception or error object
   */
  error: (message: string, fault?: unknown): void => {
    console.error(`[OMNORA-SYSTEM-INTEGRITY][ERROR]: ${message}`, fault ?? "");
  },

  /**
   * Records a non-critical system anomaly.
   * @param message Warning description
   * @param anomaly Associated anomaly data
   */
  warn: (message: string, anomaly?: unknown): void => {
    console.warn(`[OMNORA-SYSTEM-INTEGRITY][WARN]: ${message}`, anomaly ?? "");
  },
};
