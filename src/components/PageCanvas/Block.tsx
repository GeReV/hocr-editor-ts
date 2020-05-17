import React from 'react';
import { Group, Rect, Transformer } from 'react-konva';
import Konva from 'konva';

import { PageTreeItem, Position } from '../../types';
import { TreeMap } from "../../pageReducer";
import { calculateDragBounds } from "./utils";
import { clamp } from "../../utils";
import { IRect } from "konva/types/types";

interface Box extends IRect {
  rotation: number;
}

export interface ChangeCallbackParams extends Position {
  nodeId: number;
  width?: number;
  height?: number;
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
  treeMap: TreeMap;
}

const MINIMUM_NODE_WIDTH = 5;
const MINIMUM_NODE_HEIGHT = 5;

export function Block(props: BlockProps): React.ReactElement | null {
  const groupRef = React.useRef<Konva.Group | null>(null);
  const shapeRef = React.useRef<Konva.Rect | null>(null);
  const trRef = React.useRef<Konva.Transformer | null>(null);

  React.useEffect(() => {
    if (props.isSelected) {
      groupRef.current?.moveToTop();
      
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

  const dragBoundFunc = React.useCallback<(pos: Position) => Position>((pos) => {
    const bounds = calculateDragBounds(groupRef.current, props.item, props.treeMap, props.pageWidth, props.pageHeight);

    return {
      x: clamp(pos.x, bounds.left, bounds.right),
      y: clamp(pos.y, bounds.top, bounds.bottom),
    };
  }, [props.item, props.pageHeight, props.pageWidth, props.treeMap]);

  const handleDragEnd = React.useCallback<(evt: Konva.KonvaEventObject<DragEvent>) => void>((evt) => {
    evt.cancelBubble = true;

    props.onChange?.({
      nodeId: props.item.id,
      x: evt.target.x(),
      y: evt.target.y()
    });
  }, [props.item.id, props.onChange]);
  
  const handleTransformEnd = React.useCallback<(evt: Konva.KonvaEventObject<Event>) => void>((evt) => {
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
    
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // we will reset it back
    node.scaleX(1);
    node.scaleY(1);

    props.onChange?.({
      nodeId: props.item.id,
      x: group.x(),
      y: group.y(),
      // set minimal value
      width: Math.max(MINIMUM_NODE_WIDTH, node.width() * scaleX),
      height: Math.max(MINIMUM_NODE_HEIGHT, node.height() * scaleY),
    });
  }, [props.item.id, props.onChange]);

  const boundBoxFunc = React.useCallback<(oldBox: Box, newBox: Box) => Box>((oldBox, newBox) => {
    if (!groupRef.current) {
      return newBox;
    }

    const scale = groupRef.current.getAbsoluteScale();

    const bbox = props.item.parentId ? props.treeMap[props.item.parentId].value.bbox : {
      x0: 0,
      y0: 0,
      x1: props.pageWidth,
      y1: props.pageHeight,
    };

    const scaledBbox = {
      left: bbox.x0 * scale.x,
      top: bbox.y0 * scale.y,
      right: bbox.x1 * scale.x,
      bottom: bbox.y1 * scale.y,
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
  }, [props.item.parentId, props.pageHeight, props.pageWidth, props.treeMap]);
  
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
        ref={shapeRef}
        fill={fill}
        strokeWidth={MINIMUM_NODE_WIDTH}
        stroke="red"
        strokeScaleEnabled={false}
        strokeEnabled={props.isHovered}
        opacity={props.opacity}
        width={props.item.value.bbox.x1 - props.item.value.bbox.x0}
        height={props.item.value.bbox.y1 - props.item.value.bbox.y0}
        onTransformEnd={handleTransformEnd}
      />
      {props.isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          anchorSize={7}
          boundBoxFunc={boundBoxFunc}
        />
      )}
      {props.children}
    </Group>
  );
}
