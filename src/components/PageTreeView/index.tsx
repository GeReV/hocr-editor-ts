import React from 'react';
import { Row } from 'react-bootstrap';

import { createChangeHovered, createChangeSelected, createModifyNode, createMoveNode } from '../../reducer/actions';
import { useAppReducer } from '../../reducerContext';
import Tree from '../SortableTree/components/Tree';
import { ItemId, Path, TreeDestinationPosition, TreeSourcePosition } from '../SortableTree';

import './index.scss';
import TreeNode from './TreeNode';

interface Props {}

export default function PageTreeView(props: Props) {
  const [state, dispatch] = useAppReducer();

  function handleDragEnd(source: TreeSourcePosition, destination?: TreeDestinationPosition) {
    if (!destination) {
      return;
    }

    dispatch(
      createMoveNode({
        source,
        destination,
      }),
    );
  }

  function onMouseEnter(evt: React.MouseEvent, nodeId: ItemId) {
    evt.stopPropagation();

    dispatch(createChangeHovered(nodeId));
  }

  function onMouseLeave(evt: React.MouseEvent) {
    evt.stopPropagation();

    dispatch(createChangeHovered(null));
  }

  function onSelect(evt: React.MouseEvent, nodeId: ItemId) {
    evt.stopPropagation();

    dispatch(createChangeSelected(nodeId));
  }

  function handleCollapse(itemId: ItemId, path: Path) {
    dispatch(createModifyNode(itemId, { isExpanded: false }));
  }

  function handleExpand(itemId: ItemId, path: Path) {
    dispatch(createModifyNode(itemId, { isExpanded: true }));
  }

  const tree = state.documents[state.currentDocument]?.tree;

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
            isSelected={state.selectedId === params.item.id}
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
