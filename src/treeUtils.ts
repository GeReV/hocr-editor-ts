import { Bbox } from 'tesseract.js';

import { Tree, TreeItems } from './reducer/types';
import { DocumentTreeItem, ItemId, Position } from './types';
import assert from './lib/assert';
import { walkChildren } from './treeBuilder';

export function getNodeOrThrow(treeItems: TreeItems, nodeId: ItemId): DocumentTreeItem {
  const node = treeItems[nodeId.toString()];

  if (!node) {
    throw new Error(`Could not find node with ID ${nodeId}.`);
  }

  return node;
}

export const offsetBbox = (bbox: Bbox, offset: Position): Bbox => ({
  x0: bbox.x0 + offset.x,
  y0: bbox.y0 + offset.y,
  x1: bbox.x1 + offset.x,
  y1: bbox.y1 + offset.y,
});

export function calculateParentRelativeOffset(item: DocumentTreeItem, treeItems: TreeItems): Position {
  assert(item.parentId, 'Expected tree item to have a parent');

  const parent = treeItems[item.parentId];

  return {
    x: item.data.bbox.x0 - parent.data.bbox.x0,
    y: item.data.bbox.y0 - parent.data.bbox.y0,
  };
}

function rebuildParentRelativeOffsets(lastParent: DocumentTreeItem, tree: Tree) {
  lastParent.parentRelativeOffset = calculateParentRelativeOffset(lastParent, tree.items);

  walkChildren(lastParent.children, tree.items, (item) => {
    item.parentRelativeOffset = calculateParentRelativeOffset(item, tree.items);
  });
}

export function getAncestorLineageWithoutRoot(initialItemId: ItemId, tree: Tree): Array<DocumentTreeItem> {
  let currentParentId: ItemId | null = initialItemId;

  const ancestors: Array<DocumentTreeItem> = [];

  while (currentParentId && currentParentId !== tree.rootId) {
    const currentParent: DocumentTreeItem = getNodeOrThrow(tree.items, currentParentId);

    ancestors.push(currentParent);

    currentParentId = currentParent.parentId;
  }

  return ancestors;
}

export const calculateBoundingBox = (item: DocumentTreeItem, tree: Tree): Bbox =>
  item.children.reduce(
    (bbox, itemId) => {
      const item = getNodeOrThrow(tree.items, itemId);

      return {
        x0: Math.min(bbox.x0, item.data.bbox.x0),
        y0: Math.min(bbox.y0, item.data.bbox.y0),
        x1: Math.max(bbox.x1, item.data.bbox.x1),
        y1: Math.max(bbox.y1, item.data.bbox.y1),
      };
    },
    {
      x0: Number.POSITIVE_INFINITY,
      y0: Number.POSITIVE_INFINITY,
      x1: Number.NEGATIVE_INFINITY,
      y1: Number.NEGATIVE_INFINITY,
    },
  );

export function resizeBboxToWrap(initialItem: DocumentTreeItem, tree: Tree) {
  const ancestors = getAncestorLineageWithoutRoot(initialItem.id, tree);

  ancestors.forEach((item) => {
    item.data.bbox = calculateBoundingBox(item, tree);
  });

  const lastParent = ancestors.pop();

  if (lastParent) {
    rebuildParentRelativeOffsets(lastParent, tree);
  }
}
