import React from "react";
import {
  Container,
  Navbar,
  Row,
  Col,
  FormFile,
  Image as BsImage,
} from "react-bootstrap";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

import { PageImage } from "./types";
import PageCanvas from "./components/PageCanvas";
import PageTreeView from "./components/PageTreeView";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { loadImage } from "./utils";
import { useKey } from "react-use";
import { useAppReducer } from "./reducerContext";
import { createDeleteNode } from "./reducer/actions";

library.add(fas);

function App() {
  const [pageImage, setPageImage] = React.useState<PageImage | undefined>(
    undefined
  );
  
  const [state, dispatch] = useAppReducer();
  
  useKey('Delete', () => {
    if (state.selectedId === null) {
      return;
    }

    dispatch(createDeleteNode(state.selectedId));
  }, undefined, [state.selectedId]);
  
  async function onFileSelect(evt: React.ChangeEvent<HTMLInputElement>) {
    if (!evt.currentTarget.files?.length) {
      return;
    }

    const file = evt.currentTarget.files[0];

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = async (loadEvt: ProgressEvent<FileReader>) => {
      const pageImage = await loadImage(
        loadEvt.target?.result as ArrayBuffer,
        file.type
      );

      if (!pageImage) {
        return;
      }

      setPageImage(pageImage);
    };

    reader.readAsArrayBuffer(file);
  }

  return (
    <>
      <Navbar
        bg="dark"
        expand="lg"
        variant="dark"
      >
        <Navbar.Brand>hOCR Editor</Navbar.Brand>
        <FormFile onChange={onFileSelect} />
      </Navbar>
      <Container
        fluid
        className="App"
      >
        <Row className="App-main">
          <Col xl={1}>
            Pages
            {pageImage ? <BsImage src={pageImage.thumbnailUrlObject} /> : null}
          </Col>
          <Col
            xl={9}
            className="App-canvas"
          >
            <PageCanvas
              pageImage={pageImage}
            />
          </Col>
          <Col 
            xl={2}
            className="App-tree"
          >
            <PageTreeView />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
