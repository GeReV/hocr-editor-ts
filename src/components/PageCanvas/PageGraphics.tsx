import React, { Dispatch } from 'react';
import Konva from 'konva';
import { Image, Stage } from 'react-konva';
import { ItemId, Position } from '../../types';
import { createUpdateTreeNodeRect } from '../../reducer/actions';
import { AppReducerAction, OcrDocument } from '../../reducer/types';
import Blocks from './Blocks';
import BlocksLayer from './BlocksLayer';
import DrawLayer from './DrawLayer';

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
  innerRef?: React.Ref<Stage>;
  dispatch: Dispatch<AppReducerAction>;
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
      innerRef,
      dispatch,
    } = this.props;

    if (!document?.pageImage || !document?.tree) {
      return null;
    }

    const pageProps = {
      pageWidth: document.pageImage.image.width,
      pageHeight: document.pageImage.image.height,
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
          <Image image={document.pageImage.image} />
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
          <DrawLayer width={document.pageImage.image.width ?? 0} height={document.pageImage.image.height ?? 0} />
        )}
      </Stage>
    );
  }
}

export default React.forwardRef<Stage, Props>((props, ref) => <PageGraphics innerRef={ref} {...props} />);
