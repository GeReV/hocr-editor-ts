import { RecognizeResult } from "tesseract.js";
import { ChangeCallbackParams } from "../components/PageCanvas/Block";
import { DocumentTreeItem, ItemId } from "../types";
import { TreeDestinationPosition, TreeSourcePosition } from "../components/SortableTree";

export type TreeItems = Record<ItemId, DocumentTreeItem>;

export interface State {
  tree: {
    rootId: ItemId;
    items: TreeItems;
  } | null
  selectedId: ItemId | null;
  hoveredId: ItemId | null;
}

export enum ActionType {
  Init = 'Init',
  UpdateTree = 'UpdateTree',
  UpdateTreeNodeRect = 'UpdateTreeNodeRect',
  ChangeSelected = 'ChangeSelected',
  ChangeHovered = 'ChangeHovered',
  ModifyNode = 'ModifyNode',
  DeleteNode = 'DeleteNode',
  MoveNode = 'MoveNode',
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

export type ReducerAction =
  Action<ActionType.Init, RecognizeResult> |
  // Action<ActionType.UpdateTree, BlockTreeItem[]> |
  Action<ActionType.UpdateTreeNodeRect, ChangeCallbackParams> |
  Action<ActionType.ChangeSelected, ItemId | null> |
  Action<ActionType.ChangeHovered, ItemId | null> |
  Action<ActionType.ModifyNode, ModifyNodePayload> |
  Action<ActionType.DeleteNode, ItemId> |
  Action<ActionType.MoveNode, MoveNodeParams>;