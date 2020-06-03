import { RecognizeResult } from "tesseract.js";
import { ChangeCallbackParams } from "../components/PageCanvas/Block";
import { DocumentTreeItem, ItemId, PageImage } from "../types";
import { TreeDestinationPosition, TreeSourcePosition } from "../components/SortableTree";

export type TreeItems = Record<ItemId, DocumentTreeItem>;

export interface OcrDocument {
  id: number;
  progress: number;
  pageImage: PageImage;
  tree: {
    rootId: ItemId;
    items: TreeItems;
  } | null;
}

export interface State {
  documents: OcrDocument[];
  currentDocument: number;
  isProcessing: boolean;
  selectedId: ItemId | null;
  hoveredId: ItemId | null;
}

export enum ActionType {
  UpdateTree = 'UpdateTree',
  UpdateTreeNodeRect = 'UpdateTreeNodeRect',
  AddDocument = 'AddDocument',
  RecognizeDocument = 'RecognizeDocument',
  RecognizeDocumentProgress = 'RecognizeDocumentProgress',
  SelectDocument = 'SelectDocument',
  ChangeSelected = 'ChangeSelected',
  ChangeHovered = 'ChangeHovered',
  ModifyNode = 'ModifyNode',
  DeleteNode = 'DeleteNode',
  MoveNode = 'MoveNode',
  ChangeIsProcessing = 'ChangeIsProcessing',
}

export interface MoveNodeParams {
  source: TreeSourcePosition;
  destination: TreeDestinationPosition;
}

export interface ModifyNodeChanges {
  isExpanded?: boolean;
  text?: string;
}

export interface ModifyNodePayload {
  itemId: ItemId;
  changes: ModifyNodeChanges;
}

export type Action<T extends string, P = void> = { type: T, payload: P };

export type AppReducerAction =
  Action<ActionType.AddDocument, PageImage> |
  Action<ActionType.RecognizeDocument, CreateRecognizeDocumentPayload> |
  Action<ActionType.RecognizeDocumentProgress, CreateRecognizeProgressPayload> |
  // Action<ActionType.UpdateTree, BlockTreeItem[]> |
  Action<ActionType.UpdateTreeNodeRect, ChangeCallbackParams> |
  Action<ActionType.SelectDocument, number> |
  Action<ActionType.ChangeSelected, ItemId | null> |
  Action<ActionType.ChangeHovered, ItemId | null> |
  Action<ActionType.ChangeIsProcessing, boolean> |
  Action<ActionType.ModifyNode, ModifyNodePayload> |
  Action<ActionType.DeleteNode, ItemId> |
  Action<ActionType.MoveNode, MoveNodeParams>;

export interface CreateRecognizeDocumentPayload {
  id: number;
  result: RecognizeResult;
}

export interface CreateRecognizeProgressPayload {
  id: number;
  progress: number;
}