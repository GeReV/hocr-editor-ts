import Konva from "konva";
import { PageTreeItem } from "../../types";
import { TreeMap } from "../../pageReducer";

type BoundsTuple = [number, number, number, number];

const INFINITE_BOUNDS = {
  left: Number.NEGATIVE_INFINITY,
  top: Number.NEGATIVE_INFINITY,
  right: Number.POSITIVE_INFINITY,
  bottom: Number.POSITIVE_INFINITY,
};

const offsetBounds = ([left, top, right, bottom]: BoundsTuple, offset: { top: number; left: number }) => [
  left + offset.left,
  top + offset.top,
  right + offset.left,
  bottom + offset.top,
];

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

  const stageOffset = {
    left: stage.x() / scale.x,
    top: stage.y() / scale.y,
  };

  const pageBounds: BoundsTuple = [0, 0, pageWidth, pageHeight];

  const parent = item.parentId && treeMap[item.parentId];

  const parentBounds: BoundsTuple = parent ?
    [
      parent.parentRelativeOffset.x,
      parent.parentRelativeOffset.y,
      parent.parentRelativeOffset.x + parent.value.bbox.x1 - parent.value.bbox.x0,
      parent.parentRelativeOffset.y + parent.value.bbox.y1 - parent.value.bbox.y0
    ] :
    pageBounds;

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