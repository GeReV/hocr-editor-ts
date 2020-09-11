import { ipcRenderer, IpcRendererEvent } from 'electron';

import { OcrDocument } from './reducer/types';
import { Page, RecognizeOptions } from './types';
import hocrParser from './lib/hocrParser';
import assert from './lib/assert';

export interface TesseractHocrRequestMessage {
  filename: string;
  langs: string;
}

export interface TesseractHocrResponseMessage {
  filename: string;
  hocr: string;
}

export const OCR_CHANNEL = 'ocr';

export async function recognize(docs: OcrDocument[], langs?: string, _options?: RecognizeOptions): Promise<Page[]> {
  const promises = docs.map((doc) => {
    assert(doc.pageImage, 'No image loaded for document %s.', doc.name);

    return new Promise<Page>((resolve) => {
      const listener = (event: IpcRendererEvent, message: TesseractHocrResponseMessage) => {
        if (message.filename !== doc.pageImage?.path) {
          return;
        }

        ipcRenderer.removeListener(OCR_CHANNEL, listener);

        resolve(hocrParser(message.hocr));
      };

      ipcRenderer.on(OCR_CHANNEL, listener);

      ipcRenderer.send(OCR_CHANNEL, {
        type: 'hocr',
        filename: doc.pageImage?.path,
        langs: langs ?? 'eng',
      });
    });
  });

  return Promise.all(promises);
}
