import React from "react";
import Konva from "konva";
import { Image, Layer, Stage } from "react-konva";
import { ItemId, PageImage, Position } from "../../types";
import { AppReducerContext } from "../../reducerContext";
import Blocks from "./Blocks";
import { createUpdateTreeNodeRect } from "../../reducer/actions";
import BlocksLayer from "./BlocksLayer";
import DrawLayer from "./DrawLayer";

export interface Props {
  width: number;
  height: number;
  scale: number;
  position: Position;
  setPosition: (pos: Position) => void;
  onSelect: (id: ItemId) => void;
  onDeselect: () => void;
  hoveredId?: ItemId | null;
  selectedId?: ItemId | null;
  pageImage?: PageImage;
}

interface State {
  isDrawing: boolean;
}

export default class PageGraphics extends React.Component<Props, State> {
  layer: React.RefObject<Konva.Layer> = React.createRef<Konva.Layer>();
  rectRefs: Record<ItemId, Konva.Rect | null> = {};

  state: State = {
    isDrawing: false,
  };

  setInnerRef = (itemId: ItemId, el: Konva.Rect | null) => {
    this.rectRefs[itemId] = el;
  };

  componentDidUpdate({ hoveredId: prevHoveredId }: Readonly<Props>) {
    const { hoveredId } = this.props;

    if (typeof prevHoveredId === 'string' || typeof prevHoveredId === 'number') {
      this.rectRefs[prevHoveredId]?.strokeEnabled(false);
    }

    if (typeof hoveredId === 'string' || typeof hoveredId === 'number') {
      this.rectRefs[hoveredId]?.strokeEnabled(true);
    }

    this.layer.current?.batchDraw();
  }

  componentWillUnmount() {
    this.rectRefs = {};
  }

  render() {
    const { width, height, onSelect, onDeselect, scale, position, setPosition, pageImage, selectedId } = this.props;

    if (!pageImage) {
      return null;
    }

    const pageProps = {
      pageWidth: pageImage.image.width,
      pageHeight: pageImage.image.height,
    };

    return (
      <AppReducerContext.Consumer>
        {
          (consumer) => {
            if (!consumer) {
              return null;
            }

            const [state, dispatch] = consumer;

            const tree = state.documents[state.currentDocument]?.tree;

            return (
              <Stage
                onClick={onDeselect}
                width={width}
                height={height}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                onDblClick={() => this.setState({ isDrawing: true })}
                onDragEnd={(evt) => {
                  const stage = evt.target.getStage();

                  setPosition({
                    x: stage?.x() ?? 0,
                    y: stage?.y() ?? 0,
                  });
                }}
                draggable={!this.state.isDrawing}
              >
                <BlocksLayer ref={this.layer}>
                  <Image image={pageImage.image} />
                  <Blocks
                    tree={tree}
                    onChange={(args) => dispatch(createUpdateTreeNodeRect(args))}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    pageProps={pageProps}
                    setInnerRef={this.setInnerRef}
                  />
                </BlocksLayer>
                {
                  this.state.isDrawing && (
                    <DrawLayer
                      width={pageImage?.image.width ?? 0}
                      height={pageImage?.image.height ?? 0}
                    />
                  )
                }
              </Stage>
            )
          }
        }
      </AppReducerContext.Consumer>
    );
  }
}