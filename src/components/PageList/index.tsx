import React, { useCallback } from 'react';
import cx from 'classnames';
import { Progress } from 'antd';
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableRubric,
  DraggableStateSnapshot,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot,
  DropResult,
  ResponderProvided,
} from 'react-beautiful-dnd';
import { OcrDocument } from '../../reducer/types';

import assert from '../../lib/assert';
import { useAppReducer } from '../../reducerContext';

import './index.scss';
import { createReorderDocuments } from '../../reducer/actions';

interface Props {
  documents: OcrDocument[];
  selectedDocuments: Set<string>;
  onSelect: (selectedKeys: string[]) => void;
}

function PageList({ documents, selectedDocuments, onSelect }: Props) {
  const [, dispatch] = useAppReducer();

  const handleClick = useCallback<(key: React.Key, domEvent: React.MouseEvent<HTMLElement>) => void>(
    (key, domEvent) => {
      domEvent.preventDefault();

      const keyStr = key.toString();

      if (domEvent.ctrlKey) {
        const selectedDocumentsArr = Array.from(selectedDocuments);

        if (selectedDocuments.has(keyStr)) {
          selectedDocumentsArr.splice(selectedDocumentsArr.indexOf(keyStr), 1);
        } else {
          selectedDocumentsArr.push(keyStr);
        }

        onSelect(selectedDocumentsArr);
        return;
      }

      onSelect([keyStr]);
    },
    [selectedDocuments, onSelect],
  );

  const onDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      if (!result.destination || result.reason === 'CANCEL') {
        return;
      }

      dispatch(createReorderDocuments(result.source.index, result.destination?.index));
    },
    [dispatch],
  );

  return (
    <DragDropContext
      // onDragStart={this.onDragStart}
      onDragEnd={onDragEnd}
      // onDragUpdate={this.onDragUpdate}
    >
      <Droppable
        droppableId="pages"
        renderClone={(provided: DraggableProvided, snapshot: DraggableStateSnapshot, rubric: DraggableRubric) => {
          const item = documents.find((doc) => doc.id.toString() === rubric.draggableId);

          assert(item, `Could not find item with ID ${rubric.draggableId} in flattenedTree.`);

          return (
            <div
              key={item.id}
              className={cx('Pages-item', selectedDocuments.has(item.id.toString()) && 'Pages-item--selected')}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <div className="Pages-item-content">
                {item.pageImage && <img src={item.pageImage.thumbnailUrlObject} alt="" />}
              </div>
            </div>
          );
        }}
      >
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
          return (
            <div className="Pages">
              <div className="Pages-list" ref={provided.innerRef} {...provided.droppableProps}>
                {documents.map((doc, index) => {
                  const key = doc.id.toString();

                  return (
                    <Draggable key={key} draggableId={key} index={index}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                        return (
                          <div
                            onClick={(evt) => handleClick(key, evt)}
                            className={cx(
                              'Pages-item',
                              selectedDocuments.has(doc.id.toString()) && 'Pages-item--selected',
                            )}
                            ref={(el) => provided.innerRef(el)}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div className="Pages-item-content">
                              {doc.pageImage && <img src={doc.pageImage.thumbnailUrlObject} alt="" />}
                              {doc.isProcessing && (
                                <Progress
                                  className="Pages-item-progress"
                                  percent={100}
                                  status="active"
                                  showInfo={false}
                                />
                              )}
                            </div>
                          </div>
                        );
                      }}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            </div>
          );
        }}
      </Droppable>
    </DragDropContext>
  );
}

export default PageList;
