import { RecognizeResult } from "tesseract.js";
import { ChangeCallbackParams } from "../components/PageCanvas/Block";
import { DocumentTreeItem, ItemId } from "../types";

export type TreeItems = Record<ItemId, DocumentTreeItem>;

export interface State {
  treeRootId: ItemId | null;
  treeItems: TreeItems;
  selectedId: ItemId | null;
  hoveredId: ItemId | null;
}

export enum ActionType {
  Init = 'Init',
  UpdateTree = 'UpdateTree',
  UpdateTreeNodeRect = 'UpdateTreeNodeRect',
  ChangeSelected = 'ChangeSelected',
  ChangeHovered = 'ChangeHovered',
  DeleteNode = 'DeleteNode',
  MoveNode = 'MoveNode',
}

export interface MoveNodeParams {
  nodeId: ItemId;
  nextParentId: ItemId | null;
  newIndex: number | null;
}

export type Action<T extends string, P = void> = { type: T, payload: P };

export type ReducerAction =
  Action<ActionType.Init, RecognizeResult> |
  // Action<ActionType.UpdateTree, BlockTreeItem[]> |
  Action<ActionType.UpdateTreeNodeRect, ChangeCallbackParams> |
  Action<ActionType.ChangeSelected, ItemId | null> |
  Action<ActionType.ChangeHovered, ItemId | null> |
  Action<ActionType.DeleteNode, ItemId> |
  Action<ActionType.MoveNode, MoveNodeParams>;