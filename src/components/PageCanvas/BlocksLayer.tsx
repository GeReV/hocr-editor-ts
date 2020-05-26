import { getNodeOrThrow } from "../../reducer";
import { BlockTreeItem, ItemId } from "../../types";
import Block, { ChangeCallbackParams, SetInnerRefFn } from "./Block";
import { Layer } from "react-konva";
import React from "react";
import { TreeItems } from "../../reducer/types";
import Konva from "konva";

interface Props {
  tree: {
    rootId: ItemId;
    items: TreeItems;
  } | null;
  selectedId?: ItemId | null;
  onChange?: (args: ChangeCallbackParams) => void;
  onSelect?: (id: ItemId) => void;
  pageProps: {
    pageWidth: number;
    pageHeight: number;
  };
  setInnerRef: SetInnerRefFn;
}

const BlocksLayer = React.forwardRef<Konva.Layer, Props>((props, ref) => {
  const {
    tree,
    selectedId,
    onChange,
    onSelect,
    pageProps,
    setInnerRef,
  } = props;

  if (!tree) {
    return null;
  }

  const treeItems = tree.items;

  return (
    <Layer ref={ref}>
      {
        treeItems[tree.rootId]
          .children
          .map((item) => getNodeOrThrow(treeItems, item) as BlockTreeItem)
          .map((block: BlockTreeItem) =>
            (
              <Block
                key={`block-${block.id}`}
                fill="rgba(0, 0, 255, 0.2)"
                item={block}
                onChange={onChange}
                onSelected={onSelect}
                isSelected={selectedId === block.id}
                draggable
                treeItems={treeItems}
                setInnerRef={setInnerRef}
                {...pageProps}
              >
                {
                  block.children?.map((paraId) => {
                    const para = getNodeOrThrow(treeItems, paraId);

                    return (
                      <Block
                        key={`paragraph-${para.id}`}
                        fill="rgba(0, 255, 0, 0.2)"
                        item={para}
                        onChange={onChange}
                        onSelected={onSelect}
                        isSelected={selectedId === para.id}
                        draggable
                        treeItems={treeItems}
                        setInnerRef={setInnerRef}
                        {...pageProps}
                      >
                        {
                          para.children?.map((lineId: ItemId) => {
                            const line = getNodeOrThrow(treeItems, lineId);

                            return (
                              <Block
                                key={`line-${line.id}`}
                                fill="rgba(255, 0, 0, 0.2)"
                                item={line}
                                onChange={onChange}
                                onSelected={onSelect}
                                isSelected={selectedId === line.id}
                                draggable
                                treeItems={treeItems}
                                setInnerRef={setInnerRef}
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
  );
});

export default React.memo(BlocksLayer);