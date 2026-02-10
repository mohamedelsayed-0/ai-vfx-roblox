export const RECOIL_SOURCE = `local TweenService = game:GetService("TweenService")

local Recoil = {}

function Recoil.apply(part, offsetCFrame, duration, returnDuration)
	duration = duration or 0.05
	returnDuration = returnDuration or 0.2

	local original = part.CFrame
	local recoiled = original * offsetCFrame

	local kickInfo = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	local kickTween = TweenService:Create(part, kickInfo, { CFrame = recoiled })
	kickTween:Play()

	kickTween.Completed:Connect(function()
		local returnInfo = TweenInfo.new(returnDuration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
		local returnTween = TweenService:Create(part, returnInfo, { CFrame = original })
		returnTween:Play()
	end)

	return kickTween
end

function Recoil.gunRecoil(part)
	return Recoil.apply(part, CFrame.Angles(math.rad(-5), 0, 0) * CFrame.new(0, 0, 0.3))
end

function Recoil.punchRecoil(part)
	return Recoil.apply(part, CFrame.new(0, 0, -0.5), 0.03, 0.15)
end

return Recoil`;
