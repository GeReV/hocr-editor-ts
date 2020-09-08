import fs from 'fs';
import path from 'path';

export interface Config {
  tesseractPath: string;
}

export function getConfig(): Config {
  const json = fs.readFileSync(path.resolve(__dirname, '../config.json'), { encoding: 'utf-8' });

  return JSON.parse(json);
}

export function setConfig(config: Config): void {
  fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(config), { encoding: 'utf-8' });
}

export default {
  get: getConfig,
  set: setConfig,
}
