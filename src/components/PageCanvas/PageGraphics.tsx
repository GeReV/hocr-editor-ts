import { Image, Layer, Stage } from "react-konva";
import { BlockTreeItem, PageImage } from "../../types";
import { Block, ChangeCallbackParams } from "./Block";
import React from "react";
import { useAppReducer } from "../../reducerContext";
import { createUpdateTreeNodeRect } from "../../pageReducer";

export interface Props {
  width: number;
  height: number;
  scale: number;
  onSelect: (id: number) => void;
  onDeselect: () => void;
  hoveredId?: number | null;
  selectedId?: number | null;
  pageImage?: PageImage;
}

export default function PageGraphics({ width, height, onSelect, scale, onDeselect, hoveredId, pageImage, selectedId }: Props) {
  const [state, dispatch] = useAppReducer();
  
  const treeMap = state.treeMap;
  
  function handleChange(args: ChangeCallbackParams) {
    dispatch(createUpdateTreeNodeRect(args));
  }
  
  if (!pageImage || !treeMap) {
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
      draggable
    >
      <Layer>
        <Image image={pageImage.image} />
      </Layer>
      <Layer>
        {
          state.tree
            .map(item => treeMap[item] as BlockTreeItem)
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
                treeMap={treeMap}
                {...pageProps}
              >
                {
                  block.children?.map((paraId) => {
                    const para = treeMap[paraId];
                  
                    if (!para) {
                      return null;
                    }
                  
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
                        treeMap={treeMap}
                        {...pageProps}
                      >
                        {
                          para.children?.map((lineId: number) => {
                            const line = treeMap[lineId];

                            if (!line) {
                              return null;
                            }
                            
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
                                treeMap={treeMap}
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