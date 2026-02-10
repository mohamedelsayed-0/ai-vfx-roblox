-- VFX Copilot — AI-powered effects for Roblox Studio
-- BUNDLED PLUGIN SCRIPT
-- Paste this into a Script in ServerStorage, then set RunContext to Plugin.
-- Or save it as a .lua file in your local Plugins folder.

local HttpService = game:GetService("HttpService")

--------------------------------------------------------------------------------
-- CONFIGURATION
--------------------------------------------------------------------------------
local Config = {
	BackendUrl = "http://127.0.0.1:3000",
	PollInterval = 2, -- Polling interval for pending actions
	RequestTimeout = 30,
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
	if success and result.StatusCode == 200 then
		return true, HttpService:JSONDecode(result.Body)
	end
	return false, nil
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

	local decoded = HttpService:JSONDecode(result.Body)
	return decoded, nil
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
		if decoded and decoded.action ~= "none" then
			return decoded, nil
		end
		return nil, nil
	end
	return nil, "Failed to poll"
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
local createdInstancesRegistry = {}

local function resolvePath(path)
	local parts = string.split(path, "/")
	local current = game
	for _, part in ipairs(parts) do
		local child = current:FindFirstChild(part)
		if not child then
			return nil, "Path not found: " .. path .. " (missing: " .. part .. ")"
		end
		current = child
	end
	return current, nil
end

local function resolveValue(value)
	if type(value) ~= "table" then
		return value
	end

	if value["$ref"] then
		local ref = createdInstancesRegistry[value["$ref"]]
		if not ref then
			warn("[VFXCopilot] $ref not found: " .. value["$ref"])
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
	elseif typeName == "ColorSequence" then
		local keypoints = {}
		for _, kp in ipairs(value.keypoints) do
			table.insert(keypoints,
				ColorSequenceKeypoint.new(kp.time, Color3.new(kp.color.r, kp.color.g, kp.color.b)))
		end
		return ColorSequence.new(keypoints)
	elseif typeName == "NumberSequence" then
		local keypoints = {}
		for _, kp in ipairs(value.keypoints) do
			table.insert(keypoints, NumberSequenceKeypoint.new(kp.time, kp.value))
		end
		return NumberSequence.new(keypoints)
	end

	return value
end

function PatchApply.ensureFolder(path)
	local parts = string.split(path, "/")
	local current = game
	for _, part in ipairs(parts) do
		local child = current:FindFirstChild(part)
		if not child then
			child = Instance.new("Folder")
			child.Name = part
			child.Parent = current
		end
		current = child
	end
	return current
end

function PatchApply.createInstance(op)
	local parent = resolvePath(op.parentPath)
	if not parent then
		PatchApply.ensureFolder(op.parentPath)
		parent = resolvePath(op.parentPath)
	end

	local inst = Instance.new(op.className)
	inst.Name = op.name

	for prop, value in pairs(op.properties) do
		local resolved = resolveValue(value)
		if resolved ~= nil then
			local success, err = pcall(function()
				inst[prop] = resolved
			end)
			if not success then
				warn("[VFXCopilot] Failed to set " .. prop .. " on " .. op.name .. ": " .. tostring(err))
			end
		end
	end

	inst.Parent = parent
	createdInstancesRegistry[op.id] = inst
	return inst
end

function PatchApply.createScript(op)
	local pathParts = string.split(op.path, "/")
	local scriptName = pathParts[#pathParts]
	local parentPath = table.concat(pathParts, "/", 1, #pathParts - 1)

	local parent = resolvePath(parentPath)
	if not parent then
		PatchApply.ensureFolder(parentPath)
		parent = resolvePath(parentPath)
	end

	local scriptInst
	if op.scriptType == "ModuleScript" then
		scriptInst = Instance.new("ModuleScript")
	elseif op.scriptType == "LocalScript" then
		scriptInst = Instance.new("LocalScript")
	else
		scriptInst = Instance.new("Script")
	end

	scriptInst.Name = scriptName
	scriptInst.Source = op.source
	scriptInst.Parent = parent
	return scriptInst
end

function PatchApply.setProperty(op)
	local target, err = resolvePath(op.targetPath)
	if not target then return end
	local resolved = resolveValue(op.value)
	pcall(function() target[op.property] = resolved end)
end

function PatchApply.deleteInstance(op)
	local target = resolvePath(op.path)
	if target then target:Destroy() end
end

function PatchApply.moveInstance(op)
	local source = resolvePath(op.fromPath)
	local dest = resolvePath(op.toPath) or PatchApply.ensureFolder(op.toPath)
	if source and dest then source.Parent = dest end
end

function PatchApply.apply(patch)
	createdInstancesRegistry = {} 
	local results = { created = {}, errors = {} }

	for _, op in ipairs(patch.operations) do
		local success, err = pcall(function()
			if op.op == "ensureFolder" then
				PatchApply.ensureFolder(op.path)
			elseif op.op == "createInstance" then
				local inst = PatchApply.createInstance(op)
				table.insert(results.created, inst)
			elseif op.op == "createScript" then
				local inst = PatchApply.createScript(op)
				table.insert(results.created, inst)
			elseif op.op == "setProperty" then
				PatchApply.setProperty(op)
			elseif op.op == "deleteInstance" then
				PatchApply.deleteInstance(op)
			elseif op.op == "moveInstance" then
				PatchApply.moveInstance(op)
			end
		end)

		if not success then
			table.insert(results.errors, { op = op.op, error = tostring(err) })
			if op.op == "createInstance" or op.op == "createScript" then break end
		end
	end

	return results
end

--------------------------------------------------------------------------------
-- PLUGIN UI & MAIN LOOP
--------------------------------------------------------------------------------
local toolbar = plugin:CreateToolbar("VFX Copilot")
local toggleButton = toolbar:CreateButton("VFX Copilot", "Open VFX Copilot panel", "rbxassetid://13583091942")

local widgetInfo = DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 400, 600, 300, 400)
local widget = plugin:CreateDockWidgetPluginGui("VFXCopilotWidget", widgetInfo)
widget.Title = "VFX Copilot"

local screenGui = Instance.new("Frame")
screenGui.Size = UDim2.new(1, 0, 1, 0)
screenGui.BackgroundColor3 = Color3.fromRGB(26, 26, 46)
screenGui.Parent = widget

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, -16, 0, 30)
statusLabel.Position = UDim2.new(0, 8, 0, 8)
statusLabel.BackgroundTransparency = 1
statusLabel.TextColor3 = Color3.fromRGB(224, 224, 224)
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.Text = "Disconnected"
statusLabel.Parent = screenGui

local outputLabel = Instance.new("TextLabel")
outputLabel.Size = UDim2.new(1, -16, 1, -100)
outputLabel.Position = UDim2.new(0, 8, 0, 46)
outputLabel.BackgroundColor3 = Color3.fromRGB(22, 33, 62)
outputLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
outputLabel.TextSize = 13
outputLabel.TextWrapped = true
outputLabel.TextXAlignment = Enum.TextXAlignment.Left
outputLabel.TextYAlignment = Enum.TextYAlignment.Top
outputLabel.Text = "Waiting for CLI..."
outputLabel.Parent = screenGui

local checkpoints = {}
local isConnected = false

toggleButton.Click:Connect(function() widget.Enabled = not widget.Enabled end)

task.spawn(function()
	while true do
		local ok = HttpClient.healthCheck()
		isConnected = ok
		statusLabel.Text = ok and "Connected" or "Disconnected"
		statusLabel.TextColor3 = ok and Color3.fromRGB(46, 204, 113) or Color3.fromRGB(231, 76, 60)
		task.wait(5)
	end
end)

task.spawn(function()
	while true do
		if isConnected then
			local action, err = HttpClient.getPendingAction()
			if action and action.action == "apply" and action.patch then
				outputLabel.Text = "Applying from CLI: " .. (action.patch.effectName or "unnamed")
				local results = PatchApply.apply(action.patch)
				table.insert(checkpoints, { patch = action.patch, created = results.created })
				
				if #results.errors > 0 then
					outputLabel.Text = "Apply had errors. See Output."
				else
					outputLabel.Text = "Successfully applied " .. #results.created .. " objects."
				end
				HttpClient.confirmAction()

			elseif action and action.action == "revert" then
				if #checkpoints > 0 then
					local cp = table.remove(checkpoints)
					local count = 0
					for _, inst in ipairs(cp.created) do
						if inst and inst.Parent then
							inst:Destroy()
							count = count + 1
						end
					end
					outputLabel.Text = "Reverted: " .. (cp.patch.effectName or "effect") .. " (" .. count .. " items removed)"
				else
					outputLabel.Text = "No checkpoints to revert."
				end
				HttpClient.confirmAction()
			end
		end
		task.wait(Config.PollInterval)
	end
end)
