import { WebSocketServer, WebSocket } from "ws";
import type { ServerMessage, ClientMessage } from "@vfxcopilot/shared";

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();
let commandHandler: ((command: string) => void) | null = null;

export function onCommand(handler: (command: string) => void): void {
  commandHandler = handler;
}

export function startWsServer(port: number = 3001): WebSocketServer {
  wss = new WebSocketServer({ port });
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(String(data)) as ClientMessage;
        if (msg.type === "command" && commandHandler) {
          commandHandler(msg.command);
        }
      } catch { /* ignore malformed messages */ }
    });
  });
  return wss;
}

export function broadcast(message: ServerMessage): void {
  const data = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

export function stopWsServer(): void {
  for (const ws of clients) ws.close();
  clients.clear();
  wss?.close();
  wss = null;
}
