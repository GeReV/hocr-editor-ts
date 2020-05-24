import { Bbox } from "tesseract.js";
import produce from 'immer';

import { BaseTreeItem, ElementType, ItemId, Position } from "../types";
import { buildTree, walkChildren } from "../treeBuilder";
import { ActionType, ModifyNodePayload, ReducerAction, State, TreeItems } from "./types";
import { TreeDestinationPosition, TreeSourcePosition } from "../components/SortableTree";
import { isLeafItem } from "../components/SortableTree/utils/tree";

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
  selectedId: null,
  hoveredId: null,
};

export function getNodeOrThrow(treeItems: TreeItems, nodeId: ItemId): BaseTreeItem<ElementType, any> {
  const node = treeItems[nodeId.toString()];

  if (!node) {
    throw new Error(`Could not find node with ID ${nodeId}.`);
  }
  
  return node;
}

function updateTreeNodePosition(state: State, nodeId: ItemId, x: number, y: number, width: number | undefined, height: number | undefined): State {
  return produce(state, (draft) => {
    if (!draft.tree) {
      return;
    }
    
    const treeItems = draft.tree.items;

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

function moveTreeNode(state: State, source: TreeSourcePosition, destination: TreeDestinationPosition): State {
  return produce(state, (draft) => {
    if (!draft.tree) {
      throw new Error('Cannot move node when no tree exists. This should never happen.');
    }

    const sourceParent = draft.tree.items[source.parentId];
    const destinationParent = draft.tree.items[destination.parentId];
    
    const item = sourceParent.children.splice(source.index, 1)[0];
    
    sourceParent.isExpanded = sourceParent.children.length > 0 && sourceParent.isExpanded;

    if (typeof destination.index === 'undefined') {
      if (isLeafItem(destinationParent)) {
        destinationParent.children.push(item);
      }
    } else {
      destinationParent.children.splice(destination.index, 0, item);
    }
  });
}

function deleteTreeNode(state: State, nodeId: ItemId): State {
  return produce(state, (draft) => {
    if (!draft.tree) {
      return;
    }
    
    const treeItems = draft.tree.items;
    
    const node = getNodeOrThrow(treeItems, nodeId);
    
    if (node.parentId !== null) {
      const parent = getNodeOrThrow(treeItems, node.parentId);
      
      const nodeIndex = parent.children.indexOf(nodeId.toString());
      
      if (nodeIndex < 0) {
        throw new Error(`Node with ID ${nodeId} was expected to be a child of node with ID ${parent.id}.`);
      }
      
      parent.children.splice(nodeIndex, 1);
    }
    
    walkChildren(node.children, treeItems, (item) => {
      delete treeItems[item.id];
    });
    
    delete treeItems[nodeId.toString()];
  });
}

function modifyTreeNode(state: State, payload: ModifyNodePayload) {
  return produce(state, (draft) => {
    if (!draft.tree) {
      return;
    }
    
    const treeItems = draft.tree.items;
    
    const node = getNodeOrThrow(treeItems, payload.itemId);

    const changes = payload.changes;
    
    if (typeof changes.isExpanded !== "undefined") {
      node.isExpanded = changes.isExpanded;
    }
    
    if (typeof changes.text !== "undefined") {
      node.data.text = changes.text;
    }
  });
}

export function reducer(state: State, action: ReducerAction): State {
  switch (action.type) {
    case ActionType.Init: {
      return produce(state, (draft) => {
        const [rootId, items] = buildTree(action.payload);
        
        draft.tree = {
          rootId,
          items,
        };
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
      return moveTreeNode(state, action.payload.source, action.payload.destination);
    }
    default:
      throw new Error(`Unknown action ${JSON.stringify(action)}`);
  }
}