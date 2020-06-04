import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useKey, useMeasure } from "react-use";
import cx from 'classnames';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ItemId, Position } from '../../types';
import {
  createChangeSelected,
} from '../../reducer/actions';
import CanvasToolbar from "./CanvasToolbar";
import PageGraphics from "./PageGraphics";
import { useAppReducer } from "../../reducerContext";
import { OcrDocument } from "../../reducer/types";

import './index.css';

interface Props {
  document?: OcrDocument;
}

const SCALE_MAX = 3.0;
const SCALE_MIN = 0.05;

export default function PageCanvas({ document }: Props) {
  const [ref, { width, height }] = useMeasure();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const [isDrawing, setDrawing] = useState<boolean>(false);

  const [state, dispatch] = useAppReducer();

  useKey('Escape', () => {
    setDrawing(false);
  }, undefined, [isDrawing]);

  const setFitScale = useCallback(() => {
    if (!document?.pageImage) {
      return;
    }

    const fitScale = document.pageImage.image.width > document.pageImage.image.height ?
      (width / document.pageImage.image.width) :
      (height / document.pageImage.image.height);

    setScale(fitScale);
    setPosition({
      x: (width - document.pageImage.image.width * fitScale) * .5,
      y: (height - document.pageImage.image.height * fitScale) * .5,
    });
  }, [document, height, width]);

  useLayoutEffect(setFitScale, [setFitScale]);

  const handleSelected = useCallback((itemId: ItemId | null) => {
    dispatch(createChangeSelected(itemId));
  }, [dispatch]);

  const handleMouseWheel = useCallback((evt: React.WheelEvent) => {
    const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale * Math.pow(2, -evt.deltaY * 0.05)));

    setScale(newScale);
  }, [scale]);

  return (
    <div
      className="Canvas"
      onWheel={handleMouseWheel}
    >
      <CanvasToolbar>
        <Button
          size="sm"
          onClick={setFitScale}
          disabled={!document?.pageImage}
          variant="outline-dark"
          title="Fit image"
        >
          <FontAwesomeIcon icon="expand" />
        </Button>
        <Button
          size="sm"
          onClick={() => setDrawing(!isDrawing)}
          disabled={!document?.pageImage}
          active={isDrawing}
          variant="outline-dark"
          title="Select region"
        >
          <FontAwesomeIcon icon="vector-square" />
        </Button>
      </CanvasToolbar>
      <div
        className={cx('Canvas-main', isDrawing && 'Canvas-main--drawing')}
        ref={ref}
      >
        <PageGraphics
          width={width}
          height={height}
          onSelect={handleSelected}
          onDeselect={() => handleSelected(null)}
          hoveredId={state.hoveredId}
          selectedId={state.selectedId}
          pageImage={document?.pageImage}
          scale={scale}
          position={position}
          setPosition={setPosition}
          isDrawing={isDrawing}
        />
      </div>
    </div>
  );
}