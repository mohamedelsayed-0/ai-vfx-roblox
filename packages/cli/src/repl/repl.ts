import * as readline from "node:readline/promises";
import type { CommandRegistry } from "../commands/registry.js";

export async function startRepl(registry: CommandRegistry): Promise<readline.Interface> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (line: string) => {
      const hits = registry.completions(line);
      return [hits.length ? hits : registry.completions("/"), line];
    },
  });

  const runLoop = async () => {
    while (true) {
      let line: string;
      try {
        line = await rl.question("vfx> ");
      } catch {
        // readline closed (Ctrl+C / Ctrl+D)
        break;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      if (!trimmed.startsWith("/")) {
        console.log('Commands start with /. Type /help for available commands.');
        continue;
      }

      const [cmdName, ...rest] = trimmed.slice(1).split(/\s+/);
      const cmd = registry.get(cmdName!);
      if (!cmd) {
        console.log(`Unknown command: /${cmdName}. Type /help for available commands.`);
        continue;
      }

      try {
        await cmd.handler(rest.join(" "));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
      }
    }
  };

  runLoop();
  return rl;
}
