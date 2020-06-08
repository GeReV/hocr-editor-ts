import { RecognizeResult } from 'tesseract.js';
import { DocumentTreeItem, ItemId, PageImage, RecognizeUpdate } from '../types';
import { TreeDestinationPosition, TreeSourcePosition } from '../components/SortableTree';
import * as actions from './actions';

export type TreeItems = Record<ItemId, DocumentTreeItem>;

export interface OcrDocument {
  id: number;
  isProcessing: boolean;
  filename: string;
  pageImage: PageImage;
  tree: {
    rootId: ItemId;
    items: TreeItems;
  } | null;
}

export interface State {
  documents: OcrDocument[];
  currentDocument: number;
  selectedId: ItemId | null;
  hoveredId: ItemId | null;
  lastRecognizeUpdate: RecognizeUpdate | null;
}

export enum ActionType {
  UpdateTree = 'UpdateTree',
  UpdateTreeNodeRect = 'UpdateTreeNodeRect',
  AddDocument = 'AddDocument',
  RecognizeDocument = 'RecognizeDocument',
  SelectDocument = 'SelectDocument',
  ChangeDocumentIsProcessing = 'ChangeDocumentIsProcessing',
  ChangeSelected = 'ChangeSelected',
  ChangeHovered = 'ChangeHovered',
  ModifyNode = 'ModifyNode',
  DeleteNode = 'DeleteNode',
  MoveNode = 'MoveNode',
  LogUpdate = 'LogUpdate',
}

export interface AddDocumentPayload {
  filename: string;
  pageImage: PageImage;
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

export interface CreateRecognizeDocumentPayload {
  id: number;
  result: RecognizeResult;
}

export interface ChangeDocumentIsProcessingPayload {
  id: number;
  isProcessing: boolean;
}

type Actions = typeof actions;

export type AppReducerAction = ReturnType<Actions[keyof Actions]>;
