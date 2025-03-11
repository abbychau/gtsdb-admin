import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import portfinder from 'portfinder';

const __dirname = path.resolve();

let mainWindow;
let backendProcess;
let appPort;

// Configure portfinder
portfinder.basePort = 3000; // Start checking from port 3000

async function startApp() {
  try {
    // Find an available port
    appPort = await portfinder.getPortPromise();
    console.log(`Found available port: ${appPort}`);
    
    // Start the backend with the selected port
    startBackend();
    
    // Create the window after a delay
    setTimeout(() => {
      createWindow();
    }, 3000);
  } catch (err) {
    console.error('Failed to find an available port:', err);
    app.quit();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // Disable Node.js integration for security
      contextIsolation: true, // Enable context isolation
    },
    icon: path.join(__dirname, 'public', 'favicon.png')
  });

  // Load the frontend (Next.js app) using the dynamic port
  const startUrl = `http://localhost:${appPort}`;
  console.log(`Loading application at: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  console.log(`Starting the backend server on port ${appPort}...`);
  
  // Pass the port as an environment variable to the Next.js process
  const env = Object.assign({}, process.env, { PORT: appPort.toString() });
  
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  backendProcess = spawn(npmCmd, ['run', 'start'], {
    cwd: path.join(__dirname),
    shell: process.platform === 'win32', // Only use shell on Windows
    env: env,
    stdio: 'pipe'
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

app.on('ready', startApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  // Kill the backend process when the app quits
  if (backendProcess) {
    console.log('Killing the backend process...');
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
