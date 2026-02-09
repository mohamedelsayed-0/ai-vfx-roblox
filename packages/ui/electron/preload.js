const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("vfxcopilot", {
  platform: process.platform,
});
