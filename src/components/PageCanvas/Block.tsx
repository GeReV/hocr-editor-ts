import React from 'react';
import { Group, Rect, Transformer } from 'react-konva';
import Konva from 'konva';

import { PageTreeItem, Position } from '../../types';
import { TreeMap } from "../../pageReducer";
import { calculateDragBounds } from "./utils";
import { clamp } from "../../utils";

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
  treeMap: TreeMap;
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
  }, [props.item.id, props.onChange])

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
          anchorSize={7}
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
