import React, { useCallback } from 'react';
import { Col, Container, Navbar, Row } from 'react-bootstrap';
import { useKey } from 'react-use';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

import { OcrDocument } from './reducer/types';
import { useAppReducer } from './reducerContext';
import { createDeleteNode, createRedo, createSelectDocument, createUndo } from './reducer/actions';
import Header from './components/Header';
import PageCanvas from './components/PageCanvas';
import PageTreeView from './components/PageTreeView';
import PageList from './components/PageList';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { LogView } from './components/LogView';

library.add(fas);

function App() {
  const [state, dispatch] = useAppReducer();

  useKey(
    'Delete',
    () => {
      if (state.selectedId === null) {
        return;
      }

      dispatch(createDeleteNode(state.selectedId));
    },
    undefined,
    [state.selectedId],
  );

  useKey(
    (evt) => evt.key === 'z' && (evt.ctrlKey || evt.metaKey),
    () => {
      dispatch(createUndo());
    },
    undefined,
    [dispatch],
  );

  useKey(
    (evt) => {
      const cmdShiftZ = evt.key.toLowerCase() === 'z' && (evt.ctrlKey || evt.metaKey) && evt.shiftKey;
      const ctrlY = evt.key === 'y' && evt.ctrlKey;

      return cmdShiftZ || ctrlY;
    },
    () => {
      dispatch(createRedo());
    },
    undefined,
    [dispatch],
  );

  const handleSelect = useCallback(
    (index: number) => {
      dispatch(createSelectDocument(index));
    },
    [dispatch],
  );

  const currentDocument: OcrDocument = state.documents[state.currentDocument];

  return (
    <>
      <Navbar bg="dark" expand="lg" variant="dark">
        <Navbar.Brand>hOCR Editor</Navbar.Brand>
      </Navbar>
      <Container className="App" fluid>
        <Row className="App-main">
          <Col xl={1}>
            <PageList documents={state.documents} currentDocument={currentDocument} onSelect={handleSelect} />
          </Col>
          <Col xl={9} className="App-canvas">
            <PageCanvas
              documents={state.documents}
              document={currentDocument}
              selectedId={state.selectedId}
              hoveredId={state.hoveredId}
              dispatch={dispatch}
            />
          </Col>
          <Col xl={2} className="App-tree">
            <Header>Hierarchy</Header>
            <PageTreeView currentDocument={currentDocument} selectedId={state.selectedId} dispatch={dispatch} />
          </Col>
        </Row>
        <Row>
          <Col>
            <LogView lastUpdate={state.lastRecognizeUpdate} />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
