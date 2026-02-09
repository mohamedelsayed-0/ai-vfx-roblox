const WS_URL = "ws://127.0.0.1:3001";

const statusIndicator = document.getElementById("status-indicator");
const statusText = document.getElementById("status-text");
const commandsList = document.getElementById("commands");
const patchArea = document.getElementById("patch-area");
const patchSummary = document.getElementById("patch-summary");

let ws = null;
let reconnectTimer = null;

function setStatus(state, message) {
  statusIndicator.className = `status-${state}`;
  statusText.textContent = message || state;
}

function renderCommands(commands) {
  commandsList.innerHTML = "";
  for (const cmd of commands) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="cmd-name">${cmd.usage}</span><span class="cmd-desc">${cmd.description}</span>`;
    commandsList.appendChild(li);
  }
}

function handleMessage(msg) {
  switch (msg.type) {
    case "status":
      setStatus(msg.status === "idle" ? "connected" : msg.status === "error" ? "disconnected" : "connecting",
        msg.status === "idle" ? "Connected" : msg.status === "generating" ? "Generating..." : msg.message || "Error");
      break;
    case "commandList":
      renderCommands(msg.commands);
      break;
    case "patchGenerated":
      patchArea.classList.remove("hidden");
      patchSummary.textContent = msg.summary;
      break;
  }
}

function connect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  setStatus("connecting", "Connecting...");
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    setStatus("connected", "Connected");
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch { /* ignore malformed messages */ }
  };

  ws.onclose = () => {
    setStatus("disconnected", "Disconnected");
    reconnectTimer = setTimeout(connect, 2000);
  };

  ws.onerror = () => {
    ws.close();
  };
}

// Default commands shown before WS connects
renderCommands([
  { usage: "/help", description: "Show available commands" },
  { usage: "/generate <prompt>", description: "Generate a VFX effect from description" },
  { usage: "/preview", description: "Preview the last generated patch" },
  { usage: "/apply", description: "Apply the current patch to Studio" },
  { usage: "/revert", description: "Undo the last applied patch" },
  { usage: "/presets", description: "List built-in effect presets" },
  { usage: "/config", description: "View/edit configuration" },
  { usage: "/exit", description: "Shut down VFX Copilot" },
]);

connect();
