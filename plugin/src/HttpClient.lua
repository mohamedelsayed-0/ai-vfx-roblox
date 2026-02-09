local HttpService = game:GetService("HttpService")
local Config = require(script.Parent.Config)

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

function HttpClient.getLatestPatch()
	local success, result = pcall(function()
		return HttpService:RequestAsync({
			Url = Config.BackendUrl .. "/latest-patch",
			Method = "GET",
			Headers = { ["Content-Type"] = "application/json" },
		})
	end)

	if success and result.StatusCode == 200 then
		return HttpService:JSONDecode(result.Body), nil
	end
	return nil, "No patch available"
end

return HttpClient
