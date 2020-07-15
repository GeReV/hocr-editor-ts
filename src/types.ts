export interface Position {
  x: number;
  y: number;
}

export interface PageImage {
  width: number;
  height: number;
  urlObject: string;
  thumbnailUrlObject: string;
}

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

export enum ElementType {
  Page,
  Block,
  Graphic,
  Paragraph,
  Line,
  Word,
}

export enum BlockType {
  CAPTION_TEXT = 'CAPTION_TEXT',
  FLOWING_IMAGE = 'FLOWING_IMAGE',
  FLOWING_TEXT = 'FLOWING_TEXT',
  HEADING_IMAGE = 'HEADING_IMAGE',
  HORZ_LINE = 'HORZ_LINE',
  PULLOUT_IMAGE = 'PULLOUT_IMAGE',
  PULLOUT_TEXT = 'PULLOUT_TEXT',
  VERT_LINE = 'VERT_LINE',
  VERTICAL_TEXT = 'VERTICAL_TEXT',
}

export type ItemId = string | number;

export interface BaseTreeItem<T extends ElementType, V extends OcrElement<any>> {
  id: ItemId;
  type: T;
  data: V;
  parentId: ItemId | null;
  parentRelativeOffset: Position;
  children: ItemId[];
  isExpanded: boolean;
}

export type PageTreeItem = BaseTreeItem<ElementType.Page, Page>;
export type BlockTreeItem = BaseTreeItem<ElementType.Block, Block>;
export type GraphicTreeItem = BaseTreeItem<ElementType.Graphic, Graphic>;
export type ParagraphTreeItem = BaseTreeItem<ElementType.Paragraph, Paragraph>;
export type LineTreeItem = BaseTreeItem<ElementType.Line, Line>;
export type WordTreeItem = BaseTreeItem<ElementType.Word, Word>;

export type DocumentTreeItem =
  | PageTreeItem
  | BlockTreeItem
  | GraphicTreeItem
  | ParagraphTreeItem
  | LineTreeItem
  | WordTreeItem;

export interface RecognizeUpdate {
  workerId: string;
  jobId?: string;
  status: string;
  progress: number;
}
