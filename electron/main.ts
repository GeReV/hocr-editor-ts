import util from 'util';
import path from 'path';
import fs from 'fs';
import url from 'url';
import { execFile as ef } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent } from 'electron';
import archiver from 'archiver';

import { OCR_CHANNEL, TesseractHocrRequestMessage, TesseractHocrResponseMessage } from '../src/ocr.electron';
import assert from '../src/lib/assert';
import { ExportMessage, ExportType } from '../src/components/ExportModal/actions.electron';
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

const writeFile = util.promisify(fs.writeFile);
const copyFile = util.promisify(fs.copyFile);

ipcMain.handle('export', async (event, message: ExportMessage) => {
  assert(mainWindow);

  switch (message.type) {
    case ExportType.Zip: {
      const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
          {
            name: 'Zip file',
            extensions: ['zip'],
          },
        ],
      });

      if (result.filePath && !result.canceled) {
        const output = fs.createWriteStream(result.filePath);
        const archive = archiver('zip', {
          zlib: { level: 9 }, // Sets the compression level.
        });

        output.on('close', function () {
          console.debug(`Done writing ${result.filePath}: ${archive.pointer()} total bytes`);
        });

        archive.on('warning', function (err) {
          console.warn(`Warning while saving zip: ${err.message}`);
          throw err;
        });

        archive.on('error', function (err) {
          console.error(`Error while saving zip: ${err.message}`);
          throw err;
        });

        archive.pipe(output);

        archive.append(message.hocr, { name: 'index.hocr.html' });

        message.images.forEach(imagePath => {
          archive.append(fs.createReadStream(imagePath), { name: path.basename(imagePath) })
        });

        await archive.finalize();
      }
    }
      break;
    case ExportType.Folder: {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
      });

      if (result.filePaths.length && !result.canceled) {
        const destinationDir = result.filePaths[0];

        await writeFile(path.join(destinationDir, 'index.hocr.html'), message.hocr, { encoding: 'utf-8' });

        const copies = message.images.map(image => copyFile(image, path.join(destinationDir, path.basename(image))));

        await Promise.all(copies);
      }
    }
      break;
  }
});
