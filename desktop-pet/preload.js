const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hanaPet", {
  isElectron: true,
  onDragStart: (x, y) => ipcRenderer.send("pet:drag-start", x, y),
  onDragMove: (x, y) => ipcRenderer.send("pet:drag-move", x, y),
  onDragEnd: () => ipcRenderer.send("pet:drag-end"),
  requestContextMenu: () => ipcRenderer.send("pet:context-menu"),
  ready: () => ipcRenderer.send("pet:ready"),
  onSwitchConfig: (cb) =>
    ipcRenderer.on("pet:switch-config", (_e, filename) => cb(filename)),
  onSwitchModel: (cb) =>
    ipcRenderer.on("pet:switch-model", (_e, name) => cb(name)),
  onChatVisible: (cb) =>
    ipcRenderer.on("pet:chat-visible", (_e, visible) => cb(visible)),
  onBubbleMode: (cb) =>
    ipcRenderer.on("pet:bubble-mode", (_e, enabled) => cb(enabled)),
  onVoiceReply: (cb) =>
    ipcRenderer.on("pet:voice-reply", (_e, enabled) => cb(enabled)),
});
