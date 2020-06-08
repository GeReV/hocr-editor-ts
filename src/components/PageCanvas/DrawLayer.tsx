import React, { useCallback, useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { Group, Layer, Rect, Transformer } from 'react-konva';
import { IRect } from 'konva/types/types';
import { Position } from '../../types';
import { clamp } from '../../utils';

interface Box extends IRect {
  rotation: number;
}

interface Props {
  width: number;
  height: number;
}

type KonvaMouseEventHandler = (evt: Konva.KonvaEventObject<MouseEvent>) => void;

const MINIMUM_NODE_WIDTH = 5;
const MINIMUM_NODE_HEIGHT = 5;

const isLeftMouseButtonPressed = (mouseEvent: MouseEvent): boolean => !!(mouseEvent.buttons & 1);

const DrawLayer = ({ width, height }: Props) => {
  const [isDrawing, setIsDrawing] = useState(false);

  const groupRef = useRef<Konva.Group>(null);
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isDrawing || !rectRef.current) {
      return;
    }

    trRef.current?.nodes([rectRef.current]);
    trRef.current?.getLayer()?.batchDraw();
  }, [isDrawing]);

  const handleMouseDown = useCallback<KonvaMouseEventHandler>((evt: Konva.KonvaEventObject<MouseEvent>) => {
    const mouseEvent: MouseEvent = evt.evt;

    if (!isLeftMouseButtonPressed(mouseEvent)) {
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

    rect.position({
      x: (mouseEvent.offsetX - offset.x) / scale.x,
      y: (mouseEvent.offsetY - offset.y) / scale.y,
    });
    rect.size({
      width: 0,
      height: 0,
    });

    layer.batchDraw();

    setIsDrawing(true);
  }, []);

  const handleMouseUp = useCallback<KonvaMouseEventHandler>((evt) => {
    const mouseEvent = evt.evt;

    const rect = rectRef.current;

    if (isLeftMouseButtonPressed(mouseEvent) || !rect) {
      return;
    }

    const rectPos = rect.position();
    const rectSize = rect.size();

    if (rectSize.width < 0) {
      rect.x(rectPos.x + rectSize.width);
      rect.width(Math.abs(rectSize.width));
    } else {
      rect.width(Math.max(1, rectSize.width));
    }

    if (rectSize.height < 0) {
      rect.y(rectPos.y + rectSize.height);
      rect.height(Math.abs(rectSize.height));
    } else {
      rect.height(Math.max(1, rectSize.height));
    }

    setIsDrawing(false);
  }, []);

  const handleMouseMove = useCallback<KonvaMouseEventHandler>(
    (evt) => {
      const mouseEvent: MouseEvent = evt.evt;

      const rect = rectRef.current;

      if (!isLeftMouseButtonPressed(mouseEvent) || !isDrawing || !rect) {
        return;
      }

      const stage = rect.getStage();
      const layer = rect.getLayer();

      if (!stage || !layer) {
        return;
      }

      const pos = rect.position();
      const offset = stage.position();
      const scale = stage.scale();

      rect.size({
        width: (mouseEvent.offsetX - offset.x) / scale.x - pos.x,
        height: (mouseEvent.offsetY - offset.y) / scale.y - pos.y,
      });

      layer.batchDraw();
    },
    [isDrawing],
  );

  const dragBoundFunc = useCallback<(pos: Position) => Position>(
    (pos) => {
      const rect = rectRef.current;

      if (!rect) {
        return pos;
      }

      const stage = rect.getStage();

      if (!stage) {
        return pos;
      }

      const scale = rect.getAbsoluteScale();

      const stageOffset: Position = stage.position();

      const rectSize = rect.size();

      const bounds = {
        left: stageOffset.x,
        top: stageOffset.y,
        right: (width - rectSize.width) * scale.x + stageOffset.x,
        bottom: (height - rectSize.height) * scale.y + stageOffset.y,
      };

      return {
        x: clamp(pos.x, bounds.left, bounds.right),
        y: clamp(pos.y, bounds.top, bounds.bottom),
      };
    },
    [width, height],
  );

  const handleTransformEnd = useCallback<(evt: Konva.KonvaEventObject<Event>) => void>((evt) => {
    // transformer is changing scale of the rect
    // and NOT its width or height
    // but in the store we have only width and height
    // to match the data better we will reset scale on transform end
    evt.cancelBubble = true;

    const rect = rectRef.current;
    const group = groupRef.current;

    if (!rect || !group) {
      return;
    }

    const scale = rect.scale();

    // we will reset it back
    rect.scaleX(1);
    rect.scaleY(1);

    rect.size({
      width: Math.max(MINIMUM_NODE_WIDTH, rect.width() * scale.x),
      height: Math.max(MINIMUM_NODE_HEIGHT, rect.height() * scale.y),
    });
  }, []);

  const boundBoxFunc = useCallback<(oldBox: Box, newBox: Box) => Box>(
    (oldBox, newBox) => {
      if (!groupRef.current) {
        return newBox;
      }

      const stage = groupRef.current.getStage();

      if (!stage) {
        return newBox;
      }

      const bounds = {
        x0: 0,
        y0: 0,
        x1: width,
        y1: height,
      };

      const scale = groupRef.current.getAbsoluteScale();
      const stagePos = stage.position();

      const scaledBbox = {
        left: bounds.x0 * scale.x + stagePos.x,
        top: bounds.y0 * scale.y + stagePos.y,
        right: bounds.x1 * scale.x + stagePos.x,
        bottom: bounds.y1 * scale.y + stagePos.y,
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
    [width, height],
  );

  return (
    <Layer>
      <Rect
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      />
      <Group ref={groupRef}>
        <Rect
          ref={rectRef}
          fill="rgba(255, 0, 255, 0.2)"
          listening={!isDrawing}
          draggable={!isDrawing}
          dragBoundFunc={dragBoundFunc}
          onTransformEnd={handleTransformEnd}
        />
        {!isDrawing && (
          <Transformer ref={trRef} rotateEnabled={false} keepRatio={false} anchorSize={7} boundBoxFunc={boundBoxFunc} />
        )}
      </Group>
    </Layer>
  );
};

export default DrawLayer;
