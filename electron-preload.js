const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: send a message to main process
  // send: (channel, data) => ipcRenderer.send(channel, data),
  // Example: receive a message from main process
  // on: (channel, func) => {
  //   const validChannels = ['your-channel-name']; // Add valid channels
  //   if (validChannels.includes(channel)) {
  //     // Deliberately strip event as it includes `sender`
  //     ipcRenderer.on(channel, (event, ...args) => func(...args));
  //   }
  // }
});

console.log('Electron preload script loaded.');
