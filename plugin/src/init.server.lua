-- VFX Copilot Plugin for Roblox Studio
-- Entry point: creates toolbar button and DockWidget UI

local toolbar = plugin:CreateToolbar("VFX Copilot")
local toggleButton = toolbar:CreateButton(
	"VFX Copilot",
	"Open VFX Copilot panel",
	"rbxassetid://0" -- placeholder icon
)

-- Create DockWidget
local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Right,
	false, -- initially hidden
	false, -- override previous state
	400,   -- default width
	600,   -- default height
	300,   -- min width
	400    -- min height
)

local widget = plugin:CreateDockWidgetPluginGui("VFXCopilotWidget", widgetInfo)
widget.Title = "VFX Copilot"

-- Modules
local HttpClient = require(script.HttpClient)
local PatchApply = require(script.PatchApply)
local Config = require(script.Config)

-- UI Setup
local screenGui = Instance.new("Frame")
screenGui.Size = UDim2.new(1, 0, 1, 0)
screenGui.BackgroundColor3 = Color3.fromRGB(26, 26, 46)
screenGui.BorderSizePixel = 0
screenGui.Parent = widget

-- Status label
local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, -16, 0, 30)
statusLabel.Position = UDim2.new(0, 8, 0, 8)
statusLabel.BackgroundTransparency = 1
statusLabel.TextColor3 = Color3.fromRGB(224, 224, 224)
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.TextSize = 14
statusLabel.Font = Enum.Font.SourceSansSemibold
statusLabel.Text = "Disconnected"
statusLabel.Parent = screenGui

-- Prompt input
local promptBox = Instance.new("TextBox")
promptBox.Size = UDim2.new(1, -16, 0, 60)
promptBox.Position = UDim2.new(0, 8, 0, 46)
promptBox.BackgroundColor3 = Color3.fromRGB(22, 33, 62)
promptBox.TextColor3 = Color3.fromRGB(224, 224, 224)
promptBox.PlaceholderText = "Describe your VFX effect..."
promptBox.PlaceholderColor3 = Color3.fromRGB(110, 110, 142)
promptBox.TextSize = 14
promptBox.Font = Enum.Font.SourceSans
promptBox.TextWrapped = true
promptBox.TextXAlignment = Enum.TextXAlignment.Left
promptBox.TextYAlignment = Enum.TextYAlignment.Top
promptBox.ClearTextOnFocus = false
promptBox.Parent = screenGui

-- Generate button
local generateBtn = Instance.new("TextButton")
generateBtn.Size = UDim2.new(0.48, 0, 0, 32)
generateBtn.Position = UDim2.new(0, 8, 0, 114)
generateBtn.BackgroundColor3 = Color3.fromRGB(233, 69, 96)
generateBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
generateBtn.Text = "Generate"
generateBtn.TextSize = 14
generateBtn.Font = Enum.Font.SourceSansBold
generateBtn.Parent = screenGui

-- Apply button
local applyBtn = Instance.new("TextButton")
applyBtn.Size = UDim2.new(0.48, 0, 0, 32)
applyBtn.Position = UDim2.new(0.52, 0, 0, 114)
applyBtn.BackgroundColor3 = Color3.fromRGB(46, 204, 113)
applyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
applyBtn.Text = "Apply"
applyBtn.TextSize = 14
applyBtn.Font = Enum.Font.SourceSansBold
applyBtn.Parent = screenGui

-- Revert button
local revertBtn = Instance.new("TextButton")
revertBtn.Size = UDim2.new(1, -16, 0, 28)
revertBtn.Position = UDim2.new(0, 8, 0, 154)
revertBtn.BackgroundColor3 = Color3.fromRGB(44, 62, 80)
revertBtn.TextColor3 = Color3.fromRGB(224, 224, 224)
revertBtn.Text = "Revert Last"
revertBtn.TextSize = 13
revertBtn.Font = Enum.Font.SourceSans
revertBtn.Parent = screenGui

-- Output / Summary area
local outputLabel = Instance.new("TextLabel")
outputLabel.Size = UDim2.new(1, -16, 1, -200)
outputLabel.Position = UDim2.new(0, 8, 0, 190)
outputLabel.BackgroundColor3 = Color3.fromRGB(22, 33, 62)
outputLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
outputLabel.TextSize = 13
outputLabel.Font = Enum.Font.SourceSans
outputLabel.TextWrapped = true
outputLabel.TextXAlignment = Enum.TextXAlignment.Left
outputLabel.TextYAlignment = Enum.TextYAlignment.Top
outputLabel.Text = "VFX Copilot ready.\nType a prompt and click Generate."
outputLabel.Parent = screenGui

-- State
local currentPatch = nil
local checkpoints = {}
local isConnected = false
local httpEnabled = game:GetService("HttpService").HttpEnabled

-- Toggle widget visibility
toggleButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

-- HttpService check
if not httpEnabled then
	outputLabel.Text = "HTTP Requests are DISABLED.\n\nTo use VFX Copilot:\n1. Go to Game Settings > Security\n2. Enable 'Allow HTTP Requests'\n3. Restart the plugin"
	outputLabel.TextColor3 = Color3.fromRGB(231, 76, 60)
	statusLabel.Text = "HTTP Disabled"
	statusLabel.TextColor3 = Color3.fromRGB(231, 76, 60)
	generateBtn.Active = false
	generateBtn.BackgroundColor3 = Color3.fromRGB(100, 40, 50)
	applyBtn.Active = false
	applyBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 50)
end

-- Connection health poll
local function pollHealth()
	while true do
		local ok = HttpClient.healthCheck()
		isConnected = ok
		statusLabel.Text = ok and "Connected" or "Disconnected"
		statusLabel.TextColor3 = ok
			and Color3.fromRGB(46, 204, 113)
			or Color3.fromRGB(231, 76, 60)
		task.wait(Config.PollInterval)
	end
end

-- Generate handler
generateBtn.MouseButton1Click:Connect(function()
	local prompt = promptBox.Text
	if prompt == "" then
		outputLabel.Text = "Please enter a prompt."
		return
	end

	if not isConnected then
		outputLabel.Text = "Backend not connected.\nIs the CLI running?"
		return
	end

	outputLabel.Text = "Generating..."
	generateBtn.Text = "Generating..."
	generateBtn.Active = false
	applyBtn.Active = false

	local result, err = HttpClient.generate(prompt)

	generateBtn.Text = "Generate"
	generateBtn.Active = true
	applyBtn.Active = true

	if err then
		outputLabel.Text = "Error: " .. tostring(err)
		return
	end

	currentPatch = result.patch
	local lines = {
		"Effect: " .. (result.patch.effectName or "Unknown"),
		"Summary: " .. (result.summary or ""),
		"Operations: " .. #result.patch.operations,
		"",
	}
	if result.warnings and #result.warnings > 0 then
		table.insert(lines, "Warnings:")
		for _, w in ipairs(result.warnings) do
			table.insert(lines, "  - " .. w)
		end
	end
	table.insert(lines, "")
	table.insert(lines, "Click Apply to create in Studio.")
	outputLabel.Text = table.concat(lines, "\n")
end)

-- Helper: find the effect folder in ReplicatedStorage after applying a patch
local function findEffectFolder(patch)
	local effectName = patch.effectName
	local rootPath = patch.rootFolder or "ReplicatedStorage/VFXCopilot/Effects"
	local parts = string.split(rootPath .. "/" .. effectName, "/")
	local current = game
	for _, part in ipairs(parts) do
		local child = current:FindFirstChild(part)
		if not child then return nil end
		current = child
	end
	return current
end

-- Helper: clean existing effect folder to prevent duplicates
local function cleanExistingEffect(patch)
	local rootPath = patch.rootFolder or "ReplicatedStorage/VFXCopilot/Effects"
	local fullPath = rootPath .. "/" .. patch.effectName
	local parts = string.split(fullPath, "/")
	local current = game
	for _, part in ipairs(parts) do
		local child = current:FindFirstChild(part)
		if not child then return end
		current = child
	end
	for _, child in ipairs(current:GetChildren()) do
		child:Destroy()
	end
end

-- Helper: apply patch + spawn preview, returns checkpoint data
local function applyPatchWithPreview(patch)
	cleanExistingEffect(patch)
	local results = PatchApply.apply(patch)

	-- Spawn visible preview in Workspace
	local previewPart = nil
	if #results.errors == 0 then
		local effectFolder = findEffectFolder(patch)
		if effectFolder then
			previewPart = PatchApply.spawnPreview(effectFolder, patch.effectName or "effect")
		end
	end

	return {
		patch = patch,
		created = results.created,
		createdInstances = results.createdInstances,
		previewPart = previewPart,
	}, results
end

-- Helper: revert a checkpoint (destroy template + preview)
local function revertCheckpoint(cp)
	local count = 0
	for _, inst in ipairs(cp.created) do
		if inst and inst.Parent then
			inst:Destroy()
			count = count + 1
		end
	end
	if cp.previewPart then
		PatchApply.destroyPreview(cp.previewPart)
	end
	return count
end

-- Apply handler
applyBtn.MouseButton1Click:Connect(function()
	if not currentPatch then
		outputLabel.Text = "No patch to apply. Generate first."
		return
	end

	outputLabel.Text = "Applying patch..."
	generateBtn.Active = false
	applyBtn.Active = false
	local checkpoint, results = applyPatchWithPreview(currentPatch)
	table.insert(checkpoints, checkpoint)

	local lines = { "Applied: " .. currentPatch.effectName }
	if #results.errors > 0 then
		table.insert(lines, "Errors:")
		for _, e in ipairs(results.errors) do
			table.insert(lines, "  " .. e.op .. ": " .. e.error)
		end
	else
		table.insert(lines, "Created " .. #results.created .. " objects.")
		table.insert(lines, "Preview spawned in Workspace/VFXCopilot/Previews/")
	end
	table.insert(lines, "Checkpoint saved. Use Revert to undo.")
	outputLabel.Text = table.concat(lines, "\n")
	generateBtn.Active = true
	applyBtn.Active = true
end)

-- Revert handler
revertBtn.MouseButton1Click:Connect(function()
	if #checkpoints == 0 then
		outputLabel.Text = "No checkpoints to revert."
		return
	end

	local cp = table.remove(checkpoints)
	local count = revertCheckpoint(cp)
	outputLabel.Text = "Reverted: " .. cp.patch.effectName .. "\nRemoved " .. count .. " objects + preview."
	currentPatch = nil
end)

-- Auto-apply polling: checks backend for pending actions from CLI/UI
local function pollActions()
	while true do
		if isConnected then
			local action, err = HttpClient.getPendingAction()
			if action and action.action == "apply" and action.patch then
				outputLabel.Text = "Auto-applying from CLI..."
				local checkpoint, results = applyPatchWithPreview(action.patch)
				table.insert(checkpoints, checkpoint)
				currentPatch = action.patch

				local lines = { "Auto-applied: " .. (action.patch.effectName or "effect") }
				if #results.errors > 0 then
					table.insert(lines, "Errors:")
					for _, e in ipairs(results.errors) do
						table.insert(lines, "  " .. e.op .. ": " .. e.error)
					end
				else
					table.insert(lines, "Created " .. #results.created .. " objects.")
					table.insert(lines, "Preview spawned in Workspace/VFXCopilot/Previews/")
				end
				outputLabel.Text = table.concat(lines, "\n")
				HttpClient.confirmAction()

			elseif action and action.action == "revert" then
				if #checkpoints > 0 then
					local cp = table.remove(checkpoints)
					local count = revertCheckpoint(cp)
					outputLabel.Text = "Auto-reverted from CLI.\nRemoved " .. count .. " objects + preview."
					currentPatch = nil
				end
				HttpClient.confirmAction()
			end
		end
		task.wait(2)
	end
end

-- Start health polling and action polling
task.spawn(pollHealth)
task.spawn(pollActions)
