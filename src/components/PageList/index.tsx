import React, { useCallback } from "react";
import cx from 'classnames';
import { Image as BsImage, ProgressBar } from "react-bootstrap";

import Header from "../Header";
import { useAppReducer } from "../../reducerContext";
import { OcrDocument } from "../../reducer/types";

import './index.scss';

interface Props {
  documents: OcrDocument[];
  currentDocument?: OcrDocument;
  onSelect: (index: number) => void;
}

function PageList({ documents, currentDocument, onSelect }: Props) {
  const [state,] = useAppReducer();

  const handleClick = useCallback((evt: React.MouseEvent, index: number) => {
    evt.preventDefault();

    onSelect(index);
  }, [onSelect]);

  return (
    <div className="Pages">
      <Header>Pages</Header>
      <ul className="Pages-list">
        {
          documents.map((doc, index) => (
            <li
              key={doc.id}
              className={cx('Pages-item', doc === currentDocument && 'Pages-item--selected')}
              onClick={evt => handleClick(evt, index)}
            >
              <div>
                <BsImage src={doc.pageImage.thumbnailUrlObject} />
                {
                  state.isProcessing && !doc.tree && (
                    <ProgressBar
                      className="Pages-item-progress"
                      now={100}
                      striped
                      animated
                    />
                  )
                }
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  );
}

export default PageList;