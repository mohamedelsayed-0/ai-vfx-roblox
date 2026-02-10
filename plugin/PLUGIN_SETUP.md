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
