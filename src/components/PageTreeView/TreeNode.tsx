import React from "react";
import cx from "classnames";
import { Button, Col, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/free-solid-svg-icons";

import { ItemId, RenderItemParams } from "../SortableTree";
import { DocumentTreeItem, ElementType } from "../../types";
import { truncate } from "../../utils";
import { useKey } from "react-use";
import { useAppReducer } from "../../reducerContext";
import { createModifyNode } from "../../reducer/actions";

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
  function handleSave() {
    const text = editorRef.current?.value ?? '';

    dispatch(createModifyNode(item.id, { text }));

    setIsEditing(false);
  }
  
  const [, dispatch] = useAppReducer();
  
  const editorRef = React.useRef<HTMLInputElement | null>(null);
  
  const [isEditing, setIsEditing] = React.useState(false);
  
  React.useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);

  useKey('F2', () => {
    if (!isSelected) {
      return;
    }

    setIsEditing(true);
  }, undefined, [isSelected]);

  useKey('Escape', () => {
    if (!isEditing) {
      return;
    }

    setIsEditing(false);
  }, undefined, [isEditing]);
  
  useKey('Enter', () => {
    if (!isEditing) {
      return;
    }
    
    handleSave();
  }, undefined, [isEditing]);

  const handleDoubleClick = React.useCallback(() => {
    if (!isSelected) {
      return;
    }
    
    setIsEditing(true);
  }, [isSelected]);

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
          <Form className="Tree-rowEditor">
            <Form.Row>
              <Col xs={true}>
                <Form.Control
                  ref={editorRef}
                  type="text"
                  size="sm"
                  defaultValue={title}
                  autoFocus
                />
              </Col>
              <Col xs="auto">
                <Button
                  type="submit"
                  variant="success"
                  size="sm"
                  onClick={() => handleSave()}
                >
                  Save
                </Button>
                {' '}
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </Col>
            </Form.Row>
          </Form>
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