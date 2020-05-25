import { createAction } from "@reduxjs/toolkit";
import { RecognizeResult } from "tesseract.js";
import { ChangeCallbackParams } from "../components/PageCanvas/Block";
import { ActionType, ModifyNodeChanges, ModifyNodePayload, MoveNodeParams } from "./types";
import { ItemId, PageImage } from "../types";

export const createRecognizeDocument = createAction<RecognizeResult, ActionType.RecognizeDocument>(ActionType.RecognizeDocument);
export const createAddDocument = createAction<PageImage, ActionType.AddDocument>(ActionType.AddDocument);
export const createSelectDocument = createAction<number, ActionType.SelectDocument>(ActionType.SelectDocument);
export const createUpdateTreeNodeRect = createAction<ChangeCallbackParams, ActionType.UpdateTreeNodeRect>(ActionType.UpdateTreeNodeRect);
export const createChangeSelected = createAction<ItemId | null, ActionType.ChangeSelected>(ActionType.ChangeSelected);
export const createChangeHovered = createAction<ItemId | null, ActionType.ChangeHovered>(ActionType.ChangeHovered);
export const createModifyNode = createAction<(itemId: ItemId, changes: ModifyNodeChanges) => { payload: ModifyNodePayload }, ActionType.ModifyNode>(
  ActionType.ModifyNode,
  (itemId, changes) => ({
    payload: {
      itemId,
      changes
    }
  }));
export const createDeleteNode = createAction<ItemId, ActionType.DeleteNode>(ActionType.DeleteNode);
export const createMoveNode = createAction<MoveNodeParams, ActionType.MoveNode>(ActionType.MoveNode);