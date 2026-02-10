import type { CommandRegistry } from "../commands/registry.js";

const COMMAND_HINTS: Record<string, string[]> = {
  generate: ["<prompt>", "--with-animations"],
  presets: ["apply", "neon-dash-trail", "fireball-impact", "dust-landing-puff"],
  config: ["set-api-key"],
};

export function createCompleter(registry: CommandRegistry) {
  return (line: string): [string[], string] => {
    const trimmed = line.trim();

    // Complete command names
    if (!trimmed || (trimmed.startsWith("/") && !trimmed.includes(" "))) {
      const hits = registry.completions(trimmed || "/");
      return [hits.length ? hits : registry.completions("/"), trimmed];
    }

    // Complete arguments for known commands
    if (trimmed.startsWith("/") && trimmed.includes(" ")) {
      const spaceIdx = trimmed.indexOf(" ");
      const cmdName = trimmed.slice(1, spaceIdx);
      const argPart = trimmed.slice(spaceIdx + 1);
      const hints = COMMAND_HINTS[cmdName];

      if (hints) {
        const matches = hints
          .filter((h) => h.startsWith(argPart))
          .map((h) => `/${cmdName} ${h}`);
        return [matches.length ? matches : [], line];
      }
    }

    return [[], line];
  };
}
