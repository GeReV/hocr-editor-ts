import { IRect } from 'konva/types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Space } from 'antd';
import cx from 'classnames';
import { useKey, useMeasure } from 'react-use';
import { Stage } from 'react-konva';
import React, { Dispatch, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ItemId, Position } from '../../types';
import {
  createChangeSelectedItem,
  createRedo,
  createSetDocumentImage,
  createSetDrawRect,
  createSetIsDrawing,
  createUndo,
} from '../../reducer/actions';
import { AppReducerAction, OcrDocument } from '../../reducer/types';
import { useHoveredState } from '../../hoverContext';
import { loadImage } from '../../utils';
import assert from '../../lib/assert';
import PageGraphics from './PageGraphics';
import CanvasToolbar from './CanvasToolbar';

import './index.css';

interface Props {
  document: OcrDocument | undefined;
  documents: OcrDocument[];
  selectedId: ItemId | null;
  dispatch: Dispatch<AppReducerAction>;
  isDrawing?: boolean;
  drawRect?: IRect;
  lockInteractions?: boolean;
  hasUndo?: boolean;
  hasRedo?: boolean;
}

const SCALE_MAX = 3.0;
const SCALE_MIN = 0.05;
const DELTA_CONSTANT = 3;

function PageCanvas({
  document,
  selectedId,
  dispatch,
  hasUndo,
  hasRedo,
  isDrawing,
  drawRect,
  lockInteractions,
}: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const [hoveredId] = useHoveredState();

  const stageRef = useRef<Stage>(null);

  const [ref, { width, height }] = useMeasure();

  useKey(
    'Escape',
    () => {
      dispatch(createSetIsDrawing(false));
    },
    undefined,
    [isDrawing],
  );

  const setFitScale = useCallback(() => {
    if (!document) {
      return;
    }

    const fitScale = document.width > document.height ? width / document.width : height / document.height;

    setScale(fitScale);
    setPosition({
      x: (width - document.width * fitScale) * 0.5,
      y: (height - document.height * fitScale) * 0.5,
    });
  }, [document, height, width]);

  useLayoutEffect(setFitScale, [setFitScale]);

  const handleSelected = useCallback(
    (itemId: ItemId | null) => {
      dispatch(createChangeSelectedItem(itemId));
    },
    [dispatch],
  );

  const handleMouseWheel = useCallback(
    (evt: React.WheelEvent) => {
      // For some reason, the modal doesn't stop mouse wheel events (even with pointer-events: none),
      // so ignore them explicitly when modal is up.
      if (!stageRef.current || lockInteractions) {
        return;
      }

      const stage = stageRef.current.getStage();

      const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };

      // Different browsers give different values for the mouse delta, so we'll convert them to ±1 and
      // use our own constant.
      const deltaY = Math.sign(evt.deltaY) * DELTA_CONSTANT;

      const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale * Math.pow(2, -deltaY * 0.05)));

      const mousePointTo = {
        x: (pointer.x - stage.x()) / scale,
        y: (pointer.y - stage.y()) / scale,
      };

      const newPos: Position = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setPosition(newPos);
      setScale(newScale);
    },
    [lockInteractions, scale],
  );

  const handleLoadImage = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (!document || !evt.currentTarget.files) {
        return;
      }

      const file = evt.currentTarget.files[0];

      assert(file, 'Expceted a file.');

      const reader = new FileReader();

      reader.onload = async (loadEvt: ProgressEvent<FileReader>) => {
        const pageImage = await loadImage(file, loadEvt.target?.result as ArrayBuffer);

        if (!pageImage) {
          return;
        }

        dispatch(createSetDocumentImage(document.id, pageImage));
      };

      reader.readAsArrayBuffer(file);
    },
    [dispatch, document],
  );

  return (
    <div className="Canvas" onWheel={handleMouseWheel}>
      <CanvasToolbar>
        <Button.Group>
          <Button
            title="Undo"
            onClick={() => dispatch(createUndo())}
            disabled={!hasUndo}
            icon={<FontAwesomeIcon icon="undo" />}
          />
          <Button
            title="Redo"
            onClick={() => dispatch(createRedo())}
            disabled={!hasRedo}
            icon={<FontAwesomeIcon icon="redo" />}
          />
        </Button.Group>

        <Button onClick={setFitScale} disabled={!document} title="Fit image" icon={<FontAwesomeIcon icon="expand" />} />
        <Button
          type={isDrawing ? 'primary' : 'default'}
          onClick={() => dispatch(createSetIsDrawing(!isDrawing))}
          disabled={!document}
          title="Select region"
          icon={<FontAwesomeIcon icon="vector-square" />}
        />
      </CanvasToolbar>
      <div className={cx('Canvas-main', isDrawing && 'Canvas-main--drawing')} ref={ref}>
        <PageGraphics
          document={document}
          ref={stageRef}
          width={width}
          height={height}
          onSelect={handleSelected}
          onDeselect={() => handleSelected(null)}
          hoveredId={hoveredId}
          selectedId={selectedId}
          scale={scale}
          position={position}
          setPosition={setPosition}
          isDrawing={isDrawing}
          onDraw={(rect) => dispatch(createSetDrawRect(rect))}
          drawRect={drawRect}
          dispatch={dispatch}
        />
        {document && !document.pageImage && (
          <Space className="Canvas-missing-image" size="large">
            This document is missing an image.
            <Button type="primary" size="small" className="Canvas-missing-image-upload">
              <input
                type="file"
                className="Canvas-missing-image-upload-input"
                onChange={handleLoadImage}
                accept="image/*"
              />
              Load an image
            </Button>
          </Space>
        )}
      </div>
    </div>
  );
}

export default PageCanvas;
