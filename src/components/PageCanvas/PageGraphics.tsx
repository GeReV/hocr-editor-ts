

import { ItemId, Position } from '../../types';
import { createUpdateTreeNodeRect } from '../../reducer/actions';
import { AppReducerAction, OcrDocument } from '../../reducer/types';
import Blocks from './Blocks';
import BlocksLayer from './BlocksLayer';
import DrawLayer from './DrawLayer';
import React, { Dispatch } from 'react';
import Konva from 'konva';
import { Image, Stage } from 'react-konva';
import { IRect } from 'konva/types/types';

export interface Props {
  document: OcrDocument | undefined;
  width: number;
  height: number;
  scale?: number;
  position: Position;
  setPosition: (pos: Position) => void;
  onSelect: (id: ItemId) => void;
  onDeselect: () => void;
  hoveredId?: ItemId | null;
  selectedId?: ItemId | null;
  isDrawing?: boolean;
  drawRect?: IRect;
  onDraw?: (rect: IRect) => void;
  innerRef?: React.Ref<Stage>;
  dispatch: Dispatch<AppReducerAction>;
}

interface State {
  image: HTMLImageElement | null;
}

class PageGraphics extends React.Component<Props, State> {
  layer: React.RefObject<Konva.Layer> = React.createRef<Konva.Layer>();

  rectRefs: Record<ItemId, Konva.Rect | null> = {};

  state: State = {
    image: null,
  };

  setInnerRef = (itemId: ItemId, el: Konva.Rect | null) => {
    this.rectRefs[itemId] = el;
  };

  async componentDidUpdate({ hoveredId: prevHoveredId, document: prevDocument }: Readonly<Props>) {
    const { hoveredId, document } = this.props;

    if (typeof prevHoveredId === 'string' || typeof prevHoveredId === 'number') {
      this.rectRefs[prevHoveredId]?.strokeEnabled(false);
    }

    if (typeof hoveredId === 'string' || typeof hoveredId === 'number') {
      this.rectRefs[hoveredId]?.strokeEnabled(true);
    }

    if (document?.pageImage?.urlObject !== prevDocument?.pageImage?.urlObject) {
      if (document?.pageImage) {
        const image = new window.Image();

        image.onload = () =>
          this.setState({
            image,
          });

        image.src = document.pageImage.urlObject;
      } else {
        this.setState({ image: null });
      }
    }

    this.layer.current?.batchDraw();
  }

  componentWillUnmount() {
    this.rectRefs = {};
  }

  render() {
    const {
      document,
      width,
      height,
      onSelect,
      onDeselect,
      scale,
      position,
      setPosition,
      selectedId,
      isDrawing,
      onDraw,
      drawRect,
      innerRef,
      dispatch,
    } = this.props;

    const { image } = this.state;

    if (!document) {
      return null;
    }

    const pageProps = {
      pageWidth: document.width,
      pageHeight: document.height,
    };

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
          {image && <Image image={image} />}
          <Blocks
            tree={document.tree}
            onChange={(args) => dispatch(createUpdateTreeNodeRect(args))}
            onSelect={onSelect}
            selectedId={selectedId}
            pageProps={pageProps}
            setInnerRef={this.setInnerRef}
          />
        </BlocksLayer>
        {isDrawing && (
          <DrawLayer width={document.width} height={document.height} drawRect={drawRect} onChange={onDraw} />
        )}
      </Stage>
    );
  }
}

export default React.forwardRef<Stage, Props>((props, ref) => <PageGraphics innerRef={ref} {...props} />);
