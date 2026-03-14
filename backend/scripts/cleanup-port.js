const { execSync } = require('child_process');
const os = require('os');

const PORT = 5000;

console.log(`[Cleaner] Checking for processes on port ${PORT}...`);

try {
    if (process.platform === 'win32') {
        // Windows: Find process and kill it
        try {
            const output = execSync(`netstat -ano`).toString();
            const lines = output.split('\n').filter(line => line.includes(`:${PORT}`) && line.includes('LISTENING'));

            if (lines.length > 0) {
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && parseInt(pid) > 0 && pid !== '0') {
                        console.log(`[Cleaner] Killing process ${pid} on port ${PORT}...`);
                        try {
                            execSync(`taskkill /F /PID ${pid}`);
                            console.log(`[Cleaner] Process ${pid} killed.`);
                        } catch (killError) {
                            console.log(`[Cleaner] Could not kill ${pid} (might already be dead)`);
                        }
                    }
                }
                console.log('[Cleaner] Port cleared.');
            } else {
                console.log('[Cleaner] Port is free.');
            }
        } catch (error) {
            console.log('[Cleaner] Port is free (or check failed).');
        }
    } else {
        // Linux/Mac: lsof
        try {
            const pid = execSync(`lsof -t -i:${PORT}`).toString().trim();
            if (pid) {
                console.log(`[Cleaner] Killing process ${pid} on port ${PORT}...`);
                process.kill(pid, 'SIGKILL');
                console.log('[Cleaner] Port cleared.');
            }
        } catch (e) {
            // lsof returns error if no process found, which is fine
            console.log('[Cleaner] Port is free.');
        }
    }
} catch (error) {
    // Ignore errors if no process found or permission denied (usually means port is free)
    // console.log('[Cleaner] Check finished.');
}
