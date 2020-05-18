import React from "react";
import SortableTree, { ExtendedNodeData, NodeData, OnDragPreviousAndNextLocation, TreeItem } from "react-sortable-tree";
import { useTimeoutFn } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import theme from "./theme";
import { BaseTreeItem, BlockTreeItem, ElementType, PageTreeItem } from "../../types";
import { createChangeHovered, TreeMap } from "../../pageReducer";
import { useAppReducer } from "../../reducerContext";

import "react-sortable-tree/style.css";
import { IconName } from "@fortawesome/free-solid-svg-icons";
import { canBlockHostChildren } from "../../utils";

export interface ExtendedTreeItem extends TreeItem {
  id: number;
  type: ElementType;
}

interface Props {
}

const canNodeHaveChildren = (node: ExtendedTreeItem): boolean => {
  if (node.type === ElementType.Block) {
    return canBlockHostChildren(node.value);
  }
  
  return node.type !== ElementType.Word && node.type !== ElementType.Symbol;
};

function getTypeSpec(node: PageTreeItem): { icon: IconName | null; iconTitle?: string; title: string; } {
  switch (node.type) {
    case ElementType.Block:
      return {
        icon: 'square',
        iconTitle: 'Block',
        title: node.value.text.trim() || node.value.blocktype,
      };
    case ElementType.Paragraph:
      return {
        icon: 'paragraph',
        iconTitle: 'Paragraph',
        title: node.value.text.trim()
      };
    case ElementType.Line:
      return {
        icon: 'i-cursor',
        iconTitle: 'Line',
        title: node.value.text.trim()
      };
    case ElementType.Word:
      return {
        icon: null,
        title: node.value.text.trim()
      };
    case ElementType.Symbol:
      return {
        icon: 'font',
        iconTitle: 'Symbol',
        title: node.value.text.trim()
      };
  }
}

function reconstructTree<T extends BaseTreeItem<ElementType, any>, R extends ExtendedTreeItem>(tree: T[], resolveChild: (childId: number) => T, transform: (item: T) => R): R[] {
  function walk(item: T): R {
    const transformedItem = transform(item);

    transformedItem.children = reconstructTree(item.children.map(resolveChild), resolveChild, transform);

    return transformedItem;
  }

  return tree.map(block => walk(block));
}

function truncate(s: string, len: number = 20): string {
  if (s.length <= len) {
    return s;
  }
  
  // Slice and add ellipsis.
  return `${s.slice(0, len).trim()}\u2026`;
}

function buildTree(tree: BlockTreeItem[], treeMap: TreeMap): ExtendedTreeItem[] {
  if (!tree || !treeMap) {
    return [];
  }

  return reconstructTree<PageTreeItem, ExtendedTreeItem>(
    tree,
    childId => {
      const child = treeMap[childId];

      if (!child) {
        throw new Error(`Could not find child with ID ${childId} in tree.`);
      }

      return child;
    },
    (child) => {
      const {
        icon,
        iconTitle,
        title
      } = getTypeSpec(child);

      return {
        id: child.id,
        type: child.type,
        value: child.value,
        title: (
          <span title={title}>
              {icon && <FontAwesomeIcon
                icon={icon}
                title={iconTitle}
              />}
            {icon && ' '}
            {truncate(title)}
            </span>
        ),
        expanded: child.type === ElementType.Block || child.type === ElementType.Paragraph,
      };
    }
  );
}

function canDrop(data: OnDragPreviousAndNextLocation & NodeData & { node: PageTreeItem; prevParent: PageTreeItem | null; nextParent: PageTreeItem | null; }): boolean {
  if (!data.nextParent) {
    // Moving to/within root level. Only blocks can do that.
    return data.node.type === ElementType.Block;
  }

  // Nodes can only move under a parent of the same type.
  // For example, lines can only go under paragraphs.
  const canMoveUnderParent = data.nextParent.type === data.node.type - 1;
  
  if (canMoveUnderParent && data.nextParent.type === ElementType.Block) {
    // Only certain type of blocks can have children.
    return canBlockHostChildren(data.nextParent.value);
  }
  
  return canMoveUnderParent;
}

export default function PageTreeView(props: Props) {
  const [state, dispatch] = useAppReducer();
  const [, cancel, reset] = useTimeoutFn(() => dispatch(createChangeHovered(null)), 50);
  
  const [tree, setTree] = React.useState<TreeItem[]>([]);
  
  React.useEffect(() => {
    if (!state.tree || !state.treeMap) {
      return;
    }

    setTree(buildTree(state.tree, state.treeMap));
  }, [state.tree, state.treeMap])

  function handleChange(newData: ExtendedTreeItem[]): void {
    // dispatch(createUpdateTree(newData));
  }

  function onMouseEnter(evt: React.MouseEvent, node: ExtendedTreeItem) {
    evt.stopPropagation();

    cancel();

    dispatch(createChangeHovered(node.id));
  }

  function onMouseLeave(evt: React.MouseEvent) {
    evt.stopPropagation();

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
      canDrop={canDrop}
      canNodeHaveChildren={canNodeHaveChildren}
      onVisibilityToggle={data => setTree(data.treeData)}
    />
  );
}
