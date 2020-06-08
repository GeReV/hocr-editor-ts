import React from 'react';
import Konva from 'konva';
import { Image, Layer, Stage } from 'react-konva';
import { ItemId, PageImage, Position } from '../../types';
import { AppReducerContext } from '../../reducerContext';
import { createUpdateTreeNodeRect } from '../../reducer/actions';
import Blocks from './Blocks';
import BlocksLayer from './BlocksLayer';
import DrawLayer from './DrawLayer';

export interface Props {
  width: number;
  height: number;
  scale?: number;
  position: Position;
  setPosition: (pos: Position) => void;
  onSelect: (id: ItemId) => void;
  onDeselect: () => void;
  hoveredId?: ItemId | null;
  selectedId?: ItemId | null;
  pageImage?: PageImage;
  isDrawing?: boolean;
  innerRef?: React.Ref<Stage>;
}

class PageGraphics extends React.Component<Props> {
  layer: React.RefObject<Konva.Layer> = React.createRef<Konva.Layer>();

  rectRefs: Record<ItemId, Konva.Rect | null> = {};

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
    const {
      width,
      height,
      onSelect,
      onDeselect,
      scale,
      position,
      setPosition,
      pageImage,
      selectedId,
      isDrawing,
      innerRef,
    } = this.props;

    if (!pageImage) {
      return null;
    }

    const pageProps = {
      pageWidth: pageImage.image.width,
      pageHeight: pageImage.image.height,
    };

    return (
      <AppReducerContext.Consumer>
        {(consumer) => {
          if (!consumer) {
            return null;
          }

          const [state, dispatch] = consumer;

          const tree = state.documents[state.currentDocument]?.tree;

          return (
            <Stage
              ref={innerRef}
              onClick={onDeselect}
              width={width}
              height={height}
              scaleX={scale}
              scaleY={scale}
              x={position.x}
              y={position.y}
              onDragEnd={(evt) => {
                const stage = evt.target.getStage();

                setPosition({
                  x: stage?.x() ?? 0,
                  y: stage?.y() ?? 0,
                });
              }}
              draggable={!isDrawing}
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
              {isDrawing && <DrawLayer width={pageImage?.image.width ?? 0} height={pageImage?.image.height ?? 0} />}
            </Stage>
          );
        }}
      </AppReducerContext.Consumer>
    );
  }
}

export default React.forwardRef<Stage, Props>((props, ref) => <PageGraphics innerRef={ref} {...props} />);
