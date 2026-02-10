-- VFX Copilot — ROBUST BUNDLED PLUGIN
-- Paste this into a Script in ServerStorage, set RunContext to Plugin.

local HttpService = game:GetService("HttpService")

local Config = {
	BackendUrl = "http://127.0.0.1:3000",
	PollInterval = 2,
}

local HttpClient = {}
function HttpClient.healthCheck()
	local success, result = pcall(function()
		return HttpService:RequestAsync({ Url = Config.BackendUrl .. "/health", Method = "GET" })
	end)
	return success and result.StatusCode == 200
end

function HttpClient.getPendingAction()
	local success, result = pcall(function()
		return HttpService:RequestAsync({ Url = Config.BackendUrl .. "/pending-action", Method = "GET" })
	end)
	if success and result.StatusCode == 200 then
		local decoded = HttpService:JSONDecode(result.Body)
		return (decoded and decoded.action ~= "none") and decoded or nil
	end
	return nil
end

function HttpClient.confirmAction()
	pcall(function()
		HttpService:RequestAsync({
			Url = Config.BackendUrl .. "/confirm-action",
			Method = "POST",
			Body = HttpService:JSONEncode({ ok = true })
		})
	end)
end

local PatchApply = {}
local function resolveOrEnsure(path, ensure)
	local parts = string.split(path, "/")
	local current = game
	for i, part in ipairs(parts) do
		local child
		if i == 1 then
			-- Standard Roblox Services
			local ok, service = pcall(function() return game:GetService(part) end)
			child = ok and service or current:FindFirstChild(part)
		else
			child = current:FindFirstChild(part)
		end
		
		if not child and ensure then
			child = Instance.new("Folder")
			child.Name = part
			child.Parent = current
			print("[VFX Copilot] Created folder: " .. path)
		elseif not child then
			return nil
		end
		current = child
	end
	return current
end

function PatchApply.apply(patch)
	local count = 0
	local rootFolder = nil
	local createdParts = {}

	for _, op in ipairs(patch.operations) do
		local success, err = pcall(function()
			if op.op == "ensureFolder" then
				local folder = resolveOrEnsure(op.path, true)
				if not rootFolder then rootFolder = folder end
			elseif op.op == "createInstance" then
				local parent = resolveOrEnsure(op.parentPath, true)
				local inst = Instance.new(op.className)
				inst.Name = op.name
				for prop, val in pairs(op.properties) do
					pcall(function() inst[prop] = val end)
				end
				inst.Parent = parent
				if inst:IsA("BasePart") or inst:IsA("Attachment") then
					table.insert(createdParts, inst)
				end
				count = count + 1
			elseif op.op == "createScript" then
				local parts = string.split(op.path, "/")
				local name = parts[#parts]
				local pPath = table.concat(parts, "/", 1, #parts-1)
				local parent = resolveOrEnsure(pPath, true)
				local s = Instance.new(op.scriptType or "ModuleScript")
				s.Name = name
				s.Source = op.source
				s.Parent = parent
				count = count + 1
			end
		end)
		if not success then warn("[VFX Copilot] Error in op " .. op.op .. ": " .. tostring(err)) end
	end

	-- Move to camera view if in Workspace
	if rootFolder and rootFolder:IsDescendantOf(workspace) then
		local cam = workspace.CurrentCamera
		if cam then
			local targetPos = cam.CFrame.Position + (cam.CFrame.LookVector * 15)
			if #createdParts > 0 then
				local center = Vector3.new(0,0,0)
				for _, p in ipairs(createdParts) do 
					local pPos = p:IsA("BasePart") and p.Position or p.WorldPosition
					center = center + pPos 
				end
				center = center / #createdParts
				local offset = targetPos - center
				for _, p in ipairs(createdParts) do 
					if p:IsA("BasePart") then
						p.Position = p.Position + offset 
					else
						p.WorldPosition = p.WorldPosition + offset
					end
				end
			end
		end
	end

	return count
end

print("[VFX Copilot] Plugin active. Version 1.2")

task.spawn(function()
	local connected = nil -- Start as nil to force a print on first check
	print("[VFX Copilot] Starting connection loop to: " .. Config.BackendUrl)
	
	while true do
		local healthy = HttpClient.healthCheck()
		
		if healthy ~= connected then
			connected = healthy
			if healthy then
				print("🟢 [VFX Copilot] Connected to Backend!")
			else
				warn("🔴 [VFX Copilot] Backend Disconnected. (Ensure CLI is running at " .. Config.BackendUrl .. ")")
			end
		end
		
		if connected then
			local action = HttpClient.getPendingAction()
			if action and action.action == "apply" then
				print("📦 [VFX Copilot] Received Patch: " .. (action.patch.effectName or "unnamed"))
				local n = PatchApply.apply(action.patch)
				warn("✅ [VFX Copilot] Successfully created " .. n .. " objects.")
				HttpClient.confirmAction()
			end
		end
		task.wait(Config.PollInterval)
	end
end)
