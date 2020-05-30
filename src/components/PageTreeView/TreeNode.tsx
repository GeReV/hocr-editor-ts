import React, { useCallback, useEffect, useMemo, useState } from "react";
import cx from "classnames";
import { useKey } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/free-solid-svg-icons";

import { ItemId, RenderItemParams } from "../SortableTree";
import { DocumentTreeItem, ElementType } from "../../types";
import { truncate } from "../../utils";
import { useAppReducer } from "../../reducerContext";
import { createModifyNode } from "../../reducer/actions";
import TreeNodeTextEditor from "./TreeNodeTextEditor";
import { TreeItems } from "../../reducer/types";

interface TreeNodeProps {
  isSelected?: boolean;
  onMouseEnter?: (evt: React.MouseEvent, nodeId: ItemId) => void;
  onClick?: (evt: React.MouseEvent, nodeId: ItemId) => void;
}

function buildTitle(items: TreeItems, nodeId: ItemId): string {
  const node = items[nodeId];
  
  switch (node.type) {
    case ElementType.Block: {
      if (!node.data.text) {
        return node.data.blocktype;
      }

      return node.children.map(childId => buildTitle(items, childId)).join('\n\n');
    }
    case ElementType.Paragraph:
      return node.children.map(childId => buildTitle(items, childId)).join('\n');
    case ElementType.Line:
      return node.children.map(childId => buildTitle(items, childId)).join(' ');
    case ElementType.Word:
      return node.data.text.trim();
    default:
      return '';
  }
}

function getTypeIcon(node: DocumentTreeItem): { icon: IconName | null; iconTitle?: string; } {
  switch (node.type) {
    case ElementType.Block:
      return {
        icon: 'square',
        iconTitle: 'Block',
      };
    case ElementType.Paragraph:
      return {
        icon: 'paragraph',
        iconTitle: 'Paragraph',
      };
    case ElementType.Line:
      return {
        icon: 'i-cursor',
        iconTitle: 'Line',
      };
    case ElementType.Word:
      return {
        icon: null,
      };
    case ElementType.Symbol:
      return {
        icon: 'font',
        iconTitle: 'Symbol',
      };
    default: {
      return {
        icon: null,
      };
    }
  }
}

function TreeNode({ item, provided, onCollapse, onExpand, onMouseEnter, onClick, isSelected }: RenderItemParams & TreeNodeProps) {
  const [state, dispatch] = useAppReducer();

  const [isEditing, setIsEditing] = useState(false);
  
  const title = useMemo(() => {
    const tree = state.documents[state.currentDocument].tree;
    
    if (!tree) {
      return '';
    }

    return buildTitle(tree.items, item.id)
  }, [item, state]);

  const enableEditingIfPossible = useCallback(() => {
    const documentTreeItem = item as DocumentTreeItem;
    
    if (!isSelected || documentTreeItem.type !== ElementType.Word) {
      return;
    }

    setIsEditing(true);
  }, [isSelected, item]);

  const handleSave = useCallback((text: string) => {
    dispatch(createModifyNode(item.id, { text }));

    setIsEditing(false);
  }, [dispatch, item.id]);

  const handleDoubleClick = useCallback(() => {
    enableEditingIfPossible();
  }, [enableEditingIfPossible]);

  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);

  useKey('F2', () => {
    enableEditingIfPossible();
  }, undefined, [isSelected]);

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
    icon,
    iconTitle,
  } = getTypeIcon(item as DocumentTreeItem);

  return (
    <div
      className={cx('Tree-rowContents', isSelected && 'Tree-rowContents--selected')}
      ref={provided.innerRef}
      onMouseEnter={(evt) => onMouseEnter?.(evt, item.id)}
      onClick={(evt) => onClick?.(evt, item.id)}
      onDoubleClick={handleDoubleClick}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      {
        isEditing && (
          <TreeNodeTextEditor
            defaultValue={title}
            onCancel={() => setIsEditing(false)}
            onSave={handleSave}
          />
        )
      }
      {button}
      <div
        className="Tree-rowLabel"
        title={title}
      >
        {
          icon && (
            <><FontAwesomeIcon
              icon={icon}
              title={iconTitle}
            />{' '}</>
          )
        }
        {truncate(title)}
      </div>
    </div>
  )
}

export default React.memo(TreeNode);