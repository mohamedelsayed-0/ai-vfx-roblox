import { WebSocketServer, WebSocket } from "ws";
import type { ServerMessage } from "@vfxcopilot/shared";

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function startWsServer(port: number = 3001): WebSocketServer {
  wss = new WebSocketServer({ port });
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
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
