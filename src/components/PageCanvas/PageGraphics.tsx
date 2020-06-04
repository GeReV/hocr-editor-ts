import React, { useCallback, useRef, useState } from "react";
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
  scale?: number;
  position: Position;
  setPosition: (pos: Position) => void;
  onSelect: (id: ItemId) => void;
  onDeselect: () => void;
  hoveredId?: ItemId | null;
  selectedId?: ItemId | null;
  pageImage?: PageImage;
  isDrawing?: boolean;
}

export default class PageGraphics extends React.Component<Props> {
  layer: React.RefObject<Konva.Layer> = React.createRef<Konva.Layer>();
  stageRef: React.RefObject<Stage> = React.createRef<Stage>();
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

  handleMouseWheel =(evt: Konva.KonvaEventObject<WheelEvent>) => {
    if (!this.stageRef.current) {
      return;
    }

    const stage = this.stageRef.current.getStage();

    const scale = stage.scaleX();
    const pos = stage.position();

    const newScale = Math.max(0.05, Math.min(3.0, scale * Math.pow(2, -evt.evt.deltaY * 0.05)));
    
    const clientRect = (evt.evt.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    
    const centerX = (evt.evt.x - clientRect.x - pos.x);
    const centerY = (evt.evt.y - clientRect.y - pos.y);
    
    const newPos = {
      x: (pos.x - centerX) * newScale + centerX,
      y: (pos.y - centerY) * newScale + centerY,
    };
    
    console.debug(pos);
    console.debug(centerX, centerY);
    console.debug(newPos);

    stage.scale({
      x: newScale,
      y: newScale
    });
    
    stage.position(newPos);
  };

  render() {
    const {
      width,
      height, 
      onSelect,
      onDeselect,
      // scale,
      // position,
      // setPosition,
      pageImage,
      selectedId,
      isDrawing,
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
        {
          (consumer) => {
            if (!consumer) {
              return null;
            }

            const [state, dispatch] = consumer;

            const tree = state.documents[state.currentDocument]?.tree;

            return (
              <Stage
                ref={this.stageRef}
                onWheel={this.handleMouseWheel}
                onClick={onDeselect}
                width={width}
                height={height}
                // scaleX={scale}
                // scaleY={scale}
                // x={position.x}
                // y={position.y}
                onDragEnd={(evt) => {
                  const stage = evt.target.getStage();

                  // setPosition({
                  //   x: stage?.x() ?? 0,
                  //   y: stage?.y() ?? 0,
                  // });
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
                {
                  isDrawing && (
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