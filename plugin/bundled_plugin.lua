-- VFX Copilot — BUNDLED PLUGIN v2.0
-- Paste this into a Script in ServerStorage, set RunContext to Plugin.
-- Includes: Config, HttpClient, PatchApply (with preview system), DockWidget UI

local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

--------------------------------------------------------------------------------
-- CONFIG
--------------------------------------------------------------------------------
local Config = {
	BackendUrl = "http://127.0.0.1:3000",
	PollInterval = 5,
	ActionPollInterval = 2,
}

--------------------------------------------------------------------------------
-- HTTP CLIENT
--------------------------------------------------------------------------------
local HttpClient = {}

function HttpClient.healthCheck()
	local success, result = pcall(function()
		return HttpService:RequestAsync({
			Url = Config.BackendUrl .. "/health",
			Method = "GET",
			Headers = { ["Content-Type"] = "application/json" },
		})
	end)
	return success and result.StatusCode == 200
end

function HttpClient.generate(prompt, context)
	context = context or { selectedObjects = {}, existingEffects = {} }
	local body = HttpService:JSONEncode({
		prompt = prompt,
		context = context,
	})

	local success, result = pcall(function()
		return HttpService:RequestAsync({
			Url = Config.BackendUrl .. "/generate",
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = body,
		})
	end)

	if not success then
		return nil, "Network error: " .. tostring(result)
	end
	if result.StatusCode ~= 200 then
		return nil, "Server error: " .. result.StatusCode
	end
	return HttpService:JSONDecode(result.Body), nil
end

function HttpClient.getPendingAction()
	local success, result = pcall(function()
		return HttpService:RequestAsync({
			Url = Config.BackendUrl .. "/pending-action",
			Method = "GET",
			Headers = { ["Content-Type"] = "application/json" },
		})
	end)
	if success and result.StatusCode == 200 then
		local decoded = HttpService:JSONDecode(result.Body)
		return decoded, nil
	end
	return nil, "Failed to get pending action"
end

function HttpClient.confirmAction()
	pcall(function()
		HttpService:RequestAsync({
			Url = Config.BackendUrl .. "/confirm-action",
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode({ ok = true }),
		})
	end)
end

--------------------------------------------------------------------------------
-- PATCH APPLY ENGINE
--------------------------------------------------------------------------------
local PatchApply = {}
local createdInstances = {}

-- Resolve path using GetService for the first segment (handles ReplicatedStorage, Workspace, etc.)
local function resolveOrEnsure(path, ensure)
	local parts = string.split(path, "/")
	local current = game
	for i, part in ipairs(parts) do
		local child
		if i == 1 then
			local ok, service = pcall(function() return game:GetService(part) end)
			child = ok and service or current:FindFirstChild(part)
		else
			child = current:FindFirstChild(part)
		end

		if not child and ensure then
			child = Instance.new("Folder")
			child.Name = part
			child.Parent = current
		elseif not child then
			return nil
		end
		current = child
	end
	return current
end

-- Resolve a property value, handling $ref, $type, $enum
local function resolveValue(value)
	if type(value) ~= "table" then return value end

	if value["$ref"] then
		local ref = createdInstances[value["$ref"]]
		if not ref then
			warn("[VFX Copilot] $ref not found: " .. value["$ref"])
			return nil
		end
		return ref
	end

	if value["$enum"] then
		local parts = string.split(value["$enum"], ".")
		local current = Enum
		for i = 2, #parts do
			current = current[parts[i]]
		end
		return current
	end

	local typeName = value["$type"]
	if typeName == "Color3" then
		return Color3.new(value.r, value.g, value.b)
	elseif typeName == "Vector3" then
		return Vector3.new(value.x, value.y, value.z)
	elseif typeName == "Vector2" then
		return Vector2.new(value.x, value.y)
	elseif typeName == "NumberRange" then
		return NumberRange.new(value.min, value.max)
	elseif typeName == "ColorSequence" then
		local kps = {}
		for _, k in ipairs(value.keypoints) do
			table.insert(kps, ColorSequenceKeypoint.new(k.time, Color3.new(k.color.r, k.color.g, k.color.b)))
		end
		return ColorSequence.new(kps)
	elseif typeName == "NumberSequence" then
		local kps = {}
		for _, k in ipairs(value.keypoints) do
			table.insert(kps, NumberSequenceKeypoint.new(k.time, k.value))
		end
		return NumberSequence.new(kps)
	end

	return value
end

-- VFX class check
local VFX_CLASSES = {
	"ParticleEmitter", "Trail", "Beam", "Attachment",
	"PointLight", "SpotLight", "SurfaceLight", "Sound",
}

local function isVFXClass(instance)
	for _, className in ipairs(VFX_CLASSES) do
		if instance:IsA(className) then
			return true
		end
	end
	return false
end

-- Apply a full patch
function PatchApply.apply(patch)
	createdInstances = {}
	local results = { created = {}, errors = {}, warnings = {} }

	local recording = ChangeHistoryService:TryBeginRecording("VFXCopilot: " .. (patch.effectName or "effect"))

	for _, op in ipairs(patch.operations) do
		local success, err = pcall(function()
			if op.op == "ensureFolder" then
				resolveOrEnsure(op.path, true)
			elseif op.op == "createInstance" then
				local parent = resolveOrEnsure(op.parentPath, true)
				local inst = Instance.new(op.className)
				inst.Name = op.name
				for prop, val in pairs(op.properties) do
					local resolved = resolveValue(val)
					if resolved ~= nil then
						pcall(function()
							inst[prop] = resolved
						end)
					end
				end
				inst.Parent = parent
				createdInstances[op.id] = inst
				table.insert(results.created, inst)
			elseif op.op == "createScript" then
				local pathParts = string.split(op.path, "/")
				local scriptName = pathParts[#pathParts]
				local parentPath = table.concat(pathParts, "/", 1, #pathParts - 1)
				local parent = resolveOrEnsure(parentPath, true)
				local s = Instance.new(op.scriptType or "ModuleScript")
				s.Name = scriptName
				s.Source = op.source
				s.Parent = parent
				table.insert(results.created, s)
			elseif op.op == "setProperty" then
				local target = resolveOrEnsure(op.targetPath, false)
				if target then
					local resolved = resolveValue(op.value)
					target[op.property] = resolved
				end
			elseif op.op == "deleteInstance" then
				local target = resolveOrEnsure(op.path, false)
				if target then target:Destroy() end
			elseif op.op == "moveInstance" then
				local source = resolveOrEnsure(op.fromPath, false)
				local dest = resolveOrEnsure(op.toPath, true)
				if source and dest then source.Parent = dest end
			end
		end)

		if not success then
			table.insert(results.errors, { op = op.op, error = tostring(err) })
			if op.op == "createInstance" or op.op == "createScript" then
				break
			end
		end
	end

	if recording then
		if #results.errors > 0 then
			ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Cancel)
		else
			ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
		end
	end

	results.createdInstances = createdInstances
	return results
end

-- Spawn visible preview in Workspace so the user sees the effect
function PatchApply.spawnPreview(effectFolder, effectName)
	local wpVFX = game.Workspace:FindFirstChild("VFXCopilot")
	if not wpVFX then
		wpVFX = Instance.new("Folder")
		wpVFX.Name = "VFXCopilot"
		wpVFX.Parent = game.Workspace
	end
	local previews = wpVFX:FindFirstChild("Previews")
	if not previews then
		previews = Instance.new("Folder")
		previews.Name = "Previews"
		previews.Parent = wpVFX
	end

	local existing = previews:FindFirstChild(effectName)
	if existing then existing:Destroy() end

	local previewPart = Instance.new("Part")
	previewPart.Name = effectName
	previewPart.Anchored = true
	previewPart.CanCollide = false
	previewPart.Transparency = 1
	previewPart.Size = Vector3.new(1, 1, 1)

	local camera = game.Workspace.CurrentCamera
	if camera then
		previewPart.CFrame = camera.CFrame * CFrame.new(0, 0, -10)
	else
		previewPart.Position = Vector3.new(0, 5, 0)
	end

	previewPart.Parent = previews

	local clone = effectFolder:Clone()

	-- Check if any trails exist (need Part motion to render)
	local hasTrails = false
	for _, child in ipairs(clone:GetChildren()) do
		if child:IsA("Trail") then
			hasTrails = true
		end
		if isVFXClass(child) then
			child.Parent = previewPart
		end
	end
	clone:Destroy()

	-- Trail preview motion: oscillate the Part so trails actually render
	if hasTrails then
		local tweenInfo = TweenInfo.new(0.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
		local tween = TweenService:Create(previewPart, tweenInfo, {
			CFrame = previewPart.CFrame * CFrame.new(2, 0, 0)
		})
		tween:Play()
	end

	-- Auto-trigger burst emitters (Rate = 0) and replay infinitely
	local burstEmitters = {}
	for _, child in ipairs(previewPart:GetChildren()) do
		if child:IsA("ParticleEmitter") and child.Rate == 0 then
			table.insert(burstEmitters, child)
		end
	end

	if #burstEmitters > 0 then
		for _, emitter in ipairs(burstEmitters) do
			emitter:Emit(25)
		end
		task.spawn(function()
			while previewPart and previewPart.Parent do
				task.wait(2)
				for _, emitter in ipairs(burstEmitters) do
					if emitter and emitter.Parent then
						emitter:Emit(25)
					end
				end
			end
		end)
	end

	-- Auto-focus camera on the preview
	local cam = game.Workspace.CurrentCamera
	if cam then
		cam.CFrame = CFrame.new(previewPart.Position + Vector3.new(5, 3, 5), previewPart.Position)
	end

	return previewPart
end

-- Destroy a preview (tween stops automatically when Part is destroyed)
function PatchApply.destroyPreview(previewPart)
	if previewPart and previewPart.Parent then
		previewPart:Destroy()
	end
end

--------------------------------------------------------------------------------
-- UI: DOCK WIDGET
--------------------------------------------------------------------------------
local toolbar = plugin:CreateToolbar("VFX Copilot")
local toggleButton = toolbar:CreateButton(
	"VFX Copilot",
	"Open VFX Copilot panel",
	"rbxassetid://0"
)

local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Right,
	false, false,
	400, 600, 300, 400
)

local widget = plugin:CreateDockWidgetPluginGui("VFXCopilotWidget", widgetInfo)
widget.Title = "VFX Copilot"

-- Main frame
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

--------------------------------------------------------------------------------
-- STATE
--------------------------------------------------------------------------------
local currentPatch = nil
local checkpoints = {}
local isConnected = false
local httpEnabled = HttpService.HttpEnabled

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

--------------------------------------------------------------------------------
-- HELPERS
--------------------------------------------------------------------------------

local function findEffectFolder(patch)
	local effectName = patch.effectName
	local rootPath = patch.rootFolder or "ReplicatedStorage/VFXCopilot/Effects"
	local fullPath = rootPath .. "/" .. effectName
	return resolveOrEnsure(fullPath, false)
end

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
	-- Clear existing children in the effect folder
	for _, child in ipairs(current:GetChildren()) do
		child:Destroy()
	end
end

local function applyPatchWithPreview(patch)
	cleanExistingEffect(patch)
	local results = PatchApply.apply(patch)

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

--------------------------------------------------------------------------------
-- HANDLERS
--------------------------------------------------------------------------------

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

--------------------------------------------------------------------------------
-- POLLING
--------------------------------------------------------------------------------

-- Health polling
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

-- Action polling: checks backend for pending actions from CLI
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
		task.wait(Config.ActionPollInterval)
	end
end

-- Start polling loops
print("[VFX Copilot] Plugin active. Version 2.0")
task.spawn(pollHealth)
task.spawn(pollActions)
