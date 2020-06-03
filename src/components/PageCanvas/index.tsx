import React, { useCallback, useState } from 'react';
import { useKey, useMeasure } from "react-use";
import cx from 'classnames';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ItemId, Position } from '../../types';
import {
  createRecognizeDocument,
  createChangeSelected,
  createChangeIsProcessing,
  createRecognizeDocumentProgress
} from '../../reducer/actions';
import Header from "../Header";
import PageGraphics from "./PageGraphics";
import { recognize } from "../../ocr";
import { useAppReducer } from "../../reducerContext";
import { OcrDocument } from "../../reducer/types";

import './index.css';

interface Props {
  document?: OcrDocument;
}

const SCALE_MAX = 3.0;
const SCALE_MIN = 0.05;

const Separator = React.memo(() => (
  <div className="Separator" />
))

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

  React.useLayoutEffect(setFitScale, [setFitScale]);

  function handleSelected(itemId: ItemId | null) {
    dispatch(createChangeSelected(itemId));
  }

  function handleMouseWheel(evt: React.WheelEvent) {
    const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale * Math.pow(2, -evt.deltaY * 0.05)));

    setScale(newScale);
  }

  async function performOCR() {
    if (!document?.pageImage) {
      return;
    }

    dispatch(createChangeIsProcessing(true));
    
    const documents = [document];

    const results = await recognize(documents, "heb+eng", {
      logger: (id, progress) => {
        dispatch(createRecognizeDocumentProgress(id, progress));
      },
    });

    results.forEach((result, index) => {
      dispatch(createRecognizeDocument(documents[index].id, result));
    });
      
    dispatch(createChangeIsProcessing(false));
  }

  return (
    <div
      className="Canvas"
      onWheel={handleMouseWheel}
    >
      <Header className="Canvas-toolbar">
        <Button
          size="sm"
          variant="primary"
          disabled={!document?.pageImage || state.isProcessing}
          onClick={performOCR}
        >
          OCR
        </Button>
        <Button
          size="sm"
          onClick={setFitScale}
          disabled={!document?.pageImage}
          variant="outline-dark"
          title="Fit image"
        >
          <FontAwesomeIcon icon="expand" />
        </Button>
        <Separator />
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
      </Header>
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