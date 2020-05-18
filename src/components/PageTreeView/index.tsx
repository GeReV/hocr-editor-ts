import React from "react";
import SortableTree, { ExtendedNodeData, TreeItem } from "react-sortable-tree";
import { useTimeoutFn } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import theme from "./theme";
import { BaseTreeItem, BlockTreeItem, ElementType, PageTreeItem } from "../../types";
import { createChangeHovered, TreeMap } from "../../pageReducer";
import { useAppReducer } from "../../reducerContext";

import "react-sortable-tree/style.css";
import { IconName } from "@fortawesome/free-solid-svg-icons";

export interface ExtendedTreeItem extends TreeItem {
}

interface Props {
}

const canNodeHaveChildren = (node: TreeItem): boolean => node.type !== ElementType.Word;

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

function rebuildTree<T extends BaseTreeItem<ElementType, any>, R extends ExtendedTreeItem>(tree: T[], resolveChild: (childId: number) => T, transform: (item: T) => R): R[] {
  function walk(item: T): R {
    const transformedItem = transform(item);

    transformedItem.children = rebuildTree(item.children.map(resolveChild), resolveChild, transform);

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

function buildTree(tree: BlockTreeItem[], treeMap: TreeMap) {
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
    (child) => {
      const {
        icon,
        iconTitle,
        title
      } = getTypeSpec(child);

      return {
        id: child.id,
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

export default function PageTreeView(props: Props) {
  const [state, dispatch] = useAppReducer();
  const [, cancel, reset] = useTimeoutFn(() => dispatch(createChangeHovered(null)), 50);
  
  const [tree, setTree] = React.useState<ExtendedTreeItem[]>([]);
  
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
      canNodeHaveChildren={canNodeHaveChildren}
      onVisibilityToggle={data => setTree(data.treeData)}
    />
  );
}
