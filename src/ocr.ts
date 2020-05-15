import tesseract, { ImageLike, RecognizeResult } from 'tesseract.js';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : DeepPartial<T[P]>
};

interface RecognizeOptions {
  PSM?: string;
  logger?: (arg: any) => void,
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

export async function recognize(image: ImageLike, langs?: string, options?: RecognizeOptions): Promise<RecognizeResult> {
  const stored = localStorage.getItem('OCR');

  if (stored) {
    return JSON.parse(stored) as RecognizeResult;
  }

  const worker = tesseract.createWorker({
    logger: options?.logger,
  });

  await worker.load();
  await worker.loadLanguage(langs ?? 'eng');
  await worker.initialize(langs ?? 'eng');
  // @ts-ignore
  await worker.setParameters({ tessedit_pageseg_mode: options?.PSM ?? '3' })

  const recog = await worker.recognize(image);


  await worker.terminate();

  console.debug(recog);

  const decirc = decircularize(recog);

  localStorage.setItem('OCR', JSON.stringify(decirc));

  return recog;
}