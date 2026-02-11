local PatchApply = {}

-- Registry of created instances by operation id
local createdInstances = {}

-- Resolve a Roblox path like "ReplicatedStorage/VFXCopilot/Effects/MyEffect"
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

-- Resolve a property value, handling $ref, $type, $enum
local function resolveValue(value)
	if type(value) ~= "table" then
		return value
	end

	-- Reference to another created instance
	if value["$ref"] then
		local ref = createdInstances[value["$ref"]]
		if not ref then
			warn("[VFXCopilot] $ref not found: " .. value["$ref"])
			return nil
		end
		return ref
	end

	-- Enum value
	if value["$enum"] then
		local parts = string.split(value["$enum"], ".")
		local current = Enum
		for i = 2, #parts do -- skip "Enum"
			current = current[parts[i]]
		end
		return current
	end

	-- Roblox type constructors
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

-- Operation: ensureFolder
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

-- Operation: createInstance
function PatchApply.createInstance(op)
	local parent = resolvePath(op.parentPath)
	if not parent then
		PatchApply.ensureFolder(op.parentPath)
		parent = resolvePath(op.parentPath)
	end

	local inst = Instance.new(op.className)
	inst.Name = op.name

	-- Set properties
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
	createdInstances[op.id] = inst
	return inst
end

-- Operation: createScript
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

-- Operation: setProperty
function PatchApply.setProperty(op)
	local target, err = resolvePath(op.targetPath)
	if not target then
		warn("[VFXCopilot] setProperty failed: " .. tostring(err))
		return
	end
	local resolved = resolveValue(op.value)
	local success, setErr = pcall(function()
		target[op.property] = resolved
	end)
	if not success then
		warn("[VFXCopilot] Failed to set " .. op.property .. ": " .. tostring(setErr))
	end
end

-- Operation: deleteInstance
function PatchApply.deleteInstance(op)
	local target, err = resolvePath(op.path)
	if not target then
		warn("[VFXCopilot] deleteInstance failed: " .. tostring(err))
		return
	end
	target:Destroy()
end

-- Operation: moveInstance
function PatchApply.moveInstance(op)
	local source, err1 = resolvePath(op.fromPath)
	if not source then
		warn("[VFXCopilot] moveInstance source not found: " .. tostring(err1))
		return
	end
	local dest, err2 = resolvePath(op.toPath)
	if not dest then
		PatchApply.ensureFolder(op.toPath)
		dest = resolvePath(op.toPath)
	end
	source.Parent = dest
end

-- Apply a full patch
function PatchApply.apply(patch)
	createdInstances = {} -- reset registry
	local results = { created = {}, errors = {}, warnings = {} }

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
			table.insert(results.errors, {
				op = op.op,
				error = tostring(err),
			})
			-- Halt on instance creation failure per spec
			if op.op == "createInstance" or op.op == "createScript" then
				break
			end
		end
	end

	results.createdInstances = createdInstances
	return results
end

-- Get the created instances registry (for checkpoint system)
function PatchApply.getCreatedInstances()
	return createdInstances
end

-- VFX class check: returns true if an instance needs a BasePart parent to render
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

-- Spawn a visible preview in Workspace so the user can see the effect
-- Returns: previewPart (the Part in Workspace), burstConnection (repeating burst loop)
function PatchApply.spawnPreview(effectFolder, effectName)
	-- Ensure Workspace/VFXCopilot/Previews/ exists
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

	-- Remove old preview with the same name
	local existing = previews:FindFirstChild(effectName .. "_Preview")
	if existing then
		existing:Destroy()
	end

	-- Create a transparent anchored Part as the host for VFX objects
	local previewPart = Instance.new("Part")
	previewPart.Name = effectName .. "_Preview"
	previewPart.Anchored = true
	previewPart.CanCollide = false
	previewPart.Transparency = 1
	previewPart.Size = Vector3.new(1, 1, 1)

	-- Position at camera focus or origin
	local camera = game.Workspace.CurrentCamera
	if camera then
		previewPart.CFrame = camera.CFrame * CFrame.new(0, 0, -10)
	else
		previewPart.Position = Vector3.new(0, 5, 0)
	end

	previewPart.Parent = previews

	-- Clone the entire effect folder (preserves internal $ref wiring)
	local clone = effectFolder:Clone()

	-- Move VFX-relevant children from the cloned folder onto the Part
	for _, child in ipairs(clone:GetChildren()) do
		if isVFXClass(child) then
			child.Parent = previewPart
		end
	end
	clone:Destroy()

	-- Auto-trigger burst emitters (Rate = 0) and replay infinitely
	local burstEmitters = {}
	for _, child in ipairs(previewPart:GetChildren()) do
		if child:IsA("ParticleEmitter") and child.Rate == 0 then
			table.insert(burstEmitters, child)
		end
	end

	local burstConnection = nil
	if #burstEmitters > 0 then
		-- Emit once immediately
		for _, emitter in ipairs(burstEmitters) do
			emitter:Emit(25)
		end
		-- Then replay every 2 seconds
		burstConnection = task.spawn(function()
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

	return previewPart, burstConnection
end

-- Destroy a preview and stop its burst loop
function PatchApply.destroyPreview(previewPart)
	if previewPart and previewPart.Parent then
		previewPart:Destroy()
	end
end

return PatchApply
