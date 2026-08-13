// src/preload.js
const { contextBridge, ipcRenderer } = require('electron')

// Экспонируем безопасные API для рендерера
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    // Белый список каналов
    const validChannels = ['toMain']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  receive: (channel, func) => {
    const validChannels = ['fromMain']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
})