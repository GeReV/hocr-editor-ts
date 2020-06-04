import { createAction } from "@reduxjs/toolkit";
import { ChangeCallbackParams } from "../components/PageCanvas/Block";
import {
  ActionType,
  CreateRecognizeDocumentPayload,
  ChangeDocumentIsProcessingPayload,
  ModifyNodeChanges,
  ModifyNodePayload,
  MoveNodeParams
} from "./types";
import { ItemId, PageImage } from "../types";
import { RecognizeResult } from "tesseract.js";

export const createAddDocument = createAction<PageImage, ActionType.AddDocument>(ActionType.AddDocument);
export const createSelectDocument = createAction<number, ActionType.SelectDocument>(ActionType.SelectDocument);
export const createUpdateTreeNodeRect = createAction<ChangeCallbackParams, ActionType.UpdateTreeNodeRect>(ActionType.UpdateTreeNodeRect);
export const createChangeSelected = createAction<ItemId | null, ActionType.ChangeSelected>(ActionType.ChangeSelected);
export const createChangeHovered = createAction<ItemId | null, ActionType.ChangeHovered>(ActionType.ChangeHovered);
export const createChangeIsProcessing = createAction<(id: number, isProcessing: boolean) => { payload: ChangeDocumentIsProcessingPayload; }, ActionType.ChangeDocumentIsProcessing>(ActionType.ChangeDocumentIsProcessing, (id, isProcessing) => ({
  payload: {
    id,
    isProcessing
  }
}));
export const createDeleteNode = createAction<ItemId, ActionType.DeleteNode>(ActionType.DeleteNode);
export const createMoveNode = createAction<MoveNodeParams, ActionType.MoveNode>(ActionType.MoveNode);
export const createModifyNode = createAction<(itemId: ItemId, changes: ModifyNodeChanges) => { payload: ModifyNodePayload }, ActionType.ModifyNode>(
  ActionType.ModifyNode,
  (itemId, changes) => ({
    payload: {
      itemId,
      changes
    }
  }));
export const createRecognizeDocument = createAction<(id: number, result: RecognizeResult) => { payload: CreateRecognizeDocumentPayload }, ActionType.RecognizeDocument>(ActionType.RecognizeDocument, (id, result) => ({
  payload: {
    id,
    result
  }
}));