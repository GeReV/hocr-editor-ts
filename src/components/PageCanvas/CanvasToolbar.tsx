import React, { PropsWithChildren, useCallback, useMemo } from "react";
import Header from "../Header";
import { Dropdown, ButtonGroup, Button } from "react-bootstrap";
import { useAppReducer } from "../../reducerContext";
import { createChangeIsProcessing, createRecognizeDocument } from "../../reducer/actions";
import { recognize } from "../../ocr";
import { OcrDocument } from "../../reducer/types";
import { isAnyDocumentProcessing } from "../../reducer/selectors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const isProcessing = useMemo(() => isAnyDocumentProcessing(state), [state]);
  
  const currentDocument: OcrDocument = state.documents[state.currentDocument];

  return (
    <Header className="Canvas-toolbar">
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