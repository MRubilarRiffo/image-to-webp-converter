const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Determinar el entorno de forma nativa
const isDev = !app.isPackaged;

let mainWindow;
let nextProcess;

process.on('uncaughtException', (error) => {
    dialog.showErrorBox('Uncaught Exception', error.stack || error.toString());
});

process.on('unhandledRejection', (reason) => {
    dialog.showErrorBox('Unhandled Rejection', reason.stack || reason.toString());
});

async function getAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = require('net').createServer();
        server.unref();
        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                resolve(getAvailablePort(startPort + 1));
            } else {
                reject(e);
            }
        });
        server.listen({ port: startPort, host: '127.0.0.1' }, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

async function createWindow() {
    const port = await getAvailablePort(3000);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        show: false // No mostramos la ventana hasta que Next.js esté listo
    });

    if (isDev) {
        // Modo Desarrollo: Iniciamos Next.js internamente
        nextProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '-p', port], {
            cwd: app.getAppPath(),
            stdio: 'inherit'
        });

        // Esperamos un momento para que el dev server compile
        setTimeout(() => {
            mainWindow.loadURL(`http://localhost:${port}`);
            mainWindow.show();
        }, 5000);

    } else {
        // Modo Producción: Ejecutamos el servidor standalone de Next.js
        const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone', 'server.js');

        // Necesitamos pasar PORT env a la ruta estática y configurar el ejecutable
        const env = Object.assign({}, process.env, {
            PORT: port,
            NODE_ENV: 'production',
            ELECTRON_RUN_AS_NODE: '1' // Truco clave para usar Electron como binario de Node
        });

        // Usamos process.execPath que corresponde al .exe de la app actual (Image Converter.exe)
        nextProcess = spawn(process.execPath, [serverPath], {
            env: env,
            stdio: ['ignore', 'ignore', 'pipe'] // Solo capturamos stderr
        });

        let errorLog = '';

        // Capturamos logs de NextJS en producción para depurar errores
        if (nextProcess.stderr) {
            nextProcess.stderr.on('data', (data) => {
                errorLog += data.toString();
                console.error(`NextJS Error: ${data}`);
            });
        }

        nextProcess.on('exit', (code) => {
            if (code !== 0) {
                dialog.showErrorBox('Next.js Crash', `El servidor interno de Next.js se detuvo inesperadamente con código ${code}.\n\nDetalles:\n${errorLog.substring(0, 1000)}`);
            }
        });

        // Esperar a que inicie
        setTimeout(() => {
            mainWindow.loadURL(`http://localhost:${port}`);
            mainWindow.show();
        }, 3000);
    }

    // Desactivar el reload con F5 en producción
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F5' && !isDev) {
            event.preventDefault();
        }
    });
}

// Inicializar la App
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Matar el subproceso de Next.js cuando Electron se cierra
app.on('before-quit', () => {
    if (nextProcess) {
        nextProcess.kill();
    }
});


