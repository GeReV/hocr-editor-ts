import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/free-solid-svg-icons";
import { Block, Line, Paragraph, Word, Symbol } from "tesseract.js";
import { Row } from 'react-bootstrap';

import { ElementType, DocumentTreeItem } from "../../types";
import { createChangeHovered, createMoveNode } from "../../reducer/actions";
import { useAppReducer } from "../../reducerContext";
import { canBlockHostChildren } from "../../utils";
import Tree from "../SortableTree/components/Tree";
import { ItemId, RenderItemParams, TreeData, TreeItem } from "../SortableTree";

import './index.scss';

export interface ExtendedTreeItem<T extends ElementType, V> extends TreeItem {
  id: ItemId;
  type: T;
  value: V;
}

export type TesseractTreeItem =
  ExtendedTreeItem<ElementType.Block, Block> |
  ExtendedTreeItem<ElementType.Paragraph, Paragraph> |
  ExtendedTreeItem<ElementType.Line, Line> |
  ExtendedTreeItem<ElementType.Word, Word> |
  ExtendedTreeItem<ElementType.Symbol, Symbol>;

interface Props {
}

const canNodeHaveChildren = (node: TesseractTreeItem): boolean => {
  if (node.type === ElementType.Block) {
    return canBlockHostChildren(node.data);
  }

  return node.type !== ElementType.Word && node.type !== ElementType.Symbol;
};

function getTypeSpec(node: DocumentTreeItem): { icon: IconName | null; iconTitle?: string; title: string; } {
  switch (node.type) {
    case ElementType.Block:
      return {
        icon: 'square',
        iconTitle: 'Block',
        title: node.data.text.trim() || node.data.blocktype,
      };
    case ElementType.Paragraph:
      return {
        icon: 'paragraph',
        iconTitle: 'Paragraph',
        title: node.data.text.trim()
      };
    case ElementType.Line:
      return {
        icon: 'i-cursor',
        iconTitle: 'Line',
        title: node.data.text.trim()
      };
    case ElementType.Word:
      return {
        icon: null,
        title: node.data.text.trim()
      };
    case ElementType.Symbol:
      return {
        icon: 'font',
        iconTitle: 'Symbol',
        title: node.data.text.trim()
      };
    default: {
      return {
        icon: null,
        title: node.data.text.trim(),
      };
    }
  }
}

// function reconstructTree<T extends BaseTreeItem<ElementType, any>, R extends TesseractTreeItem>(tree: number[], resolveChild: (childId: number) => T, transform: (item: T) => R): R[] {
//   function walk(item: T): R {
//     const transformedItem = transform(item);
//
//     transformedItem.children = reconstructTree(item.children, resolveChild, transform);
//
//     return transformedItem;
//   }
//
//   return tree
//     .map(resolveChild)
//     .map(block => walk(block));
// }

function truncate(s: string, len: number = 20): string {
  if (s.length <= len) {
    return s;
  }

  // Slice and add ellipsis.
  return `${s.slice(0, len).trim()}\u2026`;
}

// function buildTree(tree: number[], treeItems: TreeItems): TesseractTreeItem[] {
//   return reconstructTree<DocumentTreeItem, ExtendedTreeItem<ElementType, any>>(
//     tree,
//     childId => {
//       const child = treeItems[childId];
//
//       if (!child) {
//         throw new Error(`Could not find child with ID ${childId} in tree.`);
//       }
//
//       return child;
//     },
//     (child) => {
//       const {
//         title,
//         icon,
//         iconTitle,
//       } = getTypeSpec(child);
//
//       return {
//         id: child.id,
//         type: child.type,
//         value: child.value,
//         title: (
//           <span title={title}>
//             {
//               icon ? (
//                 <>
//                   <FontAwesomeIcon icon={icon} title={iconTitle} />
//                   {' '}
//                 </>
//               ): null
//             }
//             {truncate(title)}
//           </span>
//         ),
//         expanded: child.type === ElementType.Block || child.type === ElementType.Paragraph,
//       };
//     }
//   );
// }
//
// function canDrop(data: OnDragPreviousAndNextLocation & NodeData & { node: DocumentTreeItem; prevParent: DocumentTreeItem | null; nextParent: DocumentTreeItem | null; }): boolean {
//   if (!data.nextParent) {
//     // Moving to/within root level. Only blocks can do that.
//     return data.node.type === ElementType.Block;
//   }
//
//   // Nodes can only move under a parent of the same type.
//   // For example, lines can only go under paragraphs.
//   const canMoveUnderParent = data.nextParent.type === data.node.type - 1;
//
//   if (canMoveUnderParent && data.nextParent.type === ElementType.Block) {
//     // Only certain type of blocks can have children.
//     return canBlockHostChildren(data.nextParent.value);
//   }
//
//   return canMoveUnderParent;
// }

interface TreeNodeProps {
  isSelected?: boolean;
  onMouseEnter?: (evt: React.MouseEvent, nodeId: ItemId) => void;
}

function TreeNode({ item, provided, onCollapse, onExpand, onMouseEnter }: RenderItemParams & TreeNodeProps) {
  let button: React.ReactElement | null = null;

  if (item.children && item.children.length > 0) {
    button = item.isExpanded ? (
      <button
        type="button"
        onClick={() => onCollapse(item.id)}
        className="Tree-collapseButton"
      />
    ) : (
      <button
        type="button"
        onClick={() => onExpand(item.id)}
        className="Tree-expandButton"
      />
    );
  }
  
  const {
    title,
    icon,
    iconTitle,
  } = getTypeSpec(item as DocumentTreeItem);

  return (
    <div
      className="Tree-rowContents"
      ref={provided.innerRef}
      onMouseEnter={(evt) => onMouseEnter?.(evt, item.id)}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      {button}
      <div
        className="Tree-rowLabel"
        title={title}
      >
        {
          icon && (
            <><FontAwesomeIcon icon={icon} title={iconTitle} />{' '}</>
          )
        }
        {truncate(title)}
      </div>
    </div>
  )
}

export default function PageTreeView(props: Props) {
  const [state, dispatch] = useAppReducer();

  const tree = React.useMemo<TreeData | null>(() => {
    if (state.treeRootId === null) {
      return null;
    }

    return {
      rootId: state.treeRootId,
      items: state.treeItems,
    };
  }, [state.treeRootId, state.treeItems]);

  // function handleChange(newData: TesseractTreeItem[]): void {
  // }
  //
  // function handleMoveNode(data: NodeData & FullTree & OnMovePreviousAndNextLocation) {
  //   let siblings: TreeItem[] = data.treeData;
  //
  //   if (data.nextParentNode) {
  //     if (typeof data.nextParentNode.children === "function") {
  //       throw new Error('Cannot handle GetTreeItemChildrenFn here.');
  //     }
  //
  //     siblings = data.nextParentNode.children ?? [];
  //   }
  //
  //   const newIndex = siblings.indexOf(data.node) ?? null;
  //
  //   dispatch(createMoveNode({
  //     nodeId: data.node.id,
  //     nextParentId: data.nextParentNode?.id ?? null,
  //     newIndex,
  //   }));
  // }
  
  function onMouseEnter(evt: React.MouseEvent, nodeId: ItemId) {
    evt.stopPropagation();

    dispatch(createChangeHovered(nodeId));
  }

  function onMouseLeave(evt: React.MouseEvent) {
    evt.stopPropagation();

    dispatch(createChangeHovered(null));
  }

  if (!tree) {
    return null;
  }

  return (
    <Row
      className="Tree"
      onMouseLeave={onMouseLeave}
    >
      <div className="Tree-scrollWrapper">
        <Tree
          tree={tree}
          renderItem={(params) => (
            <TreeNode
              onMouseEnter={onMouseEnter}
              isSelected={state.selectedId === params.item.id} 
              {...params} 
            />
          )}
          offsetPerLevel={24}
          isDragEnabled
          isNestingEnabled
        />
      </div>
    </Row>
  );
}
