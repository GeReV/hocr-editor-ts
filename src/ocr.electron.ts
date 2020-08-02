import { ipcRenderer } from 'electron';
import { RecognizeResult, Rectangle } from 'tesseract.js';

import { OcrDocument } from './reducer/types';
import { Page, RecognizeUpdate } from './types';
import { convertPage } from './lib/tesseractConverter';
import assert from './lib/assert';

interface RecognizeOptions {
  logger: (update: RecognizeUpdate) => void;
  rectangle?: Rectangle;
  PSM?: string;
}

export async function test() {
  const response = await ipcRenderer.invoke('ocr', 'list');

  console.log(response);
}

export async function recognize(docs: OcrDocument[], langs?: string, options?: RecognizeOptions): Promise<Page[]> {
  // const tesseract = spawn('C:/02 - Applications/tesseract/tesseract.exe', ['--list-langs']);
  //
  // tesseract.stdout.on('data', (data: string) => {
  //   console.log(`stdout: ${data}`);
  // });
  //
  // tesseract.stderr.on('data', (data: string) => {
  //   console.error(`stderr: ${data}`);
  // });
  //
  // tesseract.on('close', (code: string) => {
  //   console.log(`child process exited with code ${code}`);
  // });
  //
  // const { logger, rectangle, PSM } = options ?? {};
  //
  // const recognizeOpts = rectangle ? { rectangle } : {};
  //
  // // const results = await Promise.all(
  // //   docs.map((doc) => {
  // //     assert(doc.pageImage, 'Expected document %s to have an image.', doc.id);
  // //
  // //     return scheduler.addJob('recognize', doc.pageImage?.urlObject, recognizeOpts, `recog-${doc.id}`) as Promise<
  // //       RecognizeResult
  // //     >;
  // //   }),
  // // );
  // //
  // // return results.map((result, i) => {
  // //   const pageImage = docs[i].pageImage;
  // //
  // //   assert(pageImage, 'Expected document %s to have an image.', docs[i].id);
  // //
  // //   return convertPage(result.data, pageImage);
  // // });

  return [];
}
