import { Baseline, Bbox, Block, Direction, Graphic, Line, Page, Paragraph, Word } from './types';
import assert from './assert';

function assertClassName(className: string, expected: string | string[]) {
  if (Array.isArray(expected)) {
    assert(
      expected.some((val) => val === className),
      'Expected element to have class name of one of: %s, received %s.',
      JSON.stringify(expected),
      className,
    );

    return;
  }

  assert(expected === className, 'Expected element to have class name of %s, received %s.', expected, className);
}

function parseAttrBbox(title: string): Bbox {
  const matches = title.match(/bbox ([0-9]+) ([0-9]+) ([0-9]+) ([0-9]+)/);

  if (!matches) {
    throw new Error('No bbox attribute found in title.');
  }

  return {
    x0: +matches[1],
    y0: +matches[2],
    x1: +matches[3],
    y1: +matches[4],
  };
}

function parseAttrImage(title: string): string {
  const matches = title.match(/image '(.*?)'/);

  if (!matches) {
    throw new Error('No image attribute found in title.');
  }

  return matches[1];
}

function parseNumberAttribute(title: string, name: string): number | null {
  const matches = title.match(new RegExp(`${name} (-?[0-9]+(?:\\.[0-9]+)?)`));

  if (!matches) {
    return null;
  }

  return parseFloat(matches[1]);
}

const parseAttrRotation = (title: string): number => parseNumberAttribute(title, 'rot') ?? 0;

const parseAttrResolution = (title: string): number | null => parseNumberAttribute(title, 'res') ?? 0;

const parseAttrPageNumber = (title: string): number => parseNumberAttribute(title, 'ppageno') ?? 1;

const parseAttrAscenders = (title: string): number | null => parseNumberAttribute(title, 'x_ascenders');

const parseAttrDescenders = (title: string): number | null => parseNumberAttribute(title, 'x_descenders');

const parseAttrLineSize = (title: string): number | null => parseNumberAttribute(title, 'x_size');

const parseAttrWordSize = (title: string): number | null => parseNumberAttribute(title, 'x_fsize');

const parseAttrConfidence = (title: string): number | null => parseNumberAttribute(title, 'x_wconf');

function parseAttrBaseline(title: string): Baseline | null {
  const matches = title.match(/baseline (-?[0-9]+(?:\.[0-9]+)?) (-?[0-9]+(?:\.[0-9]+)?)/);

  if (!matches) {
    return null;
  }

  return [parseFloat(matches[1]), parseFloat(matches[2])];
}

function parseWord(element: Element): Word {
  assertClassName(element.className, 'ocrx_word');

  const title = element.getAttribute('title') ?? '';

  return {
    type: 'word',
    id: element.getAttribute('id') ?? '',
    bbox: parseAttrBbox(title),
    size: parseAttrWordSize(title),
    confidence: parseAttrConfidence(title),
    language: element.getAttribute('lang') ?? '',
    text: element.textContent ?? '',
  };
}

function parseLine(element: Element): Line {
  assertClassName(element.className, ['ocr_line', 'ocr_caption', 'ocr_textfloat']);

  const title = element.getAttribute('title') ?? '';

  let type: 'line' | 'caption' | 'textfloat' = 'line';

  if (element.className === 'ocr_caption') {
    type = 'caption';
  }

  if (element.className === 'ocr_textfloat') {
    type = 'textfloat';
  }

  return {
    type,
    id: element.getAttribute('id') ?? '',
    bbox: parseAttrBbox(title),
    ascenders: parseAttrAscenders(title),
    descenders: parseAttrDescenders(title),
    size: parseAttrLineSize(title),
    baseline: parseAttrBaseline(title),
    children: Array.from(element.children).map(parseWord),
  };
}

function parseParagraph(element: Element): Paragraph {
  assertClassName(element.className, 'ocr_par');

  const title = element.getAttribute('title') ?? '';

  return {
    type: 'paragraph',
    id: element.getAttribute('id') ?? '',
    bbox: parseAttrBbox(title),
    direction: element.getAttribute('dir') === 'rtl' ? Direction.Rtl : Direction.Ltr,
    children: Array.from(element.children).map(parseLine),
  };
}

function parseBlock(element: Element): Block | Graphic {
  assertClassName(element.className, ['ocr_carea', 'ocr_graphic']);

  const title = element.getAttribute('title') ?? '';

  const id = element.getAttribute('id') ?? '';
  const bbox = parseAttrBbox(title);

  if (element.className === 'ocr_graphic') {
    return {
      type: 'graphic',
      id,
      bbox,
    };
  }

  return {
    type: 'block',
    id,
    bbox,
    children: Array.from(element.children).map(parseParagraph),
  };
}

function parsePage(doc: Document): Page {
  const p = doc.querySelector('.ocr_page');

  if (!p) {
    throw new Error('Could not find an element with class "ocr_page".');
  }

  const title = p.getAttribute('title') ?? '';

  return {
    type: 'page',
    id: p.getAttribute('id') ?? '',
    title: doc.title,
    image: parseAttrImage(title),
    page_number: parseAttrPageNumber(title),
    rotation: parseAttrRotation(title),
    bbox: parseAttrBbox(title),
    resolution: parseAttrResolution(title),
    version: doc.querySelector('meta[name="ocr-system"]')?.getAttribute('content') ?? '',
    children: Array.from(p.children).map(parseBlock),
  };
}

export default function hocrParser(hocr: string): Page {
  const doc = new DOMParser().parseFromString(hocr, 'text/html');

  return parsePage(doc);
}
