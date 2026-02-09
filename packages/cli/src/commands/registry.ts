import type { SlashCommand } from "@vfxcopilot/shared";

export class CommandRegistry {
  private commands = new Map<string, SlashCommand>();

  register(cmd: SlashCommand): void {
    this.commands.set(cmd.name, cmd);
  }

  get(name: string): SlashCommand | undefined {
    return this.commands.get(name);
  }

  getAll(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  completions(partial: string): string[] {
    const prefix = partial.startsWith("/") ? partial : `/${partial}`;
    return this.getAll()
      .map((c) => `/${c.name}`)
      .filter((n) => n.startsWith(prefix));
  }
}
