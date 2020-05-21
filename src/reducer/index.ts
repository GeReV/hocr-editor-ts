import { Bbox } from "tesseract.js";
import produce from 'immer';

import { BaseTreeItem, ElementType, ItemId, Position } from "../types";
import { buildTree, walkChildren } from "../treeBuilder";
import { ActionType, ModifyNodePayload, ReducerAction, State, TreeItems } from "./types";

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
  treeRootId: null,
  treeItems: {},
  selectedId: null,
  hoveredId: null,
};

export function getNodeOrThrow(treeItems: TreeItems, nodeId: ItemId): BaseTreeItem<ElementType, any> {
  const node = treeItems[nodeId];

  if (!node) {
    throw new Error(`Could not find node with ID ${nodeId}.`);
  }
  
  return node;
}

function updateTreeNodePosition(state: State, nodeId: ItemId, x: number, y: number, width: number | undefined, height: number | undefined): State {
  return produce(state, (draft) => {
    const treeItems = draft.treeItems;

    const node = getNodeOrThrow(treeItems, nodeId);

    const delta: Position = {
      x: x - node.parentRelativeOffset.x,
      y: y - node.parentRelativeOffset.y,
    };

    const newPosition: Position = {
      x: node.data.bbox.x0 + delta.x,
      y: node.data.bbox.y0 + delta.y,
    };

    // TODO: Round and clamp to parent bounds.
    const newBbox: Bbox = {
      x0: newPosition.x,
      y0: newPosition.y,
      x1: typeof width === 'undefined' ? node.data.bbox.x1 + delta.x : newPosition.x + width,
      y1: typeof height === 'undefined' ? node.data.bbox.y1 + delta.y : newPosition.y + height,
    };

    node.parentRelativeOffset = { x, y, };
    node.data.bbox = newBbox;

    walkChildren(node.children, treeItems, (item) => {
      if (item.type === ElementType.Page) {
        return;
      }
      
      item.data.bbox = offsetBbox(item.data.bbox, delta);
    });
  });
}

function moveTreeNode(state: State, nodeId: ItemId, nextParentId: ItemId | null, newIndex: number | null): State {
  return produce(state, (draft) => {
    const treeItems = draft.treeItems;

    if (nextParentId === null) {
      return;
    }

    const node = getNodeOrThrow(treeItems, nodeId);
    
    const prevParentId = node.parentId;

    const newParentNode = treeItems[nextParentId];

    // If node was only swapped, remove it first so we can insert it again.
    const newParentChildren = newParentNode.children.filter(id => id !== nodeId);

    // Insert node in its new place.
    newParentChildren.splice(newIndex ?? 0, 0, nodeId);

    // Create tree map again. Give node its new parent, give parent its new children.
    treeItems[nodeId].parentId = nextParentId;
    treeItems[nextParentId].children = newParentChildren;

    // If node was moved from a previous, separate parent, remove it from that parent's children list. 
    if (prevParentId !== null && prevParentId !== nextParentId) {
      const prevParent = treeItems[prevParentId];

      if (!prevParent) {
        throw new Error(`Could not find node with ID ${prevParentId}`);
      }

      // Since updatedTreeMap is already a new object, it's safe to simply set new values.
      prevParent.children = prevParent.children.filter(id => id !== nodeId);
    }
  });
}

function deleteTreeNode(state: State, nodeId: ItemId): State {
  return produce(state, (draft) => {
    const node = getNodeOrThrow(draft.treeItems, nodeId);
    
    if (node.parentId) {
      const parent = getNodeOrThrow(draft.treeItems, node.parentId);
      
      const nodeIndex = parent.children.indexOf(nodeId);
      
      if (nodeIndex < 0) {
        throw new Error(`Node with ID ${nodeId} was expected to be a child of node with ID ${parent.id}.`);
      }
      
      parent.children.splice(nodeIndex, 1);
    }
    
    delete draft.treeItems[nodeId];
  });
}

function modifyTreeNode(state: State, payload: ModifyNodePayload) {
  return produce(state, (draft) => {
    const node = getNodeOrThrow(draft.treeItems, payload.itemId);

    const changes = payload.changes;
    
    if (typeof changes.isExpanded !== "undefined") {
      node.isExpanded = changes.isExpanded;
    }
    
    if (typeof changes.data !== "undefined") {
      node.data = changes.data;
    }
  });
}

export function reducer(state: State, action: ReducerAction): State {
  switch (action.type) {
    case ActionType.Init: {
      return produce(state, (draft) => {
        const [rootId, treeItems] = buildTree(action.payload);
        
        draft.treeRootId = rootId;
        draft.treeItems = treeItems;
      });
    }
    case ActionType.ChangeSelected: {
      return produce(state, (draft) => {
        draft.selectedId = action.payload;
      });
    }
    case ActionType.ChangeHovered: {
      return produce(state, (draft) => {
        draft.hoveredId = action.payload;
      });
    }
    // case ActionType.UpdateTree: {
    //   return {
    //     ...state,
    //     treeMap: action.payload,
    //   };
    // }
    case ActionType.UpdateTreeNodeRect: {
      return updateTreeNodePosition(state, action.payload.nodeId, action.payload.x, action.payload.y, action.payload.width, action.payload.height);
    }
    case ActionType.ModifyNode: {
      return modifyTreeNode(state, action.payload);
    }
    case ActionType.DeleteNode: {
      return deleteTreeNode(state, action.payload);
    }
    case ActionType.MoveNode: {
      return moveTreeNode(state, action.payload.nodeId, action.payload.nextParentId, action.payload.newIndex);
    }
    default:
      throw new Error(`Unknown action ${JSON.stringify(action)}`);
  }
}