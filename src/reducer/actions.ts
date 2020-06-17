import { createAction } from '@reduxjs/toolkit';
import { RecognizeResult } from 'tesseract.js';
import { ChangeCallbackParams } from '../components/PageCanvas/Block';
import { ItemId, PageImage, RecognizeUpdate } from '../types';
import {
  ActionType,
  CreateRecognizeDocumentPayload,
  ChangeDocumentIsProcessingPayload,
  ModifyNodeChanges,
  ModifyNodePayload,
  MoveNodeParams,
  AddDocumentPayload,
} from './types';

export const createAddDocument = createAction<
  (filename: string, pageImage: PageImage) => { payload: AddDocumentPayload },
  ActionType.AddDocument
>(ActionType.AddDocument, (filename, pageImage) => ({
  payload: {
    filename,
    pageImage,
  },
}));
export const createSelectDocument = createAction<number, ActionType.SelectDocument>(ActionType.SelectDocument);
export const createUpdateTreeNodeRect = createAction<ChangeCallbackParams, ActionType.UpdateTreeNodeRect>(
  ActionType.UpdateTreeNodeRect,
);
export const createChangeSelected = createAction<ItemId | null, ActionType.ChangeSelected>(ActionType.ChangeSelected);
export const createChangeIsProcessing = createAction<
  (id: number, isProcessing: boolean) => { payload: ChangeDocumentIsProcessingPayload },
  ActionType.ChangeDocumentIsProcessing
>(ActionType.ChangeDocumentIsProcessing, (id, isProcessing) => ({
  payload: {
    id,
    isProcessing,
  },
}));
export const createDeleteNode = createAction<ItemId, ActionType.DeleteNode>(ActionType.DeleteNode);
export const createMoveNode = createAction<MoveNodeParams, ActionType.MoveNode>(ActionType.MoveNode);
export const createModifyNode = createAction<
  (itemId: ItemId, changes: ModifyNodeChanges) => { payload: ModifyNodePayload },
  ActionType.ModifyNode
>(ActionType.ModifyNode, (itemId, changes) => ({
  payload: {
    itemId,
    changes,
  },
}));

const buildRecognizePayload = (id: number, result: RecognizeResult): { payload: CreateRecognizeDocumentPayload } => ({
  payload: {
    id,
    result,
  },
});
export const createRecognizeDocument = createAction<typeof buildRecognizePayload, ActionType.RecognizeDocument>(
  ActionType.RecognizeDocument,
  buildRecognizePayload,
);
export const createRecognizeRegion = createAction<typeof buildRecognizePayload, ActionType.RecognizeRegion>(
  ActionType.RecognizeRegion,
  buildRecognizePayload,
);

export const createLogUpdate = createAction<RecognizeUpdate | null, ActionType.LogUpdate>(ActionType.LogUpdate);

export const createUndo = createAction<void, ActionType.Undo>(ActionType.Undo);
export const createRedo = createAction<void, ActionType.Redo>(ActionType.Redo);
