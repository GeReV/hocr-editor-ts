import React, { useCallback } from "react";
import {
  Container,
  Navbar,
  Row,
  Col,
} from "react-bootstrap";
import { useKey } from "react-use";
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

import { OcrDocument } from "./reducer/types";
import { useAppReducer } from "./reducerContext";
import { createDeleteNode, createSelectDocument } from "./reducer/actions";
import Header from "./components/Header";
import PageCanvas from "./components/PageCanvas";
import PageTreeView from "./components/PageTreeView";
import PageList from "./components/PageList";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

library.add(fas);

function App() {
  const [state, dispatch] = useAppReducer();

  useKey('Delete', () => {
    if (state.selectedId === null) {
      return;
    }

    dispatch(createDeleteNode(state.selectedId));
  }, undefined, [state.selectedId]);
  
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
