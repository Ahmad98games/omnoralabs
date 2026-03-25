/**
 * 🛠️ OMNORA LABS | SYSTEM TELEMETRY
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Kernel Core
 * "Telemetry is the pulse of industrial integrity."
 * ---------------------------------------------------------
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM-INTEGRITY';

export class OmnoraLogger {
    private static formatMessage(level: LogLevel, category: string, message: string) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] [${category}] ${message}`;
    }

    public static info(category: string, message: string) {
        console.log(this.formatMessage('INFO', category, message));
    }

    public static warn(category: string, message: string) {
        console.warn(this.formatMessage('WARN', category, message));
    }

    public static error(category: string, message: string) {
        console.error(this.formatMessage('ERROR', category, message));
    }

    public static integrity(category: string, message: string) {
        console.log(`%c${this.formatMessage('SYSTEM-INTEGRITY', category, message)}`, 'color: #00ff00; font-weight: bold;');
    }
}
