'use strict';

require('@electron/remote/main').initialize();
import { app, BrowserWindow, protocol } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';

const isDevelopment = !!process.env.WEBPACK_DEV_SERVER_URL;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

let PORT = process.env.SOLARSTATS_PORT;

if (!PORT) PORT = 7777;

if (!isDevelopment && app.dock) app.dock.hide();

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1300,
    height: 800,
    frame: false,
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // This is a way to bypass CORS but this is not secure at all
      webSecurity: false,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    // if (isDevelopment) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    await win.loadURL('app://./index.html');
  }

  win.webContents.send('PORT', PORT);
  win.webContents.on('did-finish-load', () =>
    win.webContents.send('PORT', PORT)
  );

  require('@electron/remote/main').enable(win.webContents);
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else BrowserWindow.getAllWindows().forEach((win) => win.show());
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => createWindow());

// Exit cleanly on request from parent process.
if (process.platform === 'win32') {
  process.on('message', (data) => {
    if (data === 'graceful-exit') {
      app.quit();
    }
  });
} else {
  process.on('SIGTERM', () => {
    app.quit();
  });
}
