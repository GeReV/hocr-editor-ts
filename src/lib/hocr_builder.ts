import { Baseline, Bbox, Block, Line, Page, Paragraph, Word } from "tesseract.js";
import { BlockType } from "../types";

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

function baseline(bl: Baseline, bbox: Bbox): string {
  // Offset is (probably) the difference between bottom of bbox and bottom of baseline 
  const offset = bbox.y1 - Math.max(bl.y0, bl.y1);
  
  // The angle of the baseline diagonal going from (x0, y0) to (x1, y1).
  const angle = Math.atan2(bl.y1 - bl.y0, bl.x1 - bl.x0);
  
  return `baseline ${truncateRound(angle, 3)} ${offset}`;
}

function fontSize(fs: number) {
  return `x_fsize ${fs}`;
}

function confidence(conf: number) {
  return `x_wconf ${conf}`;
}

function direction(isLtr: boolean) {
  return isLtr ? 'ltr' : 'rtl';
}

function createElement<K extends keyof HTMLElementTagNameMap>(doc: Document, tagName: K, attrs: Record<string, string | boolean | number>): HTMLElementTagNameMap[K] {
  const el: HTMLElementTagNameMap[K] = doc.createElement<K>(tagName);

  Object.entries(attrs)
    .forEach(([key, value]) => {
      const v = typeof value === "boolean" ? key : value.toString();

      el.setAttribute(key, v);
    });

  return el;
}

function createPageElement(doc: Document, page: Page, size: Size) {
  const title = [
    `image ""`,
    `bbox 0 0 ${size.width} ${size.height}`,
    `ppageno 0`,
  ].join('; ');
  
  return createElement(doc, 'div', {
    title,
    'class': 'ocr_page',
  });
}

function createBlockElement(doc: Document, block: Block) {
  return createElement(doc, 'div', {
    title: bbox(block.bbox),
    'class': block.blocktype === BlockType.FLOWING_IMAGE || block.blocktype === BlockType.PULLOUT_IMAGE ? 'ocr_graphic' : 'ocr_carea',
  });
}

function createParagraphElement(doc: Document, para: Paragraph) {
  return createElement(doc, 'p', {
    title: bbox(para.bbox),
    'class': 'ocr_par',
    dir: direction(para.is_ltr),
  });
}

function createLineElement(doc: Document, line: Line) {
  const title = [
    baseline(line.baseline, line.bbox),
    bbox(line.bbox),
  ].join('; ');
  
  return createElement(doc, 'span', {
    title,
    'class': 'ocr_line',
  });
}

function createWordElement(doc: Document, word: Word) {
  const title = [
    bbox(word.bbox),
    fontSize(word.font_size),
    confidence(word.confidence)
  ].join('; ');

  return createElement(doc, 'span', {
    title,
    'class': 'ocrx_word',
    lang: word.language,
  });
}

function buildHocrHead(doc: Document, page: Page) {
  doc.head.appendChild(createElement(doc, 'meta', { charset: 'utf-8' }));
  doc.head.appendChild(createElement(doc, 'meta', { name: 'ocr-system', value: `tesseract ${page.version}` }));
  doc.head.appendChild(createElement(doc, 'meta', {
    name: 'ocr-capabilities',
    value: [
      Capabilities.OcrPage,
      Capabilities.OcrCarea,
      Capabilities.OcrParagraph,
      Capabilities.OcrLine,
      Capabilities.OcrWord
    ].join(' '),
  }));
}

function buildHocrBody(doc: Document, page: Page, size: Size) {
  const el = createPageElement(doc, page, size);
  
  for (const block of page.blocks) {
    const b = createBlockElement(doc, block);

    for (const paragraph of block.paragraphs) {
      const p = createParagraphElement(doc, paragraph);

      for (const line of paragraph.lines) {
        const l = createLineElement(doc, line);

        for (const word of line.words) {
          const w = createWordElement(doc, word);
          
          l.appendChild(w);
        }
        
        p.appendChild(l);
      }
      
      b.appendChild(p);
    }
    
    el.appendChild(b);
  }
  
  doc.body.appendChild(el);
}

export default function buildHocrDocument(page: Page, size: Size): Document {
  const doc = document.implementation.createHTMLDocument();

  buildHocrHead(doc, page);
  
  buildHocrBody(doc, page, size);
  
  return doc;
}