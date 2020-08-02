import React, { useCallback, useEffect, useRef } from 'react';
import { Group, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { IRect } from 'konva/types/types';

import { DocumentTreeItem, ElementType, ItemId, Position } from '../../types';
import { TreeItems } from '../../reducer/types';
import { clamp } from '../../utils';
import { calculateDragBounds } from './utils';

interface Box extends IRect {
  rotation: number;
}

export interface ChangeCallbackParams extends Position {
  nodeId: ItemId;
  width?: number;
  height?: number;
}

export type SetInnerRefFn = (itemId: ItemId, el: Konva.Rect | null) => void;

export interface BlockProps {
  fill?: string;
  opacity?: number;
  draggable?: boolean;
  onChange?: (args: ChangeCallbackParams) => void;
  item: DocumentTreeItem;
  isSelected?: boolean;
  onSelected?: (itemId: ItemId) => void;
  children?: React.ReactNode;
  pageWidth: number;
  pageHeight: number;
  treeItems: TreeItems;
  setInnerRef: SetInnerRefFn;
}

const MINIMUM_NODE_WIDTH = 5;
const MINIMUM_NODE_HEIGHT = 5;

function Block(props: BlockProps): React.ReactElement | null {
  const groupRef = useRef<Konva.Group>(null);
  const shapeRef = useRef<Konva.Rect | null>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!props.isSelected || !shapeRef.current) {
      return;
    }

    groupRef.current?.moveToTop();

    trRef.current?.nodes([shapeRef.current]);
    trRef.current?.getLayer()?.batchDraw();
  }, [props.isSelected]);

  const fill = props.isSelected ? 'rgba(255, 255, 0, 0.2)' : props.fill;

  const handleClick = useCallback(
    (evt: Konva.KonvaEventObject<MouseEvent>) => {
      evt.cancelBubble = true;

      props.onSelected?.(props.item.id);
    },
    [props],
  );

  const dragBoundFunc = useCallback<(pos: Position) => Position>(
    (pos) => {
      const bounds = calculateDragBounds(
        groupRef.current,
        props.item,
        props.treeItems,
        props.pageWidth,
        props.pageHeight,
      );

      return {
        x: clamp(pos.x, bounds.left, bounds.right),
        y: clamp(pos.y, bounds.top, bounds.bottom),
      };
    },
    [props.item, props.pageHeight, props.pageWidth, props.treeItems],
  );

  const handleDragEnd = useCallback<(evt: Konva.KonvaEventObject<DragEvent>) => void>(
    (evt) => {
      evt.cancelBubble = true;

      props.onChange?.({
        nodeId: props.item.id,
        x: evt.target.x(),
        y: evt.target.y(),
      });
    },
    [props.item.id, props.onChange],
  );

  const handleTransformEnd = useCallback<(evt: Konva.KonvaEventObject<Event>) => void>(
    (evt) => {
      // transformer is changing scale of the node
      // and NOT its width or height
      // but in the store we have only width and height
      // to match the data better we will reset scale on transform end
      evt.cancelBubble = true;

      const node = shapeRef.current;
      const group = groupRef.current;

      if (!node || !group) {
        return;
      }

      const scale = node.scale();

      // we will reset it back
      node.scaleX(1);
      node.scaleY(1);

      props.onChange?.({
        nodeId: props.item.id,
        x: group.x(),
        y: group.y(),
        // set minimal value
        width: Math.max(MINIMUM_NODE_WIDTH, node.width() * scale.x),
        height: Math.max(MINIMUM_NODE_HEIGHT, node.height() * scale.y),
      });
    },
    [props.item.id, props.onChange],
  );

  const boundBoxFunc = useCallback<(oldBox: Box, newBox: Box) => Box>(
    (oldBox, newBox) => {
      if (!groupRef.current) {
        return newBox;
      }

      const stage = groupRef.current.getStage();

      const scale = groupRef.current.getAbsoluteScale();

      const parent: DocumentTreeItem | null = props.item.parentId ? props.treeItems[props.item.parentId] : null;

      const bbox =
        !parent || parent.type === ElementType.Page
          ? {
              x0: 0,
              y0: 0,
              x1: props.pageWidth,
              y1: props.pageHeight,
            }
          : parent.data.bbox;

      const stageX = stage?.x() ?? 0;
      const stageY = stage?.y() ?? 0;

      const scaledBbox = {
        left: bbox.x0 * scale.x + stageX,
        top: bbox.y0 * scale.y + stageY,
        right: bbox.x1 * scale.x + stageX,
        bottom: bbox.y1 * scale.y + stageY,
      };

      // The 1 offset is to make things a bit more forgiving, since precision errors could lead to unwanted behaviors, for
      // example, when rects are on virtually the same pixel.
      if (
        newBox.x < scaledBbox.left - 1 ||
        newBox.y < scaledBbox.top - 1 ||
        newBox.width > scaledBbox.right - newBox.x + 1 ||
        newBox.height > scaledBbox.bottom - newBox.y + 1 ||
        newBox.width < MINIMUM_NODE_WIDTH ||
        newBox.height < MINIMUM_NODE_HEIGHT
      ) {
        return oldBox;
      }

      return newBox;
    },
    [props.item.parentId, props.pageHeight, props.pageWidth, props.treeItems],
  );

  if (props.item.type === ElementType.Page) {
    throw new Error('Block component cannot handle Page element type.');
  }

  return (
    <Group
      ref={groupRef}
      onClick={handleClick}
      draggable={props.draggable}
      x={props.item.parentRelativeOffset.x}
      y={props.item.parentRelativeOffset.y}
      dragBoundFunc={dragBoundFunc}
      onDragEnd={handleDragEnd}
    >
      <Rect
        ref={(el) => {
          props.setInnerRef(props.item.id, el);

          shapeRef.current = el;
        }}
        fill={fill}
        strokeWidth={MINIMUM_NODE_WIDTH}
        stroke="red"
        strokeScaleEnabled={false}
        strokeEnabled={false}
        opacity={props.opacity}
        width={props.item.data.bbox.x1 - props.item.data.bbox.x0}
        height={props.item.data.bbox.y1 - props.item.data.bbox.y0}
        onTransformEnd={handleTransformEnd}
      />
      {props.isSelected && <Transformer ref={trRef} rotateEnabled={false} anchorSize={7} boundBoxFunc={boundBoxFunc} />}
      {props.children}
    </Group>
  );
}

export default React.memo(Block);
