const WS_URL = "ws://127.0.0.1:3001";

const statusIndicator = document.getElementById("status-indicator");
const statusText = document.getElementById("status-text");
const commandsList = document.getElementById("commands");
const patchArea = document.getElementById("patch-area");
const patchSummary = document.getElementById("patch-summary");
const palette = document.getElementById("command-palette");
const paletteInput = document.getElementById("palette-input");
const paletteResults = document.getElementById("palette-results");

let ws = null;
let reconnectTimer = null;
let allCommands = [];

function setStatus(state, message) {
  statusIndicator.className = `status-${state}`;
  statusText.textContent = message || state;
}

function renderCommands(commands) {
  allCommands = commands;
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
      setStatus(
        msg.status === "idle" ? "connected" : msg.status === "error" ? "disconnected" : "connecting",
        msg.status === "idle" ? "Connected" : msg.status === "generating" ? "Generating..." : msg.message || "Error"
      );
      break;
    case "commandList":
      renderCommands(msg.commands);
      break;
    case "patchGenerated":
      patchArea.classList.remove("hidden");
      patchSummary.innerHTML = `<strong>${msg.summary}</strong><br>Operations: ${msg.patch.operations.length}`;
      if (msg.warnings && msg.warnings.length) {
        patchSummary.innerHTML += `<br><span class="warning">Warnings: ${msg.warnings.join(", ")}</span>`;
      }
      break;
    case "patchApplied":
      patchSummary.innerHTML += `<br><span class="success">Applied (${msg.checkpointId})</span>`;
      break;
    case "patchReverted":
      patchArea.classList.add("hidden");
      break;
  }
}

// Command palette
function showPalette() {
  palette.classList.remove("hidden");
  paletteInput.value = "";
  paletteInput.focus();
  filterPalette("");
}

function hidePalette() {
  palette.classList.add("hidden");
}

function filterPalette(query) {
  const q = query.toLowerCase();
  const filtered = allCommands.filter(
    (c) => c.name.includes(q) || c.description.toLowerCase().includes(q)
  );
  paletteResults.innerHTML = "";
  for (const cmd of filtered) {
    const div = document.createElement("div");
    div.className = "palette-item";
    div.innerHTML = `<span class="cmd-name">${cmd.usage}</span><span class="cmd-desc">${cmd.description}</span>`;
    paletteResults.appendChild(div);
  }
}

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    palette.classList.contains("hidden") ? showPalette() : hidePalette();
  }
  if (e.key === "Escape") hidePalette();
});

if (paletteInput) {
  paletteInput.addEventListener("input", (e) => filterPalette(e.target.value));
}

function connect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  setStatus("connecting", "Connecting...");
  ws = new WebSocket(WS_URL);

  ws.onopen = () => setStatus("connected", "Connected");

  ws.onmessage = (event) => {
    try {
      handleMessage(JSON.parse(event.data));
    } catch { /* ignore */ }
  };

  ws.onclose = () => {
    setStatus("disconnected", "Disconnected");
    reconnectTimer = setTimeout(connect, 2000);
  };

  ws.onerror = () => ws.close();
}

// Default commands
renderCommands([
  { name: "help", usage: "/help", description: "Show available commands" },
  { name: "generate", usage: "/generate <prompt>", description: "Generate a VFX effect from description" },
  { name: "preview", usage: "/preview", description: "Preview the last generated patch" },
  { name: "apply", usage: "/apply", description: "Apply the current patch to Studio" },
  { name: "revert", usage: "/revert", description: "Undo the last applied patch" },
  { name: "presets", usage: "/presets", description: "List built-in effect presets" },
  { name: "config", usage: "/config", description: "View/edit configuration" },
  { name: "exit", usage: "/exit", description: "Shut down VFX Copilot" },
]);

connect();
