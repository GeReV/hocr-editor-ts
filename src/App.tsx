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

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { PageImage } from "./types";
import PageCanvas from "./components/PageCanvas";
import PageTreeView from "./components/PageTreeView";
import { useAppReducer } from "./reducerContext";

const THUMBNAIL_MAX_WIDTH = 120;
const THUMBNAIL_MAX_HEIGHT = 160;

library.add(fas);

function resizeImage(
  image: ImageBitmap,
  width: number,
  height: number
): string | null {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL();
}

async function loadImage(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<PageImage | null> {
  const blob = new Blob([buffer], { type: mimeType });

  const img = await createImageBitmap(blob);

  let width = img.width;
  let height = img.height;

  if (width > height) {
    const ratio = THUMBNAIL_MAX_WIDTH / width;

    width = THUMBNAIL_MAX_WIDTH;
    height *= ratio;
  } else {
    const ratio = THUMBNAIL_MAX_HEIGHT / height;

    width *= ratio;
    height = THUMBNAIL_MAX_HEIGHT;
  }

  const thumbnailUrlObject = resizeImage(img, width, height);

  if (!thumbnailUrlObject) {
    return null;
  }

  return {
    image: img,
    urlObject: URL.createObjectURL(blob),
    thumbnailUrlObject,
  };
}

function App() {
  const [pageImage, setPageImage] = React.useState<PageImage | undefined>(
    undefined
  );
  
  const [state, dispatch] = useAppReducer();


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
                tree={state.tree}
                dispatch={dispatch}
                selectedId={state.selectedId}
                hoveredId={state.hoveredId}
              />
          </Col>
          <Col xl={2}>
            <PageTreeView />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
