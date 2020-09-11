import util from 'util';
import path from 'path';
import url from 'url';
import { execFile as ef } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent } from 'electron';
import { OCR_CHANNEL, TesseractHocrRequestMessage, TesseractHocrResponseMessage } from '../src/ocr.electron';
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

ipcMain.handle('ocr-list-langs', async () => {
  const config = getConfig();

  const { stdout } = await execFile(config.tesseractPath, ['--list-langs']);

  return stdout;
})

let isRunningJobs = false;

type Job = [IpcMainEvent, TesseractHocrRequestMessage];
const jobs: Job[] = [];

ipcMain.on(OCR_CHANNEL, async (event, message: TesseractHocrRequestMessage) => {
  console.log('Received OCR request:', message.filename, message.langs);

  jobs.push([event, message]);

  await runJobs();
});

async function runJobs() {
  // No need to enter this section more than once if the loop is running.
  if (isRunningJobs) {
    return;
  }

  console.log('Running jobs...');

  isRunningJobs = true;

  const config = getConfig();

  // Handle all jobs in sequence.
  // TODO: Use a pool.
  while (jobs.length) {
    const job = jobs.pop();

    assert(job);

    const [event, message] = job;

    console.log('Running job:', message.filename);

    const { stdout } = await execFile(config.tesseractPath, [message.filename, 'stdout', '-l', message.langs, 'hocr']);

    const response: TesseractHocrResponseMessage = {
      filename: message.filename,
      hocr: stdout,
    };

    event.reply(OCR_CHANNEL, response);
  }

  console.log('Done running jobs.');

  isRunningJobs = false;
}

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
