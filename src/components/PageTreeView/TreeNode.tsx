import React, { useCallback, useEffect } from "react";
import cx from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/free-solid-svg-icons";

import { ItemId, RenderItemParams } from "../SortableTree";
import { DocumentTreeItem, ElementType } from "../../types";
import { canBlockHostChildren, truncate } from "../../utils";
import { useKey } from "react-use";
import { useAppReducer } from "../../reducerContext";
import { createModifyNode } from "../../reducer/actions";
import TreeNodeTextEditor from "./TreeNodeTextEditor";

interface TreeNodeProps {
  isSelected?: boolean;
  onMouseEnter?: (evt: React.MouseEvent, nodeId: ItemId) => void;
  onClick?: (evt: React.MouseEvent, nodeId: ItemId) => void;
}

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

function TreeNode({ item, provided, onCollapse, onExpand, onMouseEnter, onClick, isSelected }: RenderItemParams & TreeNodeProps) {
  const [, dispatch] = useAppReducer();

  const [isEditing, setIsEditing] = React.useState(false);

  const enableEditingIfPossible = React.useCallback(() => {
    if (!isSelected) {
      return;
    }

    const documentTreeItem = item as DocumentTreeItem;

    if (documentTreeItem.type === ElementType.Block && !canBlockHostChildren(documentTreeItem.data)) {
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
    title,
    icon,
    iconTitle,
  } = getTypeSpec(item as DocumentTreeItem);

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