import { TreeItem } from "react-sortable-tree";
import { Word, Line, Paragraph, Block, Symbol, Bbox } from "tesseract.js";

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
  Block,
  Paragraph,
  Line,
  Word,
  Symbol,
}

export interface BaseTreeItem<T extends ElementType, V, C extends BaseTreeItem<ElementType, any, any>> extends TreeItem {
  id: number;
  type: T;
  value: V;
  parent: BaseTreeItem<ElementType, any, any> | null;
  parentRelativeOffset: Position,
  children?: C[];
}

export type SymbolTreeItem = BaseTreeItem<ElementType.Symbol, Symbol, BaseTreeItem<ElementType, any, any>>
export type WordTreeItem = BaseTreeItem<ElementType.Word, Word, SymbolTreeItem>;
export type LineTreeItem = BaseTreeItem<
  ElementType.Line,
  Line,
  WordTreeItem
>;
export type ParagraphTreeItem = BaseTreeItem<
  ElementType.Paragraph,
  Paragraph,
  LineTreeItem
>;
export type BlockTreeItem = BaseTreeItem<
  ElementType.Block,
  Block,
  ParagraphTreeItem
>;

export type PageTreeItem =
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