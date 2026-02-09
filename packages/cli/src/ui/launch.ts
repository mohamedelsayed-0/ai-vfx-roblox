import { spawn, type ChildProcess } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

let electronProcess: ChildProcess | null = null;

export function launchUI(): ChildProcess | null {
  try {
    const require = createRequire(import.meta.url);
    const electronPath = require("electron") as unknown as string;
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const mainScript = resolve(__dirname, "../../../ui/electron/main.js");

    electronProcess = spawn(electronPath, [mainScript], {
      stdio: "ignore",
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" },
    });

    electronProcess.on("exit", () => {
      electronProcess = null;
    });

    return electronProcess;
  } catch (err) {
    console.error("[UI] Failed to launch Electron:", err instanceof Error ? err.message : err);
    return null;
  }
}

export function killUI(): void {
  if (electronProcess) {
    electronProcess.kill();
    electronProcess = null;
  }
}
