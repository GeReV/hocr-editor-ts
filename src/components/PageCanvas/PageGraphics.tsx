import { Image, Layer, Stage } from "react-konva";
import { BlockTreeItem, ItemId, PageImage, Position } from "../../types";
import { Block, ChangeCallbackParams } from "./Block";
import React from "react";
import { useAppReducer } from "../../reducerContext";
import { createUpdateTreeNodeRect } from "../../reducer/actions";
import { getNodeOrThrow } from "../../reducer";

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

export default function PageGraphics({ width, height, onSelect, onDeselect, scale, position, setPosition, hoveredId, pageImage, selectedId }: Props) {
  const [state, dispatch] = useAppReducer();
  
  if (!state.tree) {
    return null;
  }
  
  const treeItems = state.tree.items;
  
  function handleChange(args: ChangeCallbackParams) {
    dispatch(createUpdateTreeNodeRect(args));
  }
  
  if (!pageImage) {
    return null;
  }
  
  const pageProps = {
    pageWidth: pageImage.image.width,
    pageHeight: pageImage.image.height,
  };
  
  return (
    <Stage
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
      draggable
    >
      <Layer>
        <Image image={pageImage.image} />
      </Layer>
      <Layer>
        {
          treeItems[state.tree.rootId]
            .children
            .map(item => getNodeOrThrow(treeItems, item) as BlockTreeItem)
            .map((block: BlockTreeItem) =>
            (
              <Block
                key={`block-${block.id}`}
                fill="blue"
                opacity={0.2}
                item={block}
                onChange={handleChange}
                onSelected={onSelect}
                isSelected={selectedId === block.id}
                isHovered={hoveredId === block.id}
                draggable
                treeItems={treeItems}
                {...pageProps}
              >
                {
                  block.children?.map((paraId) => {
                    const para = getNodeOrThrow(treeItems, paraId);
                  
                    return (
                      <Block
                        key={`paragraph-${para.id}`}
                        fill="green"
                        opacity={0.2}
                        item={para}
                        onChange={handleChange}
                        onSelected={onSelect}
                        isSelected={selectedId === para.id}
                        isHovered={hoveredId === para.id}
                        draggable
                        treeItems={treeItems}
                        {...pageProps}
                      >
                        {
                          para.children?.map((lineId: ItemId) => {
                            const line = getNodeOrThrow(treeItems, lineId);
                            
                            return (
                              <Block
                                key={`line-${line.id}`}
                                fill="red"
                                opacity={0.2}
                                item={line}
                                onChange={handleChange}
                                onSelected={onSelect}
                                isSelected={selectedId === line.id}
                                isHovered={hoveredId === line.id}
                                draggable
                                treeItems={treeItems}
                                {...pageProps}
                              />
                            );
                          })
                        }
                      </Block>
                    );
                  })
                }
              </Block>
            ))
        }
      </Layer>
    </Stage>
  );
}