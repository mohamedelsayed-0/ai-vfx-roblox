# VFX Copilot — Roblox Studio Plugin Setup

## 1. Enable HTTP Requests

The plugin needs to talk to the local backend server on `127.0.0.1:3000`.

1. Open Roblox Studio
2. Go to **Home** > **Game Settings** > **Security**
3. Turn ON **Allow HTTP Requests**
4. Click **Save**

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

## 3. Verify Connection

1. Start the VFX Copilot CLI:
   ```bash
   npm run dev
   ```
2. In Roblox Studio, click the **VFX Copilot** button in the toolbar
3. The plugin panel should show a green **Connected** status
4. Try generating from the CLI or UI — the plugin will auto-apply when you run `/apply`

## 4. How Effects Appear

When you apply an effect:

- **Template** is saved to `ReplicatedStorage/VFXCopilot/Effects/<EffectName>/` (for reuse via `EffectController`)
- **Live preview** is auto-spawned on a transparent Part at `Workspace/VFXCopilot/Previews/<EffectName>_Preview`
- Burst effects (explosions, impacts) **auto-replay every 2 seconds** so you can see them
- Continuous effects (trails, sparks) emit immediately

When you **Revert**, both the template and the Workspace preview are removed.

## 5. Using Effects in Your Game

Each effect includes an `EffectController` ModuleScript. To use in a script:

```lua
local EffectController = require(game.ReplicatedStorage.VFXCopilot.Effects.MyEffect.EffectController)

-- Spawn effect on a part
local effect = EffectController.Create(workspace.SomePart)

-- Later, clean up
EffectController.Destroy(effect)
```

## Troubleshooting

- **"Disconnected" status**: Make sure the CLI is running (`npm run dev`)
- **HTTP errors**: Verify HTTP Requests are enabled in Game Settings > Security
- **Plugin not appearing**: Restart Studio after placing files in the plugins folder
- **Effects not visible**: Effects preview at camera position. Move camera to `Workspace/VFXCopilot/Previews/` to find them
- **Auto-apply not working**: The plugin polls every 2 seconds. Run `/apply` in the CLI or UI, and the effect should appear in Studio within a few seconds
