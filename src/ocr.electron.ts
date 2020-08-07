import { ipcRenderer } from 'electron';

import { OcrDocument } from './reducer/types';
import { Page, RecognizeOptions } from './types';
import hocrParser from './lib/hocrParser';
import assert from './lib/assert';

type TesseractListLanguagesMessage = {
  type: 'list';
};

type TesseractHocrMessage = {
  type: 'hocr';
  filename: string;
  langs: string;
};

export type TesseractMessage = TesseractListLanguagesMessage | TesseractHocrMessage;

function invokeTesseractMessage(message: TesseractMessage): Promise<any> {
  return ipcRenderer.invoke('ocr', message);
}

export async function recognize(docs: OcrDocument[], langs?: string, _options?: RecognizeOptions): Promise<Page[]> {
  const results = await Promise.all(
    docs.map((doc) => {
      assert(doc.pageImage, 'No image loaded for document %s.', doc.name);

      // TODO: Rectangle recognition
      return invokeTesseractMessage({
        type: 'hocr',
        filename: doc.pageImage?.path,
        langs: langs ?? 'eng',
      });
    }),
  );

  return results.map(hocrParser);
}
