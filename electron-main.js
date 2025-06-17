const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const url = require('node:url');

const isDev = process.env.NODE_ENV !== 'production';
const nextDevPort = 9002; // Make sure this matches your Next.js dev port

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${nextDevPort}`);
    mainWindow.webContents.openDevTools(); // Open DevTools in development
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'out/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }
  
  // Optional: Remove default menu in production for a cleaner look
  if (!isDev) {
    // Menu.setApplicationMenu(null); // Simple way to remove menu
    // Or create a minimal menu
    const minimalMenu = Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
       {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' }, // Keep DevTools accessible
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      }
    ]);
    Menu.setApplicationMenu(minimalMenu);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
