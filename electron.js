const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // Disable Node.js integration for security
      contextIsolation: true, // Enable context isolation
    },
  });

  // Load the frontend (Next.js app)
  const startUrl = 'http://localhost:3000'; // The Next.js server will run on this port
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  console.log('Starting the backend server...');
  // backendProcess = spawn('npm', ['run', 'start'], {
  //   cwd: path.join(__dirname), // Set the working directory to your project root
  //   shell: true,
  // });

  // backendProcess.stdout.on('data', (data) => {
  //   console.log(`Backend: ${data}`);
  // });

  // backendProcess.stderr.on('data', (data) => {
  //   console.error(`Backend Error: ${data}`);
  // });

  // backendProcess.on('close', (code) => {
  //   console.log(`Backend process exited with code \${code}`);
  // });

  // Wait a bit to ensure the backend server is running, then create the window
  setTimeout(() => {
    createWindow();
  }, 3000); // Adjust the delay as needed
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  // Kill the backend process when the app quits
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
