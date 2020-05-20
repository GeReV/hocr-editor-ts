import { Word, Line, Paragraph, Block, Symbol, Bbox, Page } from "tesseract.js";

export interface Position {
  x: number;
  y: number;
}

export interface PageImage {
  image: ImageBitmap;
  urlObject: string;
  thumbnailUrlObject: string;
}

export interface PageElement {
  bbox: Bbox;
}

export enum ElementType {
  Page,
  Block,
  Paragraph,
  Line,
  Word,
  Symbol,
}

export enum BlockType {
  CAPTION_TEXT = 'CAPTION_TEXT',
  FLOWING_IMAGE = 'FLOWING_IMAGE',
  FLOWING_TEXT = 'FLOWING_TEXT',
  HORZ_LINE = 'HORZ_LINE',
  PULLOUT_IMAGE = 'PULLOUT_IMAGE',
  PULLOUT_TEXT = 'PULLOUT_TEXT',
  VERT_LINE = 'VERT_LINE',
  VERTICAL_TEXT = 'VERTICAL_TEXT',
}

export type ItemId = string | number;

export interface BaseTreeItem<T extends ElementType, V> {
  id: ItemId;
  type: T;
  data: V;
  parentId: ItemId | null;
  parentRelativeOffset: Position,
  children: ItemId[];
  isExpanded: boolean;
}

export type PageTreeItem = BaseTreeItem<ElementType.Page, Page>;
export type BlockTreeItem = BaseTreeItem<ElementType.Block, Block>;
export type ParagraphTreeItem = BaseTreeItem<ElementType.Paragraph, Paragraph>;
export type LineTreeItem = BaseTreeItem<ElementType.Line, Line>;
export type WordTreeItem = BaseTreeItem<ElementType.Word, Word>;
export type SymbolTreeItem = BaseTreeItem<ElementType.Symbol, Symbol>;

export type DocumentTreeItem =
  | PageTreeItem
  | BlockTreeItem
  | ParagraphTreeItem
  | LineTreeItem
  | WordTreeItem
  | SymbolTreeItem;

export interface RecognizeUpdate {
  workerId: string;
  jobId?: string;
  status: string;
  progress: number;
}