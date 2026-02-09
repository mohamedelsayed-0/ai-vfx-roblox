export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string) => Promise<void>;
}
