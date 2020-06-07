import React, { useCallback } from "react";
import {
  Container,
  Navbar,
  Row,
  Col,
  FormFile,
} from "react-bootstrap";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

import PageCanvas from "./components/PageCanvas";
import PageTreeView from "./components/PageTreeView";
import PageList from "./components/PageList";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { loadImage } from "./utils";
import { useKey } from "react-use";
import { useAppReducer } from "./reducerContext";
import { createAddDocument, createDeleteNode, createSelectDocument } from "./reducer/actions";
import Header from "./components/Header";
import { OcrDocument } from "./reducer/types";

library.add(fas);

function App() {
  const [state, dispatch] = useAppReducer();

  useKey('Delete', () => {
    if (state.selectedId === null) {
      return;
    }

    dispatch(createDeleteNode(state.selectedId));
  }, undefined, [state.selectedId]);

  const onFileSelect = useCallback(async (evt: React.ChangeEvent<HTMLInputElement>) => {
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
  
  const handleSelect = useCallback((index: number) => {
    dispatch(createSelectDocument(index));
  }, [dispatch])

  const currentDocument: OcrDocument = state.documents[state.currentDocument];

  return (
    <>
      <Navbar
        bg="dark"
        expand="lg"
        variant="dark"
      >
        <Navbar.Brand>hOCR Editor</Navbar.Brand>
        <FormFile onChange={onFileSelect} multiple />
      </Navbar>
      <Container
        fluid
        className="App"
      >
        <Row className="App-main">
          <Col xl={1}>
            <PageList
              documents={state.documents}
              currentDocument={currentDocument}
              onSelect={handleSelect}
            />
          </Col>
          <Col
            xl={9}
            className="App-canvas"
          >
            <PageCanvas
              document={currentDocument}
            />
          </Col>
          <Col
            xl={2}
            className="App-tree"
          >
            <Header>Hierarchy</Header>
            <PageTreeView />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
