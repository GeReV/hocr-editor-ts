import { Bbox, RecognizeResult } from "tesseract.js";
import { createAction } from '@reduxjs/toolkit';
import { BaseTreeItem, BlockTreeItem, ElementType, Position } from "./types";
import { buildTree, walkChildren } from "./treeBuilder";

export type TreeMap = { [id: number]: BaseTreeItem<ElementType, any> };

export interface State {
  tree: BlockTreeItem[] | null;
  treeMap: TreeMap | null;
  selectedId: number | null;
  hoveredId: number | null;
}

export interface UpdateTreeNodePositionPayload extends Position {
  nodeId: number;
}

export enum ActionType {
  Init = 'Init',
  UpdateTree = 'UpdateTree',
  UpdateTreeNodePosition = 'UpdateTreeNodePosition',
  ChangeSelected = 'ChangeSelected',
  ChangeHovered = 'ChangeHovered',
}

export type Action<T extends string, P = void> = { type: T, payload: P };

export type ReducerAction =
  Action<ActionType.Init, RecognizeResult> |
  Action<ActionType.UpdateTree, BlockTreeItem[]> |
  Action<ActionType.UpdateTreeNodePosition, UpdateTreeNodePositionPayload> |
  Action<ActionType.ChangeSelected, number | null> |
  Action<ActionType.ChangeHovered, number | null>;

export const createInit = createAction<RecognizeResult, ActionType.Init>(ActionType.Init);
export const createUpdateTree = createAction<BlockTreeItem[], ActionType.UpdateTree>(ActionType.UpdateTree);
export const createUpdateTreeNodePosition = createAction<(nodeId: number, position: Position) => { payload: UpdateTreeNodePositionPayload }, ActionType.UpdateTreeNodePosition>(
  ActionType.UpdateTreeNodePosition,
  (nodeId, position) => ({ payload: { nodeId, ...position } })
);
export const createChangeSelected = createAction<number | null, ActionType.ChangeSelected>(ActionType.ChangeSelected);
export const createChangeHovered = createAction<number | null, ActionType.ChangeHovered>(ActionType.ChangeHovered);

const offsetBbox = (bbox: Bbox, offset: Position): Bbox => ({
  x0: bbox.x0 + offset.x,
  y0: bbox.y0 + offset.y,
  x1: bbox.x1 + offset.x,
  y1: bbox.y1 + offset.y,
});

// function walkTreeMap<T extends BaseTreeItem<ElementType, any>>(tree: T[], transform: (item: T) => T): T[] {
//   function walk(item: T): T {
//     const transformedItem = transform(item);
//
//     if (transformedItem.children && typeof transformedItem.children !== 'function') {
//       transformedItem.children = walkTreeMap(item.children ?? [], transform);
//     }
//
//     return transformedItem;
//   }
//
//   return tree.map(block => walk(block));
// }

export const initialState: State = {
  tree: null,
  treeMap: null,
  selectedId: null,
  hoveredId: null,
};


function updateTreeNodePosition(treeMap: TreeMap | null, nodeId: number, x: number, y: number): TreeMap | null {
  if (!treeMap) {
    return treeMap;
  }
  
  const node = treeMap[nodeId];
  
  if (!node) {
    throw new Error(`Could not find node with ID ${nodeId}.`);
  }
  
  const delta: Position = {
    x: x - node.parentRelativeOffset.x,
    y: y - node.parentRelativeOffset.y,
  };
  
  const resultMap: TreeMap = {
    ...treeMap,
    [nodeId]: {
      ...node,
      parentRelativeOffset: { x, y, },
      value: {
        ...node.value,
        bbox: offsetBbox(node.value.bbox, delta),
      },
    },
  };
  
  walkChildren(node.children, treeMap, item => {
    resultMap[item.id] = {
      ...item,
      value: {
        ...item.value,
        bbox: offsetBbox(item.value.bbox, delta),
      },
    };
  });
  
  return resultMap;
}

export function reducer(state: State, action: ReducerAction): State {
  switch (action.type) {
    case ActionType.Init: {
      const [blockTreeItems, treeMap] = buildTree(action.payload);

      return {
        tree: blockTreeItems,
        treeMap,
        selectedId: null,
        hoveredId: null,
      };
    }
    case ActionType.ChangeSelected: {
      return {
        ...state,
        selectedId: action.payload,
      };
    }
    case ActionType.ChangeHovered: {
      return {
        ...state,
        hoveredId: action.payload,
      };
    }
    // case ActionType.UpdateTree: {
    //   return {
    //     ...state,
    //     treeMap: action.payload,
    //   };
    // }
    case ActionType.UpdateTreeNodePosition: {
      return {
        ...state,
        treeMap: updateTreeNodePosition(state.treeMap, action.payload.nodeId, action.payload.x, action.payload.y),
      }
    }
    default:
      throw new Error(`Unknown action ${action}`);
  }
}