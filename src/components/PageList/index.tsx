import React, { useCallback } from "react";
import cx from 'classnames';
import { Image as BsImage } from "react-bootstrap";

import { OcrDocument } from "../../reducer/types";

import './index.scss';

interface Props {
  documents: OcrDocument[];
  currentDocument: number;
  onSelect: (index: number) => void;
}

function PageList({ documents, currentDocument, onSelect }: Props) {
  const handleClick = useCallback((evt: React.MouseEvent, index: number) => {
    evt.preventDefault();

    onSelect(index)
  }, [onSelect]);
  
  return (
    <div className="Pages">
      <header>Pages</header>
      <ul className="Pages-list">
        {
          documents.map((doc, index) => (
            <li
              key={index}
              className={cx('Pages-item', index === currentDocument && 'Pages-item--selected')}
              onClick={evt => handleClick(evt, index)}
            >
              <BsImage src={doc.pageImage.thumbnailUrlObject} />
            </li>
          ))
        }
      </ul>
    </div>
  )
}

export default React.memo(PageList);