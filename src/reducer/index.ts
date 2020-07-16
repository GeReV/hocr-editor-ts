import { Bbox } from 'tesseract.js';
import { produce } from 'immer';
import type { Draft } from 'immer/dist/types/types-external';

import { IRect } from 'konva/types/types';
import { DocumentTreeItem, ElementType, ItemId, Position } from '../types';
import { buildTree, walkChildren } from '../treeBuilder';
import { TreeDestinationPosition, TreeSourcePosition } from '../components/SortableTree';
import { isLeafItem } from '../components/SortableTree/utils/tree';
import { createUniqueIdentifier } from '../utils';
import {
  calculateParentRelativeOffset,
  getAncestorLineageWithoutRoot,
  getNodeOrThrow,
  offsetBbox,
  resizeBboxToWrap,
} from '../treeUtils';
import assert from '../lib/assert';
import { ActionType, AppReducerAction, ModifyNodePayload, OcrDocument, State, Tree } from './types';

const MAX_CHANGESETS = 40;

const EMPTY_RECT: IRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

export const initialState: State = {
  snapshots: [],
  currentSnapshot: -1,
  documents: [],
  currentDocument: 0,
  selectedId: null,
  lastRecognizeUpdate: null,
  isDrawing: false,
  drawRect: EMPTY_RECT,
  options: {
    autoResizeNodes: true,
    autoDeleteEmptyNodes: false,
  },
};

function updateTreeNodePosition(
  state: State,
  nodeId: ItemId,
  x: number,
  y: number,
  width: number | undefined,
  height: number | undefined,
): State {
  return produceWithUndo(state, (draft) => {
    const tree = draft.documents[draft.currentDocument].tree;

    if (!tree) {
      return;
    }

    const treeItems = tree.items;

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

    node.parentRelativeOffset = { x, y };
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
  return produceWithUndo(state, (draft) => {
    const tree = draft.documents[draft.currentDocument].tree;

    if (!tree) {
      throw new Error('Cannot move node when no tree exists. This should never happen.');
    }

    const sourceParent = getNodeOrThrow(tree.items, source.parentId);
    const destinationParent = getNodeOrThrow(tree.items, destination.parentId);

    const itemId = sourceParent.children.splice(source.index, 1)[0];

    const item = getNodeOrThrow(tree.items, itemId);

    item.parentId = destinationParent.id;

    item.parentRelativeOffset = calculateParentRelativeOffset(item, tree.items);

    sourceParent.isExpanded = sourceParent.children.length > 0 && sourceParent.isExpanded;

    if (typeof destination.index === 'undefined') {
      if (isLeafItem(destinationParent)) {
        destinationParent.children.push(itemId);
      }
    } else {
      destinationParent.children.splice(destination.index, 0, itemId);
    }

    if (state.options.autoResizeNodes) {
      resizeBboxToWrap(destinationParent.id, tree);
    }

    const sourceAncestors = getAncestorLineageWithoutRoot(sourceParent.id, tree);

    if (state.options.autoDeleteEmptyNodes) {
      deleteEmptyAncestorNodes(sourceParent.id, tree);
    }

    const lastRemainingParent = sourceAncestors.find((ancestor) => tree.items.hasOwnProperty(ancestor.id.toString()));

    if (state.options.autoResizeNodes && lastRemainingParent) {
      resizeBboxToWrap(lastRemainingParent.id, tree);
    }
  });
}

function deleteEmptyAncestorNodes(nodeId: ItemId, tree: Tree): void {
  const ancestors = getAncestorLineageWithoutRoot(nodeId, tree);

  ancestors.forEach((ancestor) => {
    if (ancestor.children.length === 0) {
      removeFromParent(ancestor, tree);
    }
  });
}

function removeFromParent(node: DocumentTreeItem, tree: Tree): void {
  assert(node.parentId, 'Expected node to have a parent.');

  const parent = getNodeOrThrow(tree.items, node.parentId);

  const nodeIndex = parent.children.indexOf(node.id.toString());

  assert(nodeIndex >= 0, 'Node with ID %s was expected to be a child of node with ID %s.', node.id, parent.id);

  parent.children.splice(nodeIndex, 1);
}

function deleteTreeNode(state: State, nodeId: ItemId): State {
  return produceWithUndo(state, (draft) => {
    const tree = draft.documents[draft.currentDocument].tree;

    if (!tree) {
      return;
    }

    const treeItems = tree.items;

    const node = getNodeOrThrow(treeItems, nodeId);

    if (node.parentId !== null) {
      removeFromParent(node, tree);

      const ancestors = getAncestorLineageWithoutRoot(node.parentId, tree);

      if (state.options.autoDeleteEmptyNodes) {
        deleteEmptyAncestorNodes(node.parentId, tree);
      }

      const lastRemainingParent = ancestors.find((ancestor) => treeItems.hasOwnProperty(ancestor.id.toString()));

      if (state.options.autoResizeNodes && lastRemainingParent) {
        resizeBboxToWrap(lastRemainingParent.id, tree);
      }
    }

    walkChildren(node.children, treeItems, (item) => {
      delete treeItems[item.id];
    });

    delete treeItems[nodeId.toString()];
  });
}

function modifyTreeNode(state: State, payload: ModifyNodePayload): State {
  return produceWithUndo(state, (draft) => {
    const tree = draft.documents[draft.currentDocument].tree;

    if (!tree) {
      return;
    }

    const node = getNodeOrThrow(tree.items, payload.itemId);

    const changes = payload.changes;

    if (typeof changes.isExpanded !== 'undefined') {
      node.isExpanded = changes.isExpanded;
    }

    if (typeof changes.text !== 'undefined' && node.type === ElementType.Word) {
      node.data.text = changes.text;
    }
  });
}

const documentId = createUniqueIdentifier();

function reduce(state: State, action: AppReducerAction): State {
  switch (action.type) {
    case ActionType.AddDocument: {
      return produceWithUndo(state, (draft) => {
        draft.documents.push({
          id: documentId(),
          isProcessing: false,
          filename: action.payload.filename,
          pageImage: action.payload.pageImage,
          tree: null,
        });
      });
    }
    case ActionType.RecognizeDocument: {
      return produceWithUndo(state, (draft) => {
        const tree = buildTree(action.payload.result);

        const document = draft.documents.find((doc: OcrDocument) => doc.id === action.payload.id);

        if (!document) {
          throw new Error(`Document with ID ${action.payload.id} not found.`);
        }

        document.isProcessing = false;
        document.tree = tree;
      });
    }
    case ActionType.RecognizeRegion: {
      return produceWithUndo(state, (draft) => {
        const { rootId, items: newItems } = buildTree(action.payload.result);

        const document = draft.documents.find((doc: OcrDocument) => doc.id === action.payload.id);

        if (!document) {
          throw new Error(`Document with ID ${action.payload.id} not found.`);
        }

        document.isProcessing = false;

        // Tree already exists for document, append children to existing root.
        if (document.tree) {
          const oldRootId = document.tree.rootId;
          const oldRoot = document.tree.items[oldRootId];

          const newRoot = newItems[rootId];

          const entriesWithoutRoot = Object.entries(newItems).filter(([k]) => k !== rootId);

          const newChildren = Object.fromEntries(entriesWithoutRoot);

          // Add children IDs to old root's children.
          oldRoot.children.push(...newRoot.children);

          // Re-parent the new root's immediate children to the old root.
          newRoot.children
            .map((id) => newChildren[id])
            .forEach((child) => {
              child.parentId = oldRootId;
            });

          // Add children objects to tree items object.
          document.tree.items = {
            ...document.tree.items,
            ...newChildren,
          };
        } else {
          document.tree = {
            rootId,
            items: newItems,
          };
        }
      });
    }
    case ActionType.SelectDocument: {
      return produceWithUndo(state, (draft) => {
        draft.currentDocument = action.payload;
      });
    }
    case ActionType.ChangeSelected: {
      return produceWithUndo(state, (draft) => {
        draft.selectedId = action.payload;
      });
    }
    case ActionType.ChangeDocumentIsProcessing: {
      return produce(state, (draft) => {
        const document = draft.documents.find((doc) => doc.id === action.payload.id);

        if (!document) {
          throw new Error(`Document with ID ${action.payload.id} not found.`);
        }

        document.isProcessing = action.payload.isProcessing;
      });
    }
    case ActionType.UpdateTreeNodeRect: {
      return updateTreeNodePosition(
        state,
        action.payload.nodeId,
        action.payload.x,
        action.payload.y,
        action.payload.width,
        action.payload.height,
      );
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
    case ActionType.SetIsDrawing: {
      return produceWithUndo(state, (draft) => {
        draft.isDrawing = action.payload;
      });
    }
    case ActionType.SetDrawRect: {
      return produceWithUndo(state, (draft) => {
        draft.drawRect = action.payload;
      });
    }
    case ActionType.LogUpdate: {
      return produce(state, (draft) => {
        draft.lastRecognizeUpdate = action.payload;
      });
    }
    case ActionType.ChangeOptions: {
      return produce(state, (draft) => {
        Object.assign(draft.options, action.payload);
      });
    }
    default:
      throw new Error(`Unknown action ${JSON.stringify(action)}`);
  }
}

export function produceWithUndo(state: State, action: (draft: Draft<State>) => void): State {
  const newState = produce(state, action);

  if (state === newState) {
    return state;
  }

  return produce(newState, (draft) => {
    const { snapshots, currentSnapshot, ...rest } = draft;

    if (snapshots.length === MAX_CHANGESETS) {
      draft.snapshots.shift();
    }

    // When we've undone a few steps and make a new change, delete all future steps to start a new "timeline".
    if (draft.currentSnapshot < draft.snapshots.length - 1) {
      draft.snapshots = draft.snapshots.slice(0, draft.currentSnapshot + 1);
    }

    draft.snapshots.push(rest);
    draft.currentSnapshot = Math.min(draft.snapshots.length - 1, MAX_CHANGESETS - 1);
  });
}

export function reducer(state: State, action: AppReducerAction): State {
  const snapshotLastIndex = state.snapshots.length - 1;

  if (action.type === ActionType.Undo) {
    if (state.currentSnapshot <= 0) {
      return state;
    }

    const changes = state.snapshots[state.currentSnapshot - 1];

    return {
      ...state,
      ...changes,
      currentSnapshot: state.currentSnapshot - 1,
    };
  }

  if (action.type === ActionType.Redo) {
    if (state.currentSnapshot === snapshotLastIndex) {
      return state;
    }

    const changes = state.snapshots[state.currentSnapshot + 1];

    return {
      ...state,
      ...changes,
      currentSnapshot: state.currentSnapshot + 1,
    };
  }

  return reduce(state, action);
}
