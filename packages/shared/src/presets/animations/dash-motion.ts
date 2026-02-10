export const DASH_MOTION_SOURCE = `local TweenService = game:GetService("TweenService")

local DashMotion = {}

function DashMotion.dash(humanoid, direction, distance, duration)
	distance = distance or 30
	duration = duration or 0.2

	local rootPart = humanoid.RootPart
	if not rootPart then return end

	local targetCFrame = rootPart.CFrame + (direction.Unit * distance)
	local info = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	local tween = TweenService:Create(rootPart, info, { CFrame = targetCFrame })
	tween:Play()
	return tween
end

function DashMotion.forwardDash(humanoid, distance, duration)
	local rootPart = humanoid.RootPart
	if not rootPart then return end
	local direction = rootPart.CFrame.LookVector
	return DashMotion.dash(humanoid, direction, distance, duration)
end

return DashMotion`;
