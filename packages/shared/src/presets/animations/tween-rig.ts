export const TWEEN_RIG_SOURCE = `local TweenService = game:GetService("TweenService")

local TweenRig = {}

function TweenRig.tween(instance, properties, duration, easingStyle, easingDirection)
	easingStyle = easingStyle or Enum.EasingStyle.Quad
	easingDirection = easingDirection or Enum.EasingDirection.Out
	local info = TweenInfo.new(duration, easingStyle, easingDirection)
	local tween = TweenService:Create(instance, info, properties)
	tween:Play()
	return tween
end

function TweenRig.tweenSequence(instance, keyframes)
	local index = 1
	local function playNext()
		if index > #keyframes then return end
		local kf = keyframes[index]
		index = index + 1
		local tween = TweenRig.tween(instance, kf.properties, kf.duration, kf.easingStyle, kf.easingDirection)
		tween.Completed:Connect(playNext)
	end
	playNext()
end

function TweenRig.pulse(instance, property, minVal, maxVal, duration)
	local info = TweenInfo.new(duration / 2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
	local tween = TweenService:Create(instance, info, { [property] = maxVal })
	instance[property] = minVal
	tween:Play()
	return tween
end

return TweenRig`;
