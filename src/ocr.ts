import tesseract, { RecognizeResult } from 'tesseract.js';
import { OcrDocument } from "./reducer/types";
import { RecognizeUpdate } from "./types";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : DeepPartial<T[P]>
};

interface RecognizeOptions {
  PSM?: string;
}

function decircularize(recog: RecognizeResult): DeepPartial<RecognizeResult> {
  const partial: DeepPartial<RecognizeResult> = recog;

  partial.data = {
    ...partial.data,
    lines: [],
    paragraphs: [],
    words: [],
    symbols: [],
    blocks: partial.data?.blocks?.map(block => {
      return {
        ...block,
        page: undefined,
        lines: [],
        words: [],
        symbols: [],
        paragraphs: block.paragraphs?.map(para => {
          return {
            ...para,
            page: undefined,
            block: undefined,
            words: [],
            symbols: [],
            lines: para.lines?.map(line => {
              return {
                ...line,
                page: undefined,
                block: undefined,
                paragraph: undefined,
                words: line.words?.map(word => {
                  return {
                    ...word,
                    page: undefined,
                    block: undefined,
                    paragraph: undefined,
                    line: undefined,
                    symbols: []
                  };
                }),
              };
            }),
          };
        }),
      };
    }),
  }

  return partial;
}

export async function recognize(docs: OcrDocument[], langs?: string, options?: RecognizeOptions): Promise<RecognizeResult[]> {
  // const stored = localStorage.getItem('OCR');
  //
  // if (stored) {
  //   return JSON.parse(stored) as RecognizeResult;
  // }

  const scheduler = tesseract.createScheduler();
  
  const workers = Array(2).fill(0).map(() => tesseract.createWorker({
    logger: (update: RecognizeUpdate) => {
      console.debug(update);
    },
  }));
  
  for (const worker of workers) {
    await worker.load();
    await worker.loadLanguage(langs ?? 'eng');
    await worker.initialize(langs ?? 'eng');
    // @ts-ignore
    await worker.setParameters({ tessedit_pageseg_mode: options?.PSM ?? '3' })

    scheduler.addWorker(worker);
  }

  const results = await Promise.all(
    docs.map(doc => scheduler.addJob('recognize', doc.pageImage.urlObject, {}, `recog-${doc.id}`) as Promise<RecognizeResult>)
  );
  
  await scheduler.terminate();

  // const decirc = decircularize(recog);

  // localStorage.setItem('OCR', JSON.stringify(decirc));

  return results;
}