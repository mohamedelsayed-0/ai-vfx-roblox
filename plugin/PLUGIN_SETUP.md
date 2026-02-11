# VFX Copilot — Roblox Studio Plugin Setup

## 1. Enable HTTP Requests (REQUIRED)

The plugin needs to talk to the local backend server on `127.0.0.1:3000`.

1. Open Roblox Studio
2. Go to **Home** > **Game Settings** > **Security**
3. Turn ON **Allow HTTP Requests**
4. Click **Save**

> **Note:** If HTTP Requests are disabled, the plugin will show a red error message explaining how to fix it. No VFX generation is possible without this setting enabled.

## 2. Install the Plugin

### Option A: Bundled Script (Easiest)

1. In Roblox Studio, open the **Explorer** panel.
2. Right-click **ServerStorage** > **Insert Object** > **Script**.
3. Name the script `VFXCopilot`.
4. Paste the entire contents of `plugin/bundled_plugin.lua` into this script.
5. In the Properties window for the script, set **RunContext** to **Plugin**.

### Option B: Local Plugins Folder

1. In Roblox Studio, go to **Plugins** tab > **Plugins Folder**.
2. Create a folder called `VFXCopilot`.
3. Copy `plugin/bundled_plugin.lua` into that folder and rename it to `init.server.lua`.
4. Restart Studio.

## 3. Start the Backend & Verify Connection

1. Make sure you have a Gemini API key set:
   ```bash
   export GEMINI_API_KEY=your-key-here
   ```
2. Start the VFX Copilot CLI:
   ```bash
   npm run dev
   ```
3. In Roblox Studio, click the **VFX Copilot** button in the toolbar
4. The plugin panel should show a green **Connected** status
5. Try generating from the CLI or UI — the plugin will auto-apply when you run `/apply`

> **No API key?** The backend falls back to a stub patch (SwordSlashTrail) so you can still test the pipeline.

## 4. How Effects Appear

When you apply an effect:

- **Template** is saved to `ReplicatedStorage/VFXCopilot/Effects/<EffectName>/` (for reuse via `EffectController`)
- **Live preview** is auto-spawned on a transparent Part at `Workspace/VFXCopilot/Previews/<EffectName>_Preview`
- **Camera auto-focuses** on the preview so you see the effect immediately
- Burst effects (explosions, impacts) **auto-replay every 2 seconds** so you can see them
- Trails **auto-oscillate** (the preview Part moves back and forth to make trails visible)
- Continuous effects (sparks, smoke) emit immediately
- **Ctrl+Z works** — plugin actions are recorded in Studio's undo history

When you **Revert**, both the template and the Workspace preview are removed.

> **Re-generating the same effect?** The plugin automatically cleans up the existing effect folder before applying the new version — no duplicates.

## 5. Using Effects in Your Game

Each effect includes an `EffectController` ModuleScript. To use in a script:

```lua
local EffectController = require(game.ReplicatedStorage.VFXCopilot.Effects.MyEffect.EffectController)

-- Spawn effect on a part
local effect = EffectController.Create(workspace.SomePart)

-- Later, clean up
EffectController.Destroy(effect)
```

### Server vs Client

- **Server Script**: Effect replicates to all clients (visible to everyone)
- **LocalScript**: Effect is client-only (visible only to that player)
- **Burst effects** (Rate = 0): The EffectController calls `:Emit()` automatically on creation
- **Continuous effects** (Rate > 0): Emit as soon as they're parented to a BasePart

### Post-Processing Effects

Bloom, ColorCorrection, and other post-processing effects are created in `Lighting/`. These are global and affect the entire scene.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **"HTTP Disabled" red message** | Enable HTTP Requests in Game Settings > Security, then restart the plugin |
| **"Disconnected" status** | Make sure the CLI backend is running (`npm run dev`) |
| **Buttons greyed out** | Either HTTP is disabled, or a Generate/Apply operation is in progress — wait for it to complete |
| **Plugin not appearing** | Verify RunContext is set to **Plugin**, or restart Studio after placing files in the plugins folder |
| **Effects not visible** | Camera should auto-focus on the preview. If not, check `Workspace/VFXCopilot/Previews/` in Explorer |
| **Duplicate effects** | This is now handled automatically — re-applying cleans the old effect first |
| **Auto-apply not working** | Plugin polls every 2 seconds. Run `/apply` in the CLI and wait a moment |
| **"AI returned invalid format"** | Try rephrasing your prompt, or use `/presets` for a built-in effect |
| **Ctrl+Z not working** | Make sure you're using the latest plugin version (v2.1+) with ChangeHistoryService support |
