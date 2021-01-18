


import { ChangeCallbackParams } from '../components/PageCanvas/Block';
import { ItemId, Page, PageImage, RecognizeUpdate } from '../types';
import {
  ActionType,
  AddDocumentPayload,
  ChangeDocumentIsProcessingPayload,
  CreateRecognizeDocumentPayload,
  ModifyNodeChanges,
  ModifyNodePayload,
  MoveNodeParams,
  OpenDocumentPayload,
  Options,
  SetDocumentImagePayload,
} from './types';
import { createAction } from '@reduxjs/toolkit';
import { IRect } from 'konva/types/types';

export const createAddDocument = createAction<
  (filename: string, pageImage: PageImage) => { payload: AddDocumentPayload },
  ActionType.AddDocument
>(ActionType.AddDocument, (filename, pageImage) => ({
  payload: {
    filename,
    pageImage,
  },
}));

export const createSetDocumentImage = createAction<
  (documentId: number, pageImage: PageImage) => { payload: SetDocumentImagePayload },
  ActionType.SetDocumentImage
>(ActionType.SetDocumentImage, (documentId, pageImage) => ({
  payload: {
    documentId,
    pageImage,
  },
}));

export const createOpenDocument = createAction<
  (filename: string, pageImage: PageImage | null, page: Page | null) => { payload: OpenDocumentPayload },
  ActionType.OpenDocument
>(ActionType.OpenDocument, (name, pageImage, page) => ({
  payload: {
    name,
    pageImage,
    page,
  },
}));

export const createSelectDocument = createAction<string, ActionType.SelectDocument>(ActionType.SelectDocument);
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

const buildRecognizePayload = (id: number, result: Page): { payload: CreateRecognizeDocumentPayload } => ({
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

export const createSetIsDrawing = createAction<boolean, ActionType.SetIsDrawing>(ActionType.SetIsDrawing);
export const createSetDrawRect = createAction<IRect, ActionType.SetDrawRect>(ActionType.SetDrawRect);

export const createChangeOptions = createAction<Partial<Options>, ActionType.ChangeOptions>(ActionType.ChangeOptions);

export const createUndo = createAction<void, ActionType.Undo>(ActionType.Undo);
export const createRedo = createAction<void, ActionType.Redo>(ActionType.Redo);
