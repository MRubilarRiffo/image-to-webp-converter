const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'frontend/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Iniciar el servidor Node.js al abrir la ventana principal
  const serverProcess = spawn('node', [path.join(__dirname, './server/server.js')]);
  serverProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  serverProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
