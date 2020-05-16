import Konva from "konva";
import { BaseTreeItem, ElementType, PageTreeItem, Position } from "../../types";
import { TreeMap } from "../../pageReducer";
import { Bbox } from "tesseract.js";

type BoundsTuple = [number, number, number, number];

const INFINITE_BOUNDS = {
  left: Number.NEGATIVE_INFINITY,
  top: Number.NEGATIVE_INFINITY,
  right: Number.POSITIVE_INFINITY,
  bottom: Number.POSITIVE_INFINITY,
};

const offsetBounds = ([left, top, right, bottom]: BoundsTuple, { x, y }: Position): BoundsTuple => [
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

const getParent = (treeMap: TreeMap, item: PageTreeItem): BaseTreeItem<ElementType, any> | null => typeof item.parentId === 'number' ? treeMap[item.parentId] : null;

export function calculateDragBounds(node: Konva.Node | null, item: PageTreeItem, treeMap: TreeMap, pageWidth: number, pageHeight: number) {
  if (!node) {
    return INFINITE_BOUNDS;
  }

  const stage = node.getStage();

  if (!stage) {
    return INFINITE_BOUNDS;
  }

  const scale = node.getAbsoluteScale();

  const nodeWidth = item.value.bbox.x1 - item.value.bbox.x0;
  const nodeHeight = item.value.bbox.y1 - item.value.bbox.y0;

  const stageOffset: Position = {
    x: stage.x() / scale.x,
    y: stage.y() / scale.y,
  };

  const pageBounds: BoundsTuple = [0, 0, pageWidth, pageHeight];

  const parent = getParent(treeMap, item);

  const parentBounds: BoundsTuple = parent ? bboxToBoundsTuple(parent.value.bbox) : pageBounds;

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