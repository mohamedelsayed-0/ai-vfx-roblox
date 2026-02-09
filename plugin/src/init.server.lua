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

-- Toggle widget visibility
toggleButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

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

	local result, err = HttpClient.generate(prompt)

	generateBtn.Text = "Generate"

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

-- Apply handler
applyBtn.MouseButton1Click:Connect(function()
	if not currentPatch then
		outputLabel.Text = "No patch to apply. Generate first."
		return
	end

	outputLabel.Text = "Applying patch..."
	local results = PatchApply.apply(currentPatch)

	-- Create checkpoint
	table.insert(checkpoints, {
		patch = currentPatch,
		created = results.created,
		createdInstances = results.createdInstances,
	})

	local lines = { "Applied: " .. currentPatch.effectName }
	if #results.errors > 0 then
		table.insert(lines, "Errors:")
		for _, e in ipairs(results.errors) do
			table.insert(lines, "  " .. e.op .. ": " .. e.error)
		end
	else
		table.insert(lines, "Created " .. #results.created .. " objects.")
	end
	table.insert(lines, "Checkpoint saved. Use Revert to undo.")
	outputLabel.Text = table.concat(lines, "\n")
end)

-- Revert handler
revertBtn.MouseButton1Click:Connect(function()
	if #checkpoints == 0 then
		outputLabel.Text = "No checkpoints to revert."
		return
	end

	local cp = table.remove(checkpoints)
	local count = 0
	for _, inst in ipairs(cp.created) do
		if inst and inst.Parent then
			inst:Destroy()
			count = count + 1
		end
	end
	outputLabel.Text = "Reverted: " .. cp.patch.effectName .. "\nRemoved " .. count .. " objects."
	currentPatch = nil
end)

-- Start health polling
task.spawn(pollHealth)
