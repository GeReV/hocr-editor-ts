import React, { useCallback, Dispatch } from 'react';
import { Row } from 'react-bootstrap';

import { createChangeHovered, createChangeSelected, createModifyNode, createMoveNode } from '../../reducer/actions';
import Tree from '../SortableTree/components/Tree';
import { ItemId, Path, TreeDestinationPosition, TreeSourcePosition } from '../SortableTree';

import './index.scss';
import { AppReducerAction, OcrDocument } from '../../reducer/types';
import TreeNode from './TreeNode';

interface Props {
  currentDocument: OcrDocument | undefined;
  selectedId: ItemId | null;
  dispatch: Dispatch<AppReducerAction>;
}

function PageTreeView({ currentDocument, selectedId, dispatch }: Props) {
  const handleDragEnd = useCallback(
    (source: TreeSourcePosition, destination?: TreeDestinationPosition) => {
      if (!destination) {
        return;
      }

      dispatch(
        createMoveNode({
          source,
          destination,
        }),
      );
    },
    [dispatch],
  );

  const onMouseEnter = useCallback(
    (evt: React.MouseEvent, nodeId: ItemId) => {
      evt.stopPropagation();

      dispatch(createChangeHovered(nodeId));
    },
    [dispatch],
  );

  const onMouseLeave = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();

      dispatch(createChangeHovered(null));
    },
    [dispatch],
  );

  const onSelect = useCallback(
    (evt: React.MouseEvent, nodeId: ItemId) => {
      evt.stopPropagation();

      dispatch(createChangeSelected(nodeId));
    },
    [dispatch],
  );

  const handleCollapse = useCallback(
    (itemId: ItemId, path: Path) => {
      dispatch(createModifyNode(itemId, { isExpanded: false }));
    },
    [dispatch],
  );

  const handleExpand = useCallback(
    (itemId: ItemId, path: Path) => {
      dispatch(createModifyNode(itemId, { isExpanded: true }));
    },
    [dispatch],
  );

  const tree = currentDocument?.tree;

  if (!tree) {
    return null;
  }

  return (
    <Row className="Tree" onMouseLeave={onMouseLeave}>
      <Tree
        tree={tree}
        onExpand={handleExpand}
        onCollapse={handleCollapse}
        onDragEnd={handleDragEnd}
        renderItem={(params) => (
          <TreeNode
            onMouseEnter={onMouseEnter}
            onClick={onSelect}
            isSelected={selectedId === params.item.id}
            {...params}
          />
        )}
        offsetPerLevel={24}
        isDragEnabled
        isNestingEnabled
      />
    </Row>
  );
}

export default React.memo(PageTreeView);
