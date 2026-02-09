import type { SlashCommand } from "@vfxcopilot/shared";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = resolve(homedir(), ".vfxcopilot");
const CONFIG_FILE = resolve(CONFIG_DIR, "config.json");

interface VFXConfig {
  geminiApiKey?: string;
}

async function loadConfig(): Promise<VFXConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as VFXConfig;
  } catch {
    return {};
  }
}

async function saveConfig(config: VFXConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function createConfigCommand(): SlashCommand {
  return {
    name: "config",
    description: "View/edit configuration",
    usage: "/config [set-api-key <key>]",
    async handler(args: string) {
      const parts = args.trim().split(/\s+/);

      if (parts[0] === "set-api-key" && parts[1]) {
        const key = parts[1];
        const config = await loadConfig();
        config.geminiApiKey = key;
        await saveConfig(config);
        // Also set for current session
        process.env["GEMINI_API_KEY"] = key;
        console.log("  API key saved. Gemini generation is now active.");
        return;
      }

      // Show current config
      const config = await loadConfig();
      const envKey = process.env["GEMINI_API_KEY"];
      const hasKey = !!(config.geminiApiKey || envKey);

      console.log();
      console.log("  Configuration:");
      console.log(`    Gemini API key: ${hasKey ? "***configured***" : "NOT SET"}`);
      console.log(`    Backend URL:    http://127.0.0.1:3000`);
      console.log(`    WS Port:        3001`);
      console.log();
      if (!hasKey) {
        console.log("  Set your Gemini API key:");
        console.log("    /config set-api-key <your-key>");
        console.log("  Or set GEMINI_API_KEY environment variable.");
        console.log();
      }
    },
  };
}
