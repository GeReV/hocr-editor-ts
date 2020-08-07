import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Rectangle } from 'tesseract.js';
import { Button, Dropdown, Menu, Space } from 'antd';

import { useAppReducer } from '../../reducerContext';
import {
  createAddDocument,
  createChangeIsProcessing,
  createLogUpdate,
  createOpenDocument,
  createRecognizeDocument,
  createRecognizeRegion,
} from '../../reducer/actions';
import { OcrDocument } from '../../reducer/types';
import { isAnyDocumentProcessing } from '../../reducer/selectors';
import { loadImage } from '../../utils';
import hocrParser from '../../lib/hocrParser';
import { Page, PageImage, RecognizeOptions } from '../../types';

import './CanvasToolbar.scss';

type Entry = [PageImage | null, Page | null];

interface Props {}

async function getRecognizeFunction() {
  if (process.env.REACT_APP_ELECTRON) {
    return (await import('../../ocr.electron')).recognize;
  }

  return (await import('../../ocr')).recognize;
}

async function processDocs(docs: OcrDocument[], langs?: string, options?: RecognizeOptions): Promise<Page[]> {
  const recognize = await getRecognizeFunction();

  return recognize(docs, langs, options);
}

export default function CanvasToolbar({ children }: PropsWithChildren<Props>) {
  const [state, dispatch] = useAppReducer();

  const performOCR = useCallback(
    async (documents: OcrDocument[]) => {
      if (!documents.length) {
        return;
      }

      const filteredDocs = documents.filter((doc) => doc.pageImage);

      filteredDocs.forEach((doc) => dispatch(createChangeIsProcessing(doc.id, true)));

      const results = await processDocs(filteredDocs, 'heb+eng', {
        logger: (update) => dispatch(createLogUpdate(update)),
      });

      dispatch(createLogUpdate(null));

      results.forEach((result, index) => {
        dispatch(createRecognizeDocument(filteredDocs[index].id, result));
      });
    },
    [dispatch],
  );

  const performRegionOCR = useCallback(
    async (document: OcrDocument, rectangle: Rectangle) => {
      dispatch(createChangeIsProcessing(document.id, true));

      const recognize = await getRecognizeFunction();

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

  const handleImportHocr = useCallback(
    async (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (!evt.currentTarget.files) {
        return;
      }

      const files = Array.from(evt.currentTarget.files);

      if (!files.length) {
        return;
      }

      const map = new Map<string, Entry>();

      const loadFns = files.map(
        (f) =>
          new Promise<void>((resolve) => {
            const dotIndex = f.name.lastIndexOf('.');

            const name = f.name.slice(0, dotIndex);

            const entry: Entry = map.get(name) ?? [null, null];

            const reader = new FileReader();

            if (f.type.startsWith('image/')) {
              reader.onload = async (loadEvt: ProgressEvent<FileReader>) => {
                entry[0] = await loadImage(f, loadEvt.target?.result as ArrayBuffer);

                resolve();
              };

              reader.readAsArrayBuffer(f);
            }

            if (f.type.startsWith('text/')) {
              reader.onload = async (loadEvt: ProgressEvent<FileReader>) => {
                const html = loadEvt.target?.result?.toString();

                entry[1] = html ? hocrParser(html) : null;

                resolve();
              };

              reader.readAsText(f);
            }

            map.set(name, entry);
          }),
      );

      await Promise.all(loadFns);

      map.forEach((value, key) => {
        dispatch(createOpenDocument(key, value[0], value[1]));
      });
    },
    [dispatch],
  );

  const handleLoadImage = useCallback(
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
          const pageImage = await loadImage(f, loadEvt.target?.result as ArrayBuffer);

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
        <input
          type="file"
          className="Toolbar-open-file"
          onChange={handleImportHocr}
          accept="image/*,text/html,text/xml"
          multiple
        />
        <FontAwesomeIcon icon="folder-open" /> Import hOCR
      </Button>

      <Button type="primary" className="Toolbar-open">
        <input type="file" className="Toolbar-open-file" onChange={handleLoadImage} accept="image/*" multiple />
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
