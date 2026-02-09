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

return PatchApply
