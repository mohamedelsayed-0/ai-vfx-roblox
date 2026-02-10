export const IMPACT_SOURCE = `local TweenService = game:GetService("TweenService")

local Impact = {}

function Impact.hitStop(duration)
	duration = duration or 0.05
	local clock = os.clock()
	while os.clock() - clock < duration do
		task.wait()
	end
end

function Impact.knockback(humanoid, direction, force, duration)
	force = force or 50
	duration = duration or 0.3

	local rootPart = humanoid.RootPart
	if not rootPart then return end

	local velocity = Instance.new("BodyVelocity")
	velocity.MaxForce = Vector3.new(math.huge, 0, math.huge)
	velocity.Velocity = direction.Unit * force
	velocity.Parent = rootPart

	task.delay(duration, function()
		velocity:Destroy()
	end)

	return velocity
end

function Impact.screenFlash(color, duration)
	color = color or Color3.new(1, 1, 1)
	duration = duration or 0.1

	local player = game:GetService("Players").LocalPlayer
	if not player then return end
	local gui = player:FindFirstChild("PlayerGui")
	if not gui then return end

	local flash = Instance.new("ScreenGui")
	local frame = Instance.new("Frame")
	frame.Size = UDim2.new(1, 0, 1, 0)
	frame.BackgroundColor3 = color
	frame.BackgroundTransparency = 0
	frame.BorderSizePixel = 0
	frame.Parent = flash
	flash.Parent = gui

	local info = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	local tween = TweenService:Create(frame, info, { BackgroundTransparency = 1 })
	tween:Play()
	tween.Completed:Connect(function()
		flash:Destroy()
	end)

	return flash
end

return Impact`;
