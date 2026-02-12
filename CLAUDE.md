# CLAUDE.md — Roblox Studio VFX + Animation Copilot (Plugin + Node Backend + Gemini)

> Goal: Build a Roblox Studio plugin that acts like a "VFX + Animation Copilot" (Claude Code-style), using a Node.js backend that calls Gemini 2.5 Flash to generate VFX rigs (particles/beams/trails/lighting/camera shake) and basic animation helpers, with **previewable diffs**, **apply**, and **automatic undo checkpoints** after every apply.
> Non-goals (v1): full game generation, codebase-wide refactors, "cybersecurity", marketplace publishing automation.

---

## 0) Hard Requirements (must follow)
- **No silent edits**: All changes must be previewed as a structured "patch" before applying.
- **Every Apply creates an undo checkpoint**: users can revert to any previous checkpoint.
- **Deterministic patch format**: the AI must output JSON in a fixed schema (defined below). Never apply free-form code.
- **Scope-limited edits**: v1 only creates/edits inside a dedicated folder (e.g. `ReplicatedStorage/VFXCopilot/` or `Workspace/VFXCopilot/`) and only touches objects it created, unless user explicitly selects targets.
- **Security & safety**:
  - Do not execute arbitrary HTTP endpoints besides our backend.
  - Do not allow the model to request secrets from the user.
  - Do not auto-run scripts server-side; only generate assets/scripts in Studio.
- **Performance**:
  - Keep plugin UI responsive; network calls async; show progress.
  - Cache last response; allow "Retry" and "Cancel".
- **Commits are required**: do work in small phases; **commit after each phase** with clear messages.

---
## TERMINAL-FIRST REQUIREMENT (CRITICAL)

This project MUST run from the user's terminal as the primary entry point.

- The user launches the tool via a CLI command (e.g. `vfxcopilot`).
- When the CLI starts, it opens:
  1. A **terminal REPL** (for slash commands), AND
  2. A **desktop UI window** (floating panel) that mirrors and enhances the CLI experience.

This UI is NOT a web app the user manually opens.
It MUST automatically appear when the CLI is running.

The mental model is:
> "Claude Code, but for Roblox VFX — terminal-driven, with a live UI panel."

Failure to implement this correctly is a product failure.


## 1) Product Spec (v1)
### 1.1 Core user flow
1. User opens plugin panel in Roblox Studio.
2. User types a prompt: "Make a cyberpunk dash trail with sparks + glow" OR "Make a fireball impact burst with smoke"
3. Plugin sends request to Node backend.
4. Backend calls Gemini 2.5 Flash with strict instructions to return a **JSON patch**.
5. Plugin displays:
   - a tree of objects to be created/edited
   - scripts to be created/edited (with diff view)
   - a "summary" and any warnings
6. User clicks **Apply**.
7. Plugin applies the patch in Studio.
8. Plugin creates a **checkpoint** (stores state needed to revert).
9. User can **Revert** to any checkpoint.
10. User can **Export** effect as a reusable "pack" (optional v1.5).

### 1.2 VFX capabilities (v1)
- Generate in a folder structure:
  - `VFXCopilot/Effects/<EffectName>/...`
- Support:
  - ParticleEmitter presets (smoke, sparks, fire, dust)
  - Beam/Trail presets (dash, laser, slash)
  - Lighting + bloom presets (ColorCorrectionEffect, BloomEffect)
  - Sound stubs (Sound objects configured, no copyrighted audio)
  - Optional camera shake module (local-only)
- Provide a simple `EffectController` module to spawn effects.

### 1.3 Animation capabilities (v1)
Keep it small and robust:
- "Tween-based animation helpers" (not full keyframe animation)
- Generate helper modules:
  - `TweenRig.lua` for UI/parts tweens
  - simple "recoil", "dash", "impact" motion
- (Optional) Provide a "camera animation" helper using TweenService.

---

## 2) Architecture
### 2.1 Plugin (Roblox Lua)
- UI:
  - DockWidgetPluginGui panel
  - Prompt text area
  - Buttons: Generate / Preview / Apply / Revert / Copy JSON / Cancel
  - Patch preview tree + diff viewer
- State:
  - currentPatch
  - checkpoints list
  - createdInstanceIds map
- Patch apply engine:
  - create instances by class + set properties
  - set parent references by path or temporary IDs
  - create scripts/modules with exact content
  - handle moves/renames/deletes
- Checkpoint system:
  - simplest v1: store *before state* for any object touched (serialize properties + script source + hierarchy path)
  - and store list of created objects to delete on revert
  - allow revert to last checkpoint at minimum; ideally any checkpoint

### 2.2 Node backend (TypeScript or JS)
- Endpoints:
  - `POST /generate` -> returns patch JSON + summary
  - `POST /validate` (optional) -> validates patch schema
- Gemini integration:
  - prompt includes schema + constraints + examples
  - enforce JSON-only output
- Logging:
  - request id, latency, token use, errors
  - never log user secrets (there shouldn't be any)

2.3 Plugin ↔ Backend Communication Protocol

Backend runs on http://127.0.0.1:3000 (configurable via --port)
Plugin discovers backend via:

Reads from VFXCopilot.config.json in plugin folder (created by CLI on first run)
Config contains: {"backendUrl": "http://127.0.0.1:3000", "apiKey": "<redacted>"}


Plugin polls /health every 5 seconds to verify connection
Shows connection status in UI: 🟢 Connected | 🔴 Disconnected | 🟡 Connecting

Request format for /generate:
{
  "prompt": "Make a cyberpunk dash trail",
  "context": {
    "selectedObjects": [],
    "existingEffects": ["FireballImpact", "DustPuff"]
  }
}
Response format:
{
  "patch": { /* patch schema */ },
  "summary": "Creates a dash trail with...",
  "warnings": [],
  "estimatedObjects": 12
}

Error handling:

Network timeout (5s): Show "Backend unreachable. Is the CLI running?"
429 (rate limit): Show "API rate limit. Wait 60s or upgrade plan."
500 (server error): Show error message + "Copy to clipboard" button for bug report

2.4)
2.4 API Key Management

User provides Gemini API key via environment variable GEMINI_API_KEY or:

CLI command: /config set-api-key <key> (stores in encrypted local config)
UI settings panel: "API Key" text input (masked)
upon first time running

Backend NEVER logs the API key
Plugin NEVER has direct access to API key (backend-only)


---

## 3) Patch Schema (MUST be followed)
Claude: you must produce patches exactly like this.

```json
{
  "version": "1.0",
  "effectName": "CyberpunkDashTrail",
  "rootFolder": "ReplicatedStorage/VFXCopilot/Effects",
  "summary": "Creates a dash trail with neon beam + sparks + camera shake helper.",
  "warnings": ["Camera shake is client-only. Attach to LocalScript."],
  "operations": [
    {
      "op": "ensureFolder",
      "path": "ReplicatedStorage/VFXCopilot/Effects/CyberpunkDashTrail"
    },
    {
      "op": "createInstance",
      "id": "trailAttachment0",
      "className": "Attachment",
      "parentPath": "ReplicatedStorage/VFXCopilot/Effects/CyberpunkDashTrail",
      "name": "Attachment0",
      "properties": {}
    },
    {
      "op": "createInstance",
      "id": "trail",
      "className": "Trail",
      "parentPath": "ReplicatedStorage/VFXCopilot/Effects/CyberpunkDashTrail",
      "name": "DashTrail",
      "properties": {
        "Attachment0": {"$ref": "trailAttachment0"},
        "Attachment1": {"$ref": "trailAttachment1"},
        "Lifetime": 0.2,
        "MinLength": 0.1
      }
    },
    {
      "op": "createScript",
      "scriptType": "ModuleScript",
      "path": "ReplicatedStorage/VFXCopilot/Effects/CyberpunkDashTrail/EffectController",
      "source": "-- Lua module source here"
    }
  ]
}
3.1 Complete Operation Types
All supported operations)
All Supported operations:
type Operation =
  | { op: "ensureFolder", path: string }
  | { op: "createInstance", id: string, className: string, parentPath: string, name: string, properties: Record<string, any> }
  | { op: "createScript", scriptType: "Script"|"LocalScript"|"ModuleScript", path: string, source: string }
  | { op: "setProperty", targetPath: string, property: string, value: any }
  | { op: "deleteInstance", path: string }  // only for instances created by VFXCopilot
  | { op: "moveInstance", fromPath: string, toPath: string }
Property value types:

Primitives: number, string, boolean
Roblox types: {"$type": "Color3", "r": 1, "g": 0, "b": 0}
References: {"$ref": "trailAttachment0"} (refers to operation id)
Enums: {"$enum": "Enum.ParticleOrientation.VelocityPerpendicular"}

Example patch with all operation types:
{
  "version": "1.0",
  "effectName": "SwordSlashTrail",
  "rootFolder": "ReplicatedStorage/VFXCopilot/Effects",
  "summary": "Sword slash with trail + impact sparks",
  "warnings": [],
  "operations": [
    {
      "op": "ensureFolder",
      "path": "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail"
    },
    {
      "op": "createInstance",
      "id": "attachment0",
      "className": "Attachment",
      "parentPath": "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail",
      "name": "Attachment0",
      "properties": {
        "Position": {"$type": "Vector3", "x": 0, "y": 0, "z": -1}
      }
    },
    {
      "op": "createInstance",
      "id": "trail",
      "className": "Trail",
      "parentPath": "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail",
      "name": "SlashTrail",
      "properties": {
        "Attachment0": {"$ref": "attachment0"},
        "Attachment1": {"$ref": "attachment1"},
        "Color": {"$type": "ColorSequence", "keypoints": [
          {"time": 0, "color": {"r": 1, "g": 1, "b": 1}},
          {"time": 1, "color": {"r": 0.5, "g": 0.5, "b": 1}}
        ]},
        "Lifetime": 0.3,
        "Transparency": {"$type": "NumberSequence", "keypoints": [
          {"time": 0, "value": 0},
          {"time": 1, "value": 1}
        ]}
      }
    },
    {
      "op": "createScript",
      "scriptType": "ModuleScript",
      "path": "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail/EffectController",
      "source": "local module = {}\n\nfunction module.Create(parent)\n\tlocal effect = script.Parent:Clone()\n\teffect.Parent = parent\n\treturn effect\nend\n\nfunction module.Destroy(effect)\n\teffect:Destroy()\nend\n\nreturn module"
    }
  ]
}
```

---

### 3.2 Validation & Safety Rules

**Blocked Lua patterns** (reject patch if script source contains):
- `loadstring(` or `loadstring (`
- `getfenv(` or `setfenv(`
- `require(game:GetService("InsertService"))`
- `require(` followed by HTTP URL
- `:HttpGet(` or `:PostAsync(`
- `game:GetService("HttpService")`

**Path restrictions** (reject if violated):
- All paths must start with: `ReplicatedStorage/VFXCopilot/` or `Workspace/VFXCopilot/`
- No `..` in paths (directory traversal)
- Max depth: 8 folders
- Max 100 operations per patch

**Property validation:**
- Numbers: must be finite (no `Infinity`, `NaN`)
- Strings: max 10,000 characters
- `$ref` targets must exist in prior operations
- `className` must be valid Roblox class name

---

**Insert as new section after Phase 11:**

## 5) Error Handling Strategy

### 5.1 Gemini Generation Errors
- **Invalid JSON (first attempt):**
  - Retry once with correction prompt: "Your last response was invalid JSON. Please output ONLY the JSON patch schema with no markdown fences."
- **Invalid JSON (second attempt):**
  - Show error: "AI returned invalid format. Try rephrasing your prompt or use a preset."
  - Log full response for debugging
- **Empty/missing operations:**
  - Show: "AI couldn't generate a valid effect. Try being more specific."

### 5.2 Plugin Apply Errors
- **Instance creation fails:**
  - Halt apply immediately
  - Show: "Failed to create [className] at [path]: [error]"
  - Prompt: "Revert to last checkpoint?"
- **Property assignment fails:**
  - Log warning but continue
  - Add to warnings list: "Couldn't set [property] on [instance]"
- **Script syntax error:**
  - Block apply
  - Show: "Generated script has syntax errors. Please retry generation."

### 5.3 Network Errors
- **Backend unreachable:**
  - Show: "Can't reach backend. Is CLI running? Check http://127.0.0.1:3000/health"
  - Provide "Retry" button
- **Timeout (>30s):**
  - Cancel request
  - Show: "Generation timed out. Try a simpler prompt."

### 5.4 Rate Limiting
- **429 from Gemini:**
  - Show: "API rate limit reached. Wait 60s or check your quota at https://aistudio.google.com"
  - Disable "Generate" button for 60s with countdown

---

**Replace the last line of the document with:**

## 6) UI Startup Behavior

**When UI window first opens:**
1. Display connection status at top
2. Show **welcome screen** with:
   - "VFX Copilot — AI-powered effects for Roblox Studio"
   - "Type `/help` or select a command below"
3. **Auto-display command list:**
```
   Available Commands:
   /help              Show this help message
   /generate <prompt> Generate a VFX effect from description
   /preview           Preview the last generated patch
   /apply             Apply the current patch to Studio
   /revert            Undo the last applied patch
   /presets           List built-in effect presets
   /config            View/edit configuration
   /exit              Shut down VFX Copilot
   Show recent effects (if any):

"Recently Created: CyberpunkDashTrail, FireballImpact"



Terminal behavior:

On startup, print same command list
Then enter REPL mode: vfx>



## 4) Implementation Phases & Required Commits (STRICT)

Claude: You MUST follow these phases in order.
- Do NOT skip phases.
- Do NOT merge phases.
- After EACH phase, STOP and ask for confirmation OR instruct to commit.
- Every phase MUST end in a git commit with the exact message provided.

---

### Phase 1 — CLI Skeleton + Slash Command Registry
Tasks:
- Create a Node.js CLI tool (`vfxcopilot`).
- Implement a terminal REPL loop.
- Implement a **slash command registry system**:
  - command name
  - short description
  - usage string
  - handler function
- Implement required base commands:
  - `/help`
  - `/exit`
- `/help` must list ALL registered commands with descriptions.
- Typing `/` should show available commands (basic list is sufficient for v1).

Deliverables:
- CLI starts in terminal.
- `/help` works.
- `/exit` shuts down cleanly.

Commit:
- `feat(cli): terminal repl + slash command registry + help command`

---

### Phase 2 — UI Window Bootstrap (Auto-Launch)
Tasks:
- When CLI starts, automatically launch a desktop UI window.
- UI must be a floating panel (Electron, Tauri, or equivalent).
- UI connects to the running CLI process.
- CLI remains the **source of truth**.
- UI shows:
  - command list
  - current status (idle / generating / error)

Deliverables:
- Running CLI always opens the UI.
- Closing CLI closes UI.

Commit:
- `feat(ui): auto-launched desktop panel synced to cli`

---

### Phase 3 — Node Backend Skeleton + Patch Schema
Tasks:
- Create Node backend server.
- Add:
  - `/health` endpoint
  - `/generate` endpoint (stubbed response)
- Implement shared **patch schema** using Zod.
- `/generate` returns a hardcoded valid patch JSON.

Deliverables:
- Backend runs locally.
- CLI can call `/generate` and receive JSON.

Commit:
- `chore(server): backend scaffold + patch schema validation`

---

### Phase 4 — CLI → Backend → UI Flow
Tasks:
- Implement `/generate <prompt>` slash command.
- `/generate`:
  - sends prompt to backend
  - receives patch JSON
  - stores patch in CLI state
- UI updates in real time to display:
  - patch summary
  - raw JSON (temporary)

Deliverables:
- `/generate` works end-to-end.
- UI reflects generated patch.

Commit:
- `feat(flow): generate command wired to backend and ui`

---

### Phase 5 — Patch Preview + Safety Validation
Tasks:
- Implement patch validation in CLI:
  - schema validation
  - root-folder enforcement
- Reject patches that:
  - write outside allowed folders
  - contain unsafe Lua patterns
- UI shows:
  - operation list
  - warnings
- Add `/preview` command.

Deliverables:
- `/preview` shows patch safely.
- Unsafe patches are blocked.

Commit:
- `feat(patch): preview system + safety validation`

---

### Phase 6 — Roblox Plugin: Patch Apply Engine (Create-Only)
Tasks:
- Implement Roblox Studio plugin.
- Implement patch apply engine:
  - `ensureFolder`
  - `createInstance`
  - `createScript`
- Plugin receives patch from CLI/backend.
- Apply creates assets in:
  - `ReplicatedStorage/VFXCopilot/Effects/<EffectName>`

Deliverables:
- Patch creates visible VFX assets in Studio.

Commit:
- `feat(plugin): patch apply engine for create operations`

---

### Phase 7 — Undo Checkpoints + Revert
Tasks:
- Implement checkpoint system:
  - track created instances
  - store necessary revert data
- Implement `/apply` and `/revert` commands.
- `/apply`:
  - applies patch
  - creates checkpoint
- `/revert`:
  - reverts last checkpoint

Deliverables:
- Safe apply + revert loop works.

Commit:
- `feat(checkpoints): apply with undo checkpoint and revert`

---

### Phase 8 — Gemini Integration (Real Generation)
Tasks:
- Replace stubbed backend with Gemini 2.5 Flash.
- Enforce:
  - JSON-only output
  - strict patch schema
- Retry once on invalid output with correction prompt.

Deliverables:
- Real AI-generated VFX patches.

Commit:
- `feat(ai): gemini generation with strict patch enforcement`

---

### Phase 9 — VFX Quality Pass + Presets
Tasks:
- Add 3 built-in presets (non-AI):
  - Neon dash trail
  - Fireball impact
  - Dust landing puff
- Ensure every effect includes:
  - `EffectController` with `Create()` + `Destroy()`

Deliverables:
- High-quality baseline effects.
- AI can reference presets.

Commit:
- `feat(vfx): presets and standardized effect controller`

---

### Phase 10 — Animation Helpers (Tween-Based)
Tasks:
- Add tween-based animation helper modules.
- Allow `/generate` to optionally include animation helpers.
- UI toggle: "Include animation helpers".

Deliverables:
- Camera shake / dash / recoil helpers usable by effects.

Commit:
- `feat(animation): tween-based animation helper modules`

---

### Phase 11 — Command Palette + UX Polish
Tasks:
- Improve slash command discovery:
  - autocomplete
  - filtered list
- UI command palette:
  - shows command + description + usage
- Improve error messages and loading states.

Deliverables:
- Tool feels polished and discoverable.

Commit:
- `feat(ux): command palette and terminal/ui polish`

---

## End Condition (v1 Complete)
- Terminal-first workflow works.
- UI mirrors CLI state.
- Slash commands are discoverable.
- VFX generation + apply + revert is reliable.
- No edits occur outside allowed scope.

CRITICAL: Ask Questions First
Before starting implementation, Claude MUST ask:

"Do you have a Gemini API key ready?"
"What should the CLI command be named? (default: vfxcopilot)"
"Preferred UI framework: Electron, Tauri, or other?"
"Should I create a monorepo structure or separate repos?"
"Any specific Roblox Studio API version requirements?"
"Do you want TypeScript (recommended) or JavaScript?"

Only proceed after receiving answers.


# ASK ANY QUESTIONS BEFORE YOU START CODING

IMPLEMENTED