import React, { Children, cloneElement } from 'react';
import { TreeRendererProps } from 'react-sortable-tree';

import styles from './treeNodeRenderer.module.scss';

function FileThemeTreeNodeRenderer(props: TreeRendererProps): React.ReactElement | null {
    const {
      children,
      listIndex,
      swapFrom,
      swapLength,
      swapDepth,
      scaffoldBlockPxWidth,
      lowerSiblingCounts,
      connectDropTarget,
      isOver,
      draggedNode,
      canDrop,
      treeIndex,
      treeId, // Delete from otherProps
      getPrevRow, // Delete from otherProps
      node, // Delete from otherProps
      path, // Delete from otherProps
      rowDirection,
      ...otherProps
    } = props;

    return connectDropTarget(
      <div {...otherProps} className={styles.node}>
        {Children.map(children, child =>
          cloneElement(child, {
            isOver,
            canDrop,
            draggedNode,
            lowerSiblingCounts,
            listIndex,
            swapFrom,
            swapLength,
            swapDepth,
          })
        )}
      </div>
    );
}

FileThemeTreeNodeRenderer.defaultProps = {
  canDrop: false,
};

export default React.memo(FileThemeTreeNodeRenderer);
