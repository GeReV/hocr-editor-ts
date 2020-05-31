import React, { useCallback, useEffect, useRef, useState } from 'react';
import Konva from "konva";
import { Group, Layer, Rect, Transformer } from "react-konva";
import { IRect } from "konva/types/types";
import { ElementType, Position } from "../../types";
import { BoundsTuple, calculateDragBounds, offsetBounds } from "./utils";
import { clamp } from "../../utils";

interface Box extends IRect {
  rotation: number;
}

interface Props {
  isDrawing?: boolean;
  width: number;
  height: number;
}

type KonvaMouseEventHandler = (evt: Konva.KonvaEventObject<MouseEvent>) => void;

const MINIMUM_NODE_WIDTH = 5;
const MINIMUM_NODE_HEIGHT = 5;

const DrawLayer = (({ isDrawing, width, height }: Props) => {
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    trRef.current?.setNode(rectRef.current);
    trRef.current?.getLayer()?.batchDraw();
  }, []);

  const handleMouseDown = useCallback<KonvaMouseEventHandler>((evt: Konva.KonvaEventObject<MouseEvent>) => {
    const mouseEvent: MouseEvent = evt.evt;

    if (mouseEvent.button !== 0) {
      return;
    }

    const rect = rectRef.current;

    if (!rect) {
      return;
    }

    const stage = rect.getStage();
    const layer = rect.getLayer();

    if (!stage || !layer) {
      return;
    }

    const offset = stage.position();
    const scale = stage.scale();

    rect.x((mouseEvent.offsetX - offset.x) / scale.x);
    rect.y((mouseEvent.offsetY - offset.y) / scale.y);
    rect.fill('red');

    layer.batchDraw();
  }, []);

  const handleMouseUp = useCallback<KonvaMouseEventHandler>((evt) => {

  }, []);

  const handleMouseMove = useCallback<KonvaMouseEventHandler>((evt) => {
    const mouseEvent: MouseEvent = evt.evt;

    if (mouseEvent.button !== 0) {
      return;
    }

    const rect = rectRef.current;

    if (!rect) {
      return;
    }

    const stage = rect.getStage();
    const layer = rect.getLayer();

    if (!stage || !layer) {
      return;
    }

    const offset = stage.position();
    const scale = stage.scale();

    rect.width((mouseEvent.offsetX - offset.x) / scale.x);
    rect.height((mouseEvent.offsetY - offset.y) / scale.y);

    layer.batchDraw();
  }, []);

  const dragBoundFunc = useCallback<(pos: Position) => Position>((pos) => {
    const rect = rectRef.current;
    
    if (!rect) {
      return pos;
    }
    
    const stage = rect.getStage();

    if (!stage) {
      return pos;
    }

    const scale = stage.getAbsoluteScale();

    const nodeWidth = rect.width();
    const nodeHeight = rect.height();

    const stageOffset: Position = {
      x: stage.x() / scale.x,
      y: stage.y() / scale.y,
    };

    const pageBounds: BoundsTuple = [0, 0, width, height];

    const [
      parentLeft,
      parentTop,
      parentRight,
      parentBottom
    ] = offsetBounds(pageBounds, stageOffset);

    const bounds = {
      left: parentLeft * scale.x,
      top: parentTop * scale.y,
      right: (parentRight - nodeWidth) * scale.x,
      bottom: (parentBottom - nodeHeight) * scale.y,
    };
    
    return {
      x: clamp(pos.x, bounds.left, bounds.right),
      y: clamp(pos.y, bounds.top, bounds.bottom),
    };
  }, [width, height]);

  const boundBoxFunc = useCallback<(oldBox: Box, newBox: Box) => Box>((oldBox, newBox) => {
    if (!groupRef.current) {
      return newBox;
    }

    const stage = groupRef.current.getStage();

    const scale = groupRef.current.getAbsoluteScale();

    const bbox = {
      x0: 0,
      y0: 0,
      x1: width,
      y1: height,
    };

    const stageX = stage?.x() ?? 0;
    const stageY = stage?.y() ?? 0;

    const scaledBbox = {
      left: bbox.x0 * scale.x + stageX,
      top: bbox.y0 * scale.y + stageY,
      right: bbox.x1 * scale.x + stageX,
      bottom: bbox.y1 * scale.y + stageY,
    };

    if (
      newBox.x < scaledBbox.left - 1 ||
      newBox.y < scaledBbox.top - 1 ||
      newBox.width > scaledBbox.right - newBox.x + 1||
      newBox.height > scaledBbox.bottom - newBox.y + 1 ||
      newBox.width < MINIMUM_NODE_WIDTH ||
      newBox.height < MINIMUM_NODE_HEIGHT
    ) {
      return oldBox;
    }

    return newBox;
  }, [width, height]);

  const handleTransformEnd = useCallback<(evt: Konva.KonvaEventObject<Event>) => void>((evt) => {
    // transformer is changing scale of the node
    // and NOT its width or height
    // but in the store we have only width and height
    // to match the data better we will reset scale on transform end
    evt.cancelBubble = true;

    const node = rectRef.current;
    const group = groupRef.current;

    if (!node || !group) {
      return;
    }
    
    const scale = node.scale();

    // we will reset it back
    node.scaleX(1);
    node.scaleY(1);

    node.size({
      width: Math.max(MINIMUM_NODE_WIDTH, node.width() * scale.x),
      height: Math.max(MINIMUM_NODE_HEIGHT, node.height() * scale.y),
    });
  }, []);

  return (
    <Layer>
      <Group
        ref={groupRef}
        draggable
        dragBoundFunc={dragBoundFunc}
      >
        <Rect
          ref={rectRef}
          stroke="black"
          strokeWidth={1}
          width={100}
          height={100}
          onTransformEnd={handleTransformEnd}
        />
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          anchorSize={7}
          keepRatio={false}
          boundBoxFunc={boundBoxFunc}
        />
      </Group>
    </Layer>
  );
});

export default DrawLayer;