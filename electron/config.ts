import fs from 'fs';
import path from 'path';

interface Config {
  tesseractPath: string;
}

export function getConfig(): Config {
  const json = fs.readFileSync(path.resolve(__dirname, '../config.json'), { encoding: 'utf-8' });

  return JSON.parse(json);
}

export default {
  get: getConfig,
}
