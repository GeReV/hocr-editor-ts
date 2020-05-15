import React from 'react';
import { Group, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { Bbox } from 'tesseract.js';

import { PageTreeItem, Position } from '../../types';

interface LayoutProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

type BoundsTuple = [number, number, number, number];

const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(x, max));

export const bboxToRectArray = (bbox: Bbox): BoundsTuple => [
  bbox.x0,
  bbox.y0,
  bbox.x1,
  bbox.y1,
];

const INFINITE_BOUNDS = {
  left: Number.NEGATIVE_INFINITY,
  top: Number.NEGATIVE_INFINITY,
  right: Number.POSITIVE_INFINITY,
  bottom: Number.POSITIVE_INFINITY,
};

function offsetBounds([left, top, right, bottom]: BoundsTuple, offset: { top: number; left: number }) {
  return [
    left + offset.left,
    top + offset.top,
    right + offset.left,
    bottom + offset.top,
  ];
}

function calculateDragBounds(node: Konva.Node | null, item: PageTreeItem, pageWidth: number, pageHeight: number) {
  if (!node) {
    return INFINITE_BOUNDS;
  }

  const scale = node.getAbsoluteScale();

  const nodeWidth = item.value.bbox.x1 - item.value.bbox.x0;
  const nodeHeight = item.value.bbox.y1 - item.value.bbox.y0;
  
  const nodeLeft = item.parentRelativeOffset.x;
  const nodeTop = item.parentRelativeOffset.y;
  const nodeRight = nodeLeft + nodeWidth;
  const nodeBottom = nodeTop + nodeHeight;

  const stage = node.getStage();

  if (!stage) {
    return INFINITE_BOUNDS;
  }

  const stageOffset = {
    left: stage.x() / scale.x,
    top: stage.y() / scale.y,
  };

  const pageBounds: BoundsTuple = [0, 0, pageWidth, pageHeight];

  const parentBounds = item.parent ?
    offsetBounds(
      [
        item.parent.parentRelativeOffset.x,
        item.parent.parentRelativeOffset.y,
        item.parent.parentRelativeOffset.x + item.parent.value.bbox.x1 - item.parent.value.bbox.x0,
        item.parent.parentRelativeOffset.y + item.parent.value.bbox.y1 - item.parent.value.bbox.y0
      ],
      stageOffset
    ) :
    offsetBounds(pageBounds, stageOffset);

  const [
    parentLeft,
    parentTop,
    parentRight,
    parentBottom
  ] = parentBounds;

  return {
    left: (parentLeft) * scale.x,
    top: (parentTop) * scale.y,
    right: (parentRight - nodeWidth) * scale.x,
    bottom: (parentBottom - nodeHeight) * scale.y,
  };
}

export function getLayoutPropsFromBbox(bbox: Bbox): LayoutProps {
  const [left, top, right, bottom] = bboxToRectArray(bbox);

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export interface ChangeCallbackParams extends Position {
  nodeId: number;
}

export interface BlockProps {
  fill?: string;
  opacity?: number;
  draggable?: boolean;
  onChange?: (args: ChangeCallbackParams) => void;
  item: PageTreeItem;
  isSelected?: boolean;
  isHovered?: boolean;
  onSelected?: (itemId: number) => void;
  children?: React.ReactNode
  pageWidth: number;
  pageHeight: number;
}

export function Block(props: BlockProps): React.ReactElement | null {
  const groupRef = React.useRef<Konva.Group | null>(null);
  const shapeRef = React.useRef<Konva.Rect | null>(null);
  const trRef = React.useRef<Konva.Transformer | null>(null);

  React.useEffect(() => {
    if (props.isSelected) {
      // we need to attach transformer manually
      trRef.current?.setNode(shapeRef.current);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [props.isSelected]);

  const fill = props.isSelected ? 'yellow' : props.fill;

  const handleClick = React.useCallback((evt: Konva.KonvaEventObject<MouseEvent>) => {
    evt.cancelBubble = true;

    props.onSelected?.(props.item.id);
  }, [props]);

  // console.log(props.item.id, props.item.value.bbox);

  return (
    <Group
      ref={groupRef}
      onClick={handleClick}
      draggable={props.draggable}
      x={props.item.parentRelativeOffset.x}
      y={props.item.parentRelativeOffset.y}
      dragBoundFunc={pos => {
        const bounds = calculateDragBounds(groupRef.current, props.item, props.pageWidth, props.pageHeight);

        return {
          x: clamp(pos.x, bounds.left, bounds.right),
          y: clamp(pos.y, bounds.top, bounds.bottom),
        };
      }}
      onDragEnd={e => {
        props.onChange?.({
          nodeId: props.item.id,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      <Rect
        ref={shapeRef}
        fill={fill}
        strokeWidth={5}
        stroke="red"
        strokeScaleEnabled={false}
        strokeEnabled={props.isHovered}
        opacity={props.opacity}
        width={props.item.value.bbox.x1 - props.item.value.bbox.x0}
        height={props.item.value.bbox.y1 - props.item.value.bbox.y0}
        onTransformEnd={e => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end

          // const node = shapeRef.current;
          // const scaleX = node.scaleX();
          // const scaleY = node.scaleY();

          // // we will reset it back
          // node.scaleX(1);
          // node.scaleY(1);
          // onChange({
          //   ...shapeProps,
          //   x: node.x(),
          //   y: node.y(),
          //   // set minimal value
          //   width: Math.max(5, node.width() * scaleX),
          //   height: Math.max(node.height() * scaleY)
          // });
        }}
      />
      {props.isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
      {props.children}
    </Group>
  );
}
