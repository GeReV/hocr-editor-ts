import { Patch } from 'immer/compat/pre-3.7/dist/immer';
import { IRect } from 'konva/types/types';
import { Page, DocumentTreeItem, ItemId, PageImage, RecognizeUpdate } from '../types';
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

interface Changeset {
  changes: Patch[];
  inverseChanges: Patch[];
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
}

export enum ActionType {
  UpdateTree = 'UpdateTree',
  UpdateTreeNodeRect = 'UpdateTreeNodeRect',
  AddDocument = 'AddDocument',
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

  Undo = 'Undo',
  Redo = 'Redo',
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
  result: Page;
}

export interface ChangeDocumentIsProcessingPayload {
  id: number;
  isProcessing: boolean;
}

type Actions = typeof actions;

export type AppReducerAction = ReturnType<Actions[keyof Actions]>;
