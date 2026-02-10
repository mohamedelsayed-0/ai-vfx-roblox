export const CAMERA_SHAKE_SOURCE = `local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local CameraShake = {}

function CameraShake.shake(intensity, duration, frequency)
	intensity = intensity or 1
	duration = duration or 0.3
	frequency = frequency or 20

	local camera = workspace.CurrentCamera
	if not camera then return end

	local originalCFrame = camera.CFrame
	local elapsed = 0

	local connection
	connection = RunService.RenderStepped:Connect(function(dt)
		elapsed = elapsed + dt
		if elapsed >= duration then
			camera.CFrame = originalCFrame
			connection:Disconnect()
			return
		end

		local decay = 1 - (elapsed / duration)
		local offsetX = (math.random() - 0.5) * 2 * intensity * decay
		local offsetY = (math.random() - 0.5) * 2 * intensity * decay
		camera.CFrame = originalCFrame * CFrame.new(offsetX, offsetY, 0)
	end)

	return connection
end

function CameraShake.impact(intensity)
	return CameraShake.shake(intensity or 2, 0.15, 30)
end

function CameraShake.rumble(intensity, duration)
	return CameraShake.shake(intensity or 0.5, duration or 1, 15)
end

return CameraShake`;
