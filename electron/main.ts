import util from 'util';
import path from 'path';
import url from 'url';
import { execFile as ef } from 'child_process';
import { app, BrowserWindow, ipcMain } from 'electron';

function createWindow() {
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../index.html'),
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

ipcMain.handle('ocr', async (event, ...args) => {
  if (args[0] === 'list') {
    const { stdout } = await execFile('C:/02 - Applications/tesseract/tesseract.exe', ['--list-langs']);

    console.log(stdout);

    return stdout;
  }

  return null;
});
