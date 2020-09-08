import util from 'util';
import path from 'path';
import url from 'url';
import { execFile as ef } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { TesseractMessage } from '../src/ocr.electron';
import assert from '../src/lib/assert';
import { Config, getConfig, setConfig } from './config';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true,
  });

  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: startUrl,
      nodeIntegration: true,
    },
    width: 1920,
    height: 1080,
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

ipcMain.handle('ocr', async (event, message: TesseractMessage) => {
  switch (message.type) {
    case 'list': {
      const { stdout } = await execFile(getConfig().tesseractPath, ['--list-langs']);

      return stdout;
    }
    case 'hocr': {
      const { stdout } = await execFile(getConfig().tesseractPath, [message.filename, 'stdout', '-l', message.langs, 'hocr']);

      return stdout;
    }
  }
});

ipcMain.handle('browse', async (event) => {
  assert(mainWindow);

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
  });

  if (result.filePaths.length) {
    return result.filePaths[0];
  }

  return null;
});

ipcMain.handle('config', async (event, config: Config | undefined) => {
  if (config) {
    setConfig(config);
    return;
  }

  return getConfig();
});
