import React from "react";
import { NodeRendererProps, isDescendant } from "react-sortable-tree";

import { createChangeSelected } from "../../reducer/actions";
import { useAppReducer } from "../../reducerContext";

import styles from "./nodeContentRenderer.module.scss";
import { TesseractTreeItem } from "./index";

export interface Props extends NodeRendererProps {
  isSelected?: boolean;
  onMouseEnter?: (evt: React.MouseEvent, node: TesseractTreeItem) => void;
}

function NodeContentRenderer(props: Props): React.ReactElement | null {
  const {
    scaffoldBlockPxWidth,
    toggleChildrenVisibility,
    connectDragPreview,
    connectDragSource,
    isDragging,
    canDrop,
    canDrag,
    node,
    title,
    draggedNode,
    path,
    treeIndex,
    isSearchMatch,
    isSearchFocus,
    buttons,
    className,
    style,
    didDrop,
    lowerSiblingCounts,
    listIndex,
    swapFrom,
    swapLength,
    swapDepth,
    // treeId, // Not needed, but preserved for other renderers
    // isOver, // Not needed, but preserved for other renderers
    // parentNode, // Needed for dndManager
    // rowDirection,
    isSelected,
    onMouseEnter,
  } = props;
  
  const [, dispatch] = useAppReducer();

  const handleClick = React.useCallback(() => dispatch(createChangeSelected(node.id)), [dispatch, node.id]);

  const nodeTitle = title || node.title;

  const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
  const isLandingPadActive = !didDrop && isDragging;

  // Construct the scaffold representing the structure of the tree
  const scaffold: React.ReactNode[] = [];
  lowerSiblingCounts.forEach((lowerSiblingCount, i) => {
    scaffold.push(
      <div
        key={`pre_${1 + i}`}
        style={{ width: scaffoldBlockPxWidth }}
        className={styles.lineBlock}
      />
    );

    if (treeIndex !== listIndex && i === swapDepth) {
      // This row has been shifted, and is at the depth of
      // the line pointing to the new destination
      let highlightLineClass = "";

      if (listIndex === (swapFrom ?? 0) + (swapLength ?? 0) - 1) {
        // This block is on the bottom (target) line
        // This block points at the target block (where the row will go when released)
        highlightLineClass = styles.highlightBottomLeftCorner;
      } else if (treeIndex === swapFrom) {
        // This block is on the top (source) line
        highlightLineClass = styles.highlightTopLeftCorner;
      } else {
        // This block is between the bottom and top
        highlightLineClass = styles.highlightLineVertical;
      }

      scaffold.push(
        <div
          key={`highlight_${1 + i}`}
          style={{
            width: scaffoldBlockPxWidth,
            left: scaffoldBlockPxWidth * i,
          }}
          className={`${styles.absoluteLineBlock} ${highlightLineClass}`}
        />
      );
    }
  });

  const nodeContent = (
    // @ts-ignore
    <div style={{ height: "100%" }}>
      {toggleChildrenVisibility && node.children && node.children.length > 0 && (
        <button
          type="button"
          aria-label={node.expanded ? "Collapse" : "Expand"}
          className={
            node.expanded ? styles.collapseButton : styles.expandButton
          }
          style={{
            left: (lowerSiblingCounts.length - 0.7) * scaffoldBlockPxWidth,
          }}
          onClick={() =>
            toggleChildrenVisibility({
              node,
              path,
              treeIndex,
            })
          }
        />
      )}

      <div
        className={
          styles.rowWrapper +
          (!canDrag ? ` ${styles.rowWrapperDragDisabled}` : "") +
          (isSelected ? ` ${styles.rowWrapperHighlight}` : "")
        }
        onClick={handleClick}
        // onMouseEnter={(evt) => onMouseEnter?.(evt, node as TesseractTreeItem)}
      >
        {/* Set the row preview to be used during drag and drop */}
        {connectDragPreview(
          <div style={{ display: "flex" }}>
            {scaffold}
            <div
              className={
                styles.row +
                (isLandingPadActive ? ` ${styles.rowLandingPad}` : "") +
                (isLandingPadActive && !canDrop
                  ? ` ${styles.rowCancelPad}`
                  : "") +
                (isSearchMatch ? ` ${styles.rowSearchMatch}` : "") +
                (isSearchFocus ? ` ${styles.rowSearchFocus}` : "") +
                (className ? ` ${className}` : "")
              }
              style={{
                opacity: isDraggedDescendant ? 0.5 : 1,
                ...style,
              }}
            >
              <div
                className={
                  styles.rowContents +
                  (!canDrag ? ` ${styles.rowContentsDragDisabled}` : "")
                }
              >
                <div className={styles.rowLabel}>
                  <span className={styles.rowTitle}>
                    {typeof nodeTitle === "function"
                      ? nodeTitle({
                          node,
                          path,
                          treeIndex,
                        })
                      : nodeTitle}
                  </span>
                </div>

                <div className={styles.rowToolbar}>
                  {buttons?.map((btn, index) => (
                    <div
                      key={index} // eslint-disable-line react/no-array-index-key
                      className={styles.toolbarButton}
                    >
                      {btn}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return canDrag
    ? connectDragSource(nodeContent, { dropEffect: "copy" })
    : nodeContent;
}

NodeContentRenderer.defaultProps = {
  buttons: [],
  canDrag: false,
  canDrop: false,
  className: "",
  isSearchFocus: false,
  isSearchMatch: false,
  style: {},
};

export default NodeContentRenderer;
