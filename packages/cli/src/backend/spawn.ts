import { fork, type ChildProcess } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

let backendProcess: ChildProcess | null = null;

export function spawnBackend(port: number = 3000): ChildProcess {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const serverEntry = resolve(__dirname, "../../../server/src/index.ts");

  backendProcess = fork(serverEntry, [], {
    execArgv: ["--import", "tsx"],
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  backendProcess.stdout?.on("data", (data: Buffer) => {
    // Suppress server logs in CLI terminal for clean UX
  });

  backendProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.error(`  [backend] ${msg}`);
  });

  backendProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`  [backend] exited with code ${code}`);
    }
    backendProcess = null;
  });

  return backendProcess;
}

export function killBackend(): void {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}
