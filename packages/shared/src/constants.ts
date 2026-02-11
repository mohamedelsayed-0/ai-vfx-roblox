export const ALLOWED_ROOTS = [
  "ReplicatedStorage/VFXCopilot/",
  "Workspace/VFXCopilot/",
  "Lighting/",
];

export const ALLOWED_LIGHTING_CLASSES = [
  "BloomEffect",
  "BlurEffect",
  "ColorCorrectionEffect",
  "SunRaysEffect",
  "DepthOfFieldEffect",
];

export const MAX_PATH_DEPTH = 8;
export const MAX_OPERATIONS = 100;

export const BLOCKED_LUA_PATTERNS = [
  "loadstring(",
  "loadstring (",
  "getfenv(",
  "setfenv(",
  'require(game:GetService("InsertService"))',
  ":HttpGet(",
  ":PostAsync(",
  'game:GetService("HttpService")',
];
