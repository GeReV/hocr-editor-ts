import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { Space, Button, Dropdown, Menu } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Rectangle } from 'tesseract.js';

import { useAppReducer } from '../../reducerContext';
import {
  createAddDocument,
  createChangeIsProcessing,
  createLogUpdate,
  createRecognizeDocument,
  createRecognizeRegion,
} from '../../reducer/actions';
import { recognize } from '../../ocr';
import { OcrDocument } from '../../reducer/types';
import { isAnyDocumentProcessing } from '../../reducer/selectors';
import { loadImage } from '../../utils';

import './CanvasToolbar.scss';

interface Props {}

export default function CanvasToolbar({ children }: PropsWithChildren<Props>) {
  const [state, dispatch] = useAppReducer();

  const performOCR = useCallback(
    async (documents: OcrDocument[]) => {
      if (!documents.length) {
        return;
      }

      documents.forEach((doc) => dispatch(createChangeIsProcessing(doc.id, true)));

      const results = await recognize(documents, 'heb+eng', {
        logger: (update) => {
          dispatch(createLogUpdate(update));
        },
      });

      dispatch(createLogUpdate(null));

      results.forEach((result, index) => {
        dispatch(createRecognizeDocument(documents[index].id, result));
      });
    },
    [dispatch],
  );

  const performRegionOCR = useCallback(
    async (document: OcrDocument, rectangle: Rectangle) => {
      dispatch(createChangeIsProcessing(document.id, true));

      const [result] = await recognize([document], 'heb+eng', {
        logger: (update) => {
          dispatch(createLogUpdate(update));
        },
        rectangle,
      });

      dispatch(createLogUpdate(null));

      dispatch(createRecognizeRegion(document.id, result));
    },
    [dispatch],
  );

  const handleFileSelect = useCallback(
    async (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (!evt.currentTarget.files) {
        return;
      }

      const files = Array.from(evt.currentTarget.files).filter((f) => f.type.startsWith('image/'));

      if (!files.length) {
        return;
      }

      files.forEach((f) => {
        const reader = new FileReader();

        reader.onload = async (loadEvt: ProgressEvent<FileReader>) => {
          const pageImage = await loadImage(loadEvt.target?.result as ArrayBuffer, f.type);

          if (!pageImage) {
            return;
          }

          dispatch(createAddDocument(f.name, pageImage));
        };

        reader.readAsArrayBuffer(f);
      });
    },
    [dispatch],
  );

  const isProcessing = useMemo(() => isAnyDocumentProcessing(state.documents), [state]);

  const currentDocument: OcrDocument = state.documents[state.currentDocument];

  const handleOCR = useCallback(() => performOCR([currentDocument]), [currentDocument, performOCR]);

  const handleRegionOCR = useCallback(async () => {
    const rectangle = {
      left: Math.round(state.drawRect.x),
      top: Math.round(state.drawRect.y),
      width: Math.round(state.drawRect.width),
      height: Math.round(state.drawRect.height),
    };

    await performRegionOCR(currentDocument, rectangle);
  }, [currentDocument, state.drawRect, performRegionOCR]);

  const shouldOcrRegion: boolean = state.isDrawing && state.drawRect.width > 0 && state.drawRect.height > 0;

  const menu = (
    <Menu>
      <Menu.Item onClick={handleOCR}>OCR current document</Menu.Item>
      <Menu.Item onClick={() => performOCR(state.documents)}>OCR all documents</Menu.Item>
      <Menu.Item onClick={handleRegionOCR} disabled={!shouldOcrRegion}>
        OCR selected region
      </Menu.Item>
    </Menu>
  );

  return (
    <Space className="Canvas-toolbar">
      <Button type="primary" className="Toolbar-open">
        <input type="file" className="Toolbar-open-file" onChange={handleFileSelect} accept="image/*" multiple />
        <FontAwesomeIcon icon="folder-open" /> Load images
      </Button>

      <Dropdown.Button
        type="primary"
        overlay={menu}
        disabled={!currentDocument || isProcessing}
        onClick={shouldOcrRegion ? handleRegionOCR : handleOCR}
        icon={<FontAwesomeIcon icon="caret-down" />}
      >
        <FontAwesomeIcon icon="glasses" /> {shouldOcrRegion ? 'OCR Selection' : 'OCR'}
      </Dropdown.Button>

      {children}
    </Space>
  );
}
