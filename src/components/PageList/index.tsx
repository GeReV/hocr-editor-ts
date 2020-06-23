import React, { useCallback } from 'react';
import cx from 'classnames';
import { Progress } from 'antd';

import { OcrDocument } from '../../reducer/types';

import './index.scss';

interface Props {
  documents: OcrDocument[];
  currentDocument?: OcrDocument;
  onSelect: (index: number) => void;
}

function PageList({ documents, currentDocument, onSelect }: Props) {
  const handleClick = useCallback(
    (evt: React.MouseEvent, index: number) => {
      evt.preventDefault();

      onSelect(index);
    },
    [onSelect],
  );

  return (
    <div className="Pages">
      <ul className="Pages-list">
        {documents.map((doc, index) => (
          <li
            key={doc.id}
            className={cx('Pages-item', doc === currentDocument && 'Pages-item--selected')}
            onClick={(evt) => handleClick(evt, index)}
          >
            <div>
              <img src={doc.pageImage.thumbnailUrlObject} alt="" />
              {doc.isProcessing && (
                <Progress className="Pages-item-progress" percent={100} status="active" showInfo={false} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PageList;
