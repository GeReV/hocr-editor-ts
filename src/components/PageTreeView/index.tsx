import React from "react";
import SortableTree, { ExtendedNodeData } from "react-sortable-tree";
import { useTimeoutFn } from "react-use";

import theme from "./theme";
import { PageTreeItem, ElementType, BlockTreeItem } from "../../types";
import { createChangeHovered, createUpdateTree } from "../../pageReducer";
import { useAppReducer } from "../../reducerContext";

import "react-sortable-tree/style.css";

interface Props {
}

const canNodeHaveChildren = (node: PageTreeItem): boolean => node.type !== ElementType.Word;

export default function PageTreeView(props: Props) {
  const [state, dispatch] = useAppReducer();
  const [, cancel, reset] = useTimeoutFn(() => dispatch(createChangeHovered(null)), 50);

  function handleChange(newData: BlockTreeItem[]): void {
    dispatch(createUpdateTree(newData));
  }

  function onMouseEnter(evt: React.MouseEvent, node: PageTreeItem) {
    cancel();
    
    dispatch(createChangeHovered(node.id));
  }

  function onMouseLeave() {
    reset();
  }

  function getGenerateNodeProps(data: ExtendedNodeData) {
    return {
      isSelected: state.selectedId === data.node.id,
      onMouseEnter,
      onMouseLeave,
    };
  }

  if (!state.tree) {
    return null;
  }

  return (
    <SortableTree
      theme={theme}
      treeData={state.tree}
      generateNodeProps={getGenerateNodeProps}
      onChange={handleChange}
      canNodeHaveChildren={canNodeHaveChildren}
    />
  );
}
