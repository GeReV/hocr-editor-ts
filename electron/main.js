const util = require('util');
const path = require('path');
const url = require('url');
const { execFile: ef } = require('child_process');
const { app, BrowserWindow, ipcMain } = require('electron');

function createWindow() {
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: startUrl,
      nodeIntegration: true,
    },
    width: 1440,
    height: 900,
  });

  mainWindow.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const execFile = util.promisify(ef);

ipcMain.handle('ocr', async (event, args) => {
  if (args[0] === 'test') {
    const { stdout } = await execFile('C:/02 - Applications/tesseract/tesseract.exe', ['--list-langs']);

    console.log(stdout);

    return stdout;
  }

  return null;
});
