import { RecognizeResult } from "tesseract.js";
import { ChangeCallbackParams } from "../components/PageCanvas/Block";
import { BaseTreeItem, ElementType } from "../types";

export type TreeMap = { [id: number]: BaseTreeItem<ElementType, any> };

export interface State {
  tree: number[];
  treeMap: TreeMap;
  selectedId: number | null;
  hoveredId: number | null;
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
  nodeId: number;
  nextParentId: number | null;
  newIndex: number | null;
}

export type Action<T extends string, P = void> = { type: T, payload: P };

export type ReducerAction =
  Action<ActionType.Init, RecognizeResult> |
  // Action<ActionType.UpdateTree, BlockTreeItem[]> |
  Action<ActionType.UpdateTreeNodeRect, ChangeCallbackParams> |
  Action<ActionType.ChangeSelected, number | null> |
  Action<ActionType.ChangeHovered, number | null> |
  Action<ActionType.DeleteNode, number> |
  Action<ActionType.MoveNode, MoveNodeParams>;