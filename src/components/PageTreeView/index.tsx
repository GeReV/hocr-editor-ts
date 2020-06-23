import React, { useCallback, Dispatch } from 'react';

import { createChangeSelected, createModifyNode, createMoveNode } from '../../reducer/actions';
import Tree from '../SortableTree/components/Tree';
import { ItemId, Path, RenderItemParams, TreeDestinationPosition, TreeSourcePosition } from '../SortableTree';

import './index.scss';
import { AppReducerAction, OcrDocument } from '../../reducer/types';
import { useHoveredState } from '../../hoverContext';
import TreeNode from './TreeNode';

interface Props {
  currentDocument: OcrDocument | undefined;
  selectedId: ItemId | null;
  dispatch: Dispatch<AppReducerAction>;
}

function PageTreeView({ currentDocument, selectedId, dispatch }: Props) {
  const [, setHoveredId] = useHoveredState();

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

      setHoveredId(nodeId);
    },
    [setHoveredId],
  );

  const onMouseLeave = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();

      setHoveredId(null);
    },
    [setHoveredId],
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

  const renderItem = useCallback(
    (params: RenderItemParams) => (
      <TreeNode
        onMouseEnter={onMouseEnter}
        onClick={onSelect}
        isSelected={String(selectedId) === String(params.item.id)}
        {...params}
      />
    ),
    [onMouseEnter, onSelect, selectedId],
  );

  const tree = currentDocument?.tree;

  if (!tree) {
    return null;
  }

  return (
    <div className="Tree" onMouseLeave={onMouseLeave}>
      <Tree
        tree={tree}
        onExpand={handleExpand}
        onCollapse={handleCollapse}
        onDragEnd={handleDragEnd}
        renderItem={renderItem}
        offsetPerLevel={24}
        isDragEnabled
        isNestingEnabled
      />
    </div>
  );
}

export default React.memo(PageTreeView);
