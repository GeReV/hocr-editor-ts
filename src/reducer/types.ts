

import { Page, DocumentTreeItem, ItemId, PageImage, RecognizeUpdate } from '../types';
import { TreeDestinationPosition, TreeSourcePosition } from '../components/SortableTree';
import * as actions from './actions';
import { IRect } from 'konva/types/types';

export type TreeItems = Record<ItemId, DocumentTreeItem>;

export type Tree = {
  rootId: ItemId;
  items: TreeItems;
};

export interface Options {
  autoResizeNodes: boolean;
  autoDeleteEmptyNodes: boolean;
}

export interface OcrDocument {
  id: number;
  isProcessing: boolean;
  name: string;
  width: number;
  height: number;
  pageImage: PageImage | null;
  tree: Tree | null;
}

export interface State {
  snapshots: Omit<State, 'snapshots' | 'currentSnapshot'>[];
  currentSnapshot: number;
  documents: OcrDocument[];
  currentDocument: number;
  selectedId: ItemId | null;
  isDrawing: boolean;
  drawRect: IRect;
  lastRecognizeUpdate: RecognizeUpdate | null;
  options: Options;
}

export enum ActionType {
  UpdateTree = 'UpdateTree',
  UpdateTreeNodeRect = 'UpdateTreeNodeRect',
  AddDocument = 'AddDocument',
  SetDocumentImage = 'SetDocumentImage',
  OpenDocument = 'OpenDocument',
  RecognizeDocument = 'RecognizeDocument',
  RecognizeRegion = 'RecognizeRegion',
  SelectDocument = 'SelectDocument',
  ChangeDocumentIsProcessing = 'ChangeDocumentIsProcessing',
  ChangeSelected = 'ChangeSelected',
  ModifyNode = 'ModifyNode',
  DeleteNode = 'DeleteNode',
  MoveNode = 'MoveNode',
  LogUpdate = 'LogUpdate',

  SetIsDrawing = 'SetIsDrawing',
  SetDrawRect = 'SetDrawRect',

  ChangeOptions = 'ChangeOptions',

  Undo = 'Undo',
  Redo = 'Redo',
}

export interface AddDocumentPayload {
  filename: string;
  pageImage: PageImage;
}

export interface SetDocumentImagePayload {
  documentId: number;
  pageImage: PageImage;
}

export interface OpenDocumentPayload {
  name: string;
  pageImage: PageImage | null;
  page: Page | null;
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
  result: Page;
}

export interface ChangeDocumentIsProcessingPayload {
  id: number;
  isProcessing: boolean;
}

type Actions = typeof actions;

export type AppReducerAction = ReturnType<Actions[keyof Actions]>;
