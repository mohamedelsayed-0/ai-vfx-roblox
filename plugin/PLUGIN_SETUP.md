# VFX Copilot — Roblox Studio Plugin Setup

## 1. Enable HTTP Requests

The plugin needs to talk to the local backend server on `127.0.0.1:3000`.

1. Open Roblox Studio
2. Go to **Home** > **Game Settings** > **Security**
3. Turn ON **Allow HTTP Requests**
4. Click **Save**

## 2. Install the Plugin

### Option A: Local Plugins Folder (Recommended)

1. In Roblox Studio, go to **Plugins** tab > **Plugins Folder** (this opens your local plugins directory)
2. Create a new folder called `VFXCopilot` inside the plugins folder
3. Copy these files from `plugin/src/` into the `VFXCopilot` folder:
   - `init.server.lua`
   - `PatchApply.lua`
   - `HttpClient.lua`
   - `Config.lua`
4. Restart Roblox Studio — the plugin will auto-load

### Option B: Manual Script in Studio

1. In Roblox Studio, open the **Explorer** panel
2. Right-click **ServerStorage** > **Insert Object** > **Folder** (name it `VFXCopilot`)
3. Inside the folder, create 4 **ModuleScript** objects:
   - `PatchApply` — paste contents of `plugin/src/PatchApply.lua`
   - `HttpClient` — paste contents of `plugin/src/HttpClient.lua`
   - `Config` — paste contents of `plugin/src/Config.lua`
4. Create a **Script** (not ModuleScript) named `init` — paste contents of `plugin/src/init.server.lua`
5. In the Script properties, set **RunContext** to **Plugin**

## 3. Verify Connection

1. Start the VFX Copilot CLI:
   ```bash
   npx tsx packages/cli/bin/vfxcopilot.ts
   ```
2. In Roblox Studio, click the **VFX Copilot** button in the toolbar
3. The plugin panel should show a green **Connected** status
4. Try generating from the CLI or UI — the plugin will auto-apply when you run `/apply`

## Troubleshooting

- **"Disconnected" status**: Make sure the CLI is running (`npx tsx packages/cli/bin/vfxcopilot.ts`)
- **HTTP errors**: Verify HTTP Requests are enabled in Game Settings > Security
- **Plugin not appearing**: Restart Studio after placing files in the plugins folder
- **Auto-apply not working**: The plugin polls every 2 seconds. Run `/apply` in the CLI or UI, and the effect should appear in Studio within a few seconds
