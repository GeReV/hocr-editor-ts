import React from "react";
import SortableTree, { ExtendedNodeData, TreeItem } from "react-sortable-tree";
import { useTimeoutFn } from "react-use";

import theme from "./theme";
import { BaseTreeItem, ElementType, PageTreeItem } from "../../types";
import { createChangeHovered } from "../../pageReducer";
import { useAppReducer } from "../../reducerContext";

import "react-sortable-tree/style.css";

export interface ExtendedTreeItem extends TreeItem {
}

interface Props {
}

const canNodeHaveChildren = (node: TreeItem): boolean => node.type !== ElementType.Word;

function rebuildTree<T extends BaseTreeItem<ElementType, any>, R extends ExtendedTreeItem>(tree: T[], resolveChild: (childId: number) => T, transform: (item: T) => R): R[] {
  function walk(item: T): R {
    const transformedItem = transform(item);

    transformedItem.children = rebuildTree(item.children.map(resolveChild), resolveChild, transform);

    return transformedItem;
  }

  return tree.map(block => walk(block));
}

export default function PageTreeView(props: Props) {
  const [state, dispatch] = useAppReducer();
  const [, cancel, reset] = useTimeoutFn(() => dispatch(createChangeHovered(null)), 50);
  const tree = React.useMemo<ExtendedTreeItem[]>(() => {
    const {
      tree,
      treeMap,
    } = state;
    
    if (!tree || !treeMap) {
      return [];
    }

    return rebuildTree<PageTreeItem, ExtendedTreeItem>(
      tree,
      childId => {
        const child = treeMap[childId];

        if (!child) {
          throw new Error(`Could not find child with ID ${childId} in tree.`);
        }

        return child;
      },
      child => ({
        title: child.value.text.slice(0, 10),
        subtitle: child.type,
        expanded: true,
      })
    );
  }, [state]);

  function handleChange(newData: ExtendedTreeItem[]): void {
    // dispatch(createUpdateTree(newData));
  }

  function onMouseEnter(evt: React.MouseEvent, node: ExtendedTreeItem) {
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
      treeData={tree}
      generateNodeProps={getGenerateNodeProps}
      onChange={handleChange}
      canNodeHaveChildren={canNodeHaveChildren}
    />
  );
}
