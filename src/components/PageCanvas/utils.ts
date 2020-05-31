import Konva from "konva";
import { BaseTreeItem, DocumentTreeItem, ElementType, Position } from "../../types";
import { TreeItems } from "../../reducer/types";
import { Bbox } from "tesseract.js";

export type BoundsTuple = [number, number, number, number];

const INFINITE_BOUNDS = {
  left: Number.NEGATIVE_INFINITY,
  top: Number.NEGATIVE_INFINITY,
  right: Number.POSITIVE_INFINITY,
  bottom: Number.POSITIVE_INFINITY,
};

export const offsetBounds = ([left, top, right, bottom]: BoundsTuple, { x, y }: Position): BoundsTuple => [
  left + x,
  top + y,
  right + x,
  bottom + y,
];

const bboxToBoundsTuple = (bbox: Bbox): BoundsTuple => ([
  bbox.x0,
  bbox.y0,
  bbox.x1,
  bbox.y1,
]);

const getParent = (treeItems: TreeItems, item: DocumentTreeItem): BaseTreeItem<ElementType, any> | null => item.parentId !== null ? treeItems[item.parentId] : null;

export function calculateDragBounds(node: Konva.Node | null, item: DocumentTreeItem, treeItems: TreeItems, pageWidth: number, pageHeight: number) {
  if (!node || item.type === ElementType.Page) {
    return INFINITE_BOUNDS;
  }

  const stage = node.getStage();

  if (!stage) {
    return INFINITE_BOUNDS;
  }

  const scale = node.getAbsoluteScale();

  const nodeWidth = item.data.bbox.x1 - item.data.bbox.x0;
  const nodeHeight = item.data.bbox.y1 - item.data.bbox.y0;

  const stageOffset: Position = {
    x: stage.x() / scale.x,
    y: stage.y() / scale.y,
  };

  const pageBounds: BoundsTuple = [0, 0, pageWidth, pageHeight];

  const parent = getParent(treeItems, item);

  const parentBounds: BoundsTuple = !parent || parent.type === ElementType.Page ? pageBounds : bboxToBoundsTuple(parent.data.bbox);

  const offsetParentBounds = offsetBounds(parentBounds, stageOffset);

  const [
    parentLeft,
    parentTop,
    parentRight,
    parentBottom
  ] = offsetParentBounds;

  return {
    left: parentLeft * scale.x,
    top: parentTop * scale.y,
    right: (parentRight - nodeWidth) * scale.x,
    bottom: (parentBottom - nodeHeight) * scale.y,
  };
}