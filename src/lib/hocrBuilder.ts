import { Baseline, Bbox, Block, Line, Page, Paragraph, Word, Graphic } from '../types';

interface Size {
  width: number;
  height: number;
}

enum Capabilities {
  OcrPage = 'ocr_page',
  OcrCarea = 'ocr_carea',
  OcrParagraph = 'ocr_par',
  OcrLine = 'ocr_line',
  OcrWord = 'ocrx_word',
}

function truncateRound(n: number, digits: number): string {
  const power = 10 ** digits;

  return String(Math.round(n * power) / power);
}

function bbox(bbox: Bbox): string {
  return `bbox ${bbox.x0} ${bbox.y0} ${bbox.x1} ${bbox.y1}`;
}

function baseline(bl: Baseline): string {
  // Offset is (probably) the difference between bottom of bbox and bottom of baseline
  return `baseline ${truncateRound(bl[0], 3)} ${bl[1]}`;
}

function fontSize(fs: number) {
  return `x_size ${fs}`;
}

function confidence(conf: number) {
  return `x_wconf ${Math.round(conf)}`;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tagName: K,
  attrs: Record<string, string | boolean | number>,
): HTMLElementTagNameMap[K] {
  const el: HTMLElementTagNameMap[K] = doc.createElement<K>(tagName);

  Object.entries(attrs).forEach(([key, value]) => {
    const v = typeof value === 'boolean' ? key : value.toString();

    el.setAttribute(key, v);
  });

  return el;
}

function createPageElement(doc: Document, page: Page, size: Size, filename: string) {
  const title = [`image '${filename}'`, `bbox 0 0 ${size.width} ${size.height}`, 'ppageno 0'].join('; ');

  return createElement(doc, 'div', {
    title,
    class: 'ocr_page',
  });
}

function createBlockElement(doc: Document, block: Block | Graphic) {
  return createElement(doc, 'div', {
    title: bbox(block.bbox),
    class: block.type === 'graphic' ? 'ocr_graphic' : 'ocr_carea',
  });
}

function createParagraphElement(doc: Document, para: Paragraph) {
  return createElement(doc, 'p', {
    title: bbox(para.bbox),
    class: 'ocr_par',
    dir: para.direction,
  });
}

function createLineElement(doc: Document, line: Line) {
  const title = [line.baseline && baseline(line.baseline), bbox(line.bbox)].filter(Boolean).join('; ');

  return createElement(doc, 'span', {
    title,
    class: 'ocr_line',
  });
}

function createWordElement(doc: Document, word: Word) {
  const title = [bbox(word.bbox), word.size && fontSize(word.size), word.confidence && confidence(word.confidence)]
    .filter(Boolean)
    .join('; ');

  const el = createElement(doc, 'span', {
    title,
    class: 'ocrx_word',
    lang: word.language,
  });

  el.textContent = word.text ?? ' ';

  return el;
}

function buildHocrHead(doc: Document, page: Page) {
  doc.head.appendChild(createElement(doc, 'meta', { charset: 'utf-8' }));
  doc.head.appendChild(createElement(doc, 'meta', { name: 'ocr-system', value: `tesseract ${page.version}` }));
  doc.head.appendChild(
    createElement(doc, 'meta', {
      name: 'ocr-capabilities',
      value: [
        Capabilities.OcrPage,
        Capabilities.OcrCarea,
        Capabilities.OcrParagraph,
        Capabilities.OcrLine,
        Capabilities.OcrWord,
      ].join(' '),
    }),
  );
}

function buildHocrBody(doc: Document, page: Page, size: Size, filename: string) {
  const el = createPageElement(doc, page, size, filename);

  for (const block of page.children) {
    const b = createBlockElement(doc, block);

    if (block.type === 'block') {
      for (const paragraph of block.children) {
        const p = createParagraphElement(doc, paragraph);

        for (const line of paragraph.children) {
          const l = createLineElement(doc, line);

          for (const word of line.children) {
            const w = createWordElement(doc, word);

            l.appendChild(w);
          }

          p.appendChild(l);
        }

        b.appendChild(p);
      }
    }

    el.appendChild(b);
  }

  doc.body.appendChild(el);
}

export default function buildHocrDocument(page: Page, size: Size, filename: string): Document {
  const doc = document.implementation.createHTMLDocument();

  buildHocrHead(doc, page);

  buildHocrBody(doc, page, size, filename);

  return doc;
}
