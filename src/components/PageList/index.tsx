import React, { useCallback } from 'react';
import cx from 'classnames';
import { Menu, Progress } from 'antd';

import { OcrDocument } from '../../reducer/types';
import './index.scss';

interface Props {
  documents: OcrDocument[];
  currentDocument?: OcrDocument;
  onSelect: (documentId: string) => void;
}

function PageList({ documents, currentDocument, onSelect }: Props) {
  const handleClick = useCallback<(args: { key: React.Key; domEvent: React.MouseEvent<HTMLElement> }) => void>(
    ({ key, domEvent }) => {
      domEvent.preventDefault();

      onSelect(key.toString());
    },
    [onSelect],
  );

  return (
    <div className="Pages">
      <Menu
        className="Pages-list"
        onClick={handleClick}
        selectedKeys={currentDocument?.id ? [currentDocument?.id.toString()] : []}
      >
        {documents.map((doc, index) => (
          <Menu.Item key={doc.id} className={cx('Pages-item', doc === currentDocument && 'Pages-item--selected')}>
            <div className="Pages-item-content">
              {doc.pageImage && <img src={doc.pageImage.thumbnailUrlObject} alt="" />}
              {doc.isProcessing && (
                <Progress className="Pages-item-progress" percent={100} status="active" showInfo={false} />
              )}
            </div>
          </Menu.Item>
        ))}
      </Menu>
    </div>
  );
}

export default PageList;
