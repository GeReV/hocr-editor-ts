import React, { PropsWithChildren, useCallback, useMemo } from "react";
import { Dropdown, ButtonGroup, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Header from "../Header";
import { useAppReducer } from "../../reducerContext";
import { createAddDocument, createChangeIsProcessing, createRecognizeDocument } from "../../reducer/actions";
import { recognize } from "../../ocr";
import { OcrDocument } from "../../reducer/types";
import { isAnyDocumentProcessing } from "../../reducer/selectors";
import { loadImage } from "../../utils";

import './CanvasToolbar.scss';

interface Props {
}

export default function CanvasToolbar({ children }: PropsWithChildren<Props>) {
  const [state, dispatch] = useAppReducer();

  const performOCR = useCallback(async (documents: OcrDocument[]) => {
    if (!documents.length) {
      return;
    }

    documents.forEach(doc => dispatch(createChangeIsProcessing(doc.id, true)));

    const results = await recognize(documents, "heb+eng");

    results.forEach((result, index) => {
      dispatch(createRecognizeDocument(documents[index].id, result));
      dispatch(createChangeIsProcessing(documents[index].id, false));
    });

  }, [dispatch]);

  const handleFileSelect = useCallback(async (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (!evt.currentTarget.files) {
      return;
    }

    const files = Array.from(evt.currentTarget.files)
      .filter(f => f.type.startsWith("image/"));

    if (!files.length) {
      return;
    }

    files.forEach(f => {
      const reader = new FileReader();

      reader.onload = async (loadEvt: ProgressEvent<FileReader>) => {
        const pageImage = await loadImage(
          loadEvt.target?.result as ArrayBuffer,
          f.type
        );

        if (!pageImage) {
          return;
        }

        dispatch(createAddDocument(f.name, pageImage));
      };

      reader.readAsArrayBuffer(f);
    })
  }, [dispatch]);

  const isProcessing = useMemo(() => isAnyDocumentProcessing(state), [state]);

  const currentDocument: OcrDocument = state.documents[state.currentDocument];

  return (
    <Header className="Canvas-toolbar">
      <Button
        className="Toolbar-open"
        size="sm"
      >
        <input
          type="file"
          className="Toolbar-open-file"
          onChange={handleFileSelect}
          accept="image/*"
          multiple
        />
        <FontAwesomeIcon icon="folder-open" />
        {' '}
        Load images
      </Button>
      <Dropdown as={ButtonGroup}>
        <Button
          size="sm"
          variant="primary"
          disabled={!currentDocument || isProcessing}
          onClick={() => performOCR([currentDocument])}
        >
          <FontAwesomeIcon icon="glasses" />
          {' '}
          OCR
        </Button>

        <Dropdown.Toggle
          id="ocr-dropdown"
          variant="primary"
          size="sm"
          disabled={!state.documents.length || isProcessing}
          split
        />

        <Dropdown.Menu>
          <Dropdown.Item onClick={() => performOCR([currentDocument])}>
            OCR current document
          </Dropdown.Item>
          <Dropdown.Item onClick={() => performOCR(state.documents)}>
            OCR all documents
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {children}
    </Header>
  );
}