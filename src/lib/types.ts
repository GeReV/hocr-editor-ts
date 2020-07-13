export type Baseline = [number, number];

export enum Direction {
  Ltr = 'ltr',
  Rtl = 'rtl',
}

export interface OcrElement<T extends string> {
  type: T;
  id: string;
  bbox: Bbox;
}

export interface OcrContainer<T extends string, C extends OcrElement<any>> extends OcrElement<T> {
  children: C[];
}

export interface Bbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Word extends OcrElement<'word'> {
  size: number | null;
  confidence: number | null;
  language: string;
  text: string;
}

export interface Line extends OcrContainer<'line' | 'caption' | 'textfloat', Word> {
  baseline: Baseline | null;
  ascenders: number | null;
  descenders: number | null;
  size: number | null;
}

export interface Paragraph extends OcrContainer<'paragraph', Line> {
  direction: Direction;
}

export interface Block extends OcrContainer<'block', Paragraph> {}

export interface Graphic extends OcrElement<'graphic'> {}

export interface Page extends OcrContainer<'page', Block | Graphic> {
  title: string;
  version: string;
  page_number: number;
  image: string | null;
  resolution: number | null;
  rotation: number;
}
