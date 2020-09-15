import React, { useCallback } from 'react';
import cx from 'classnames';
import { Menu, Progress } from 'antd';
import { OcrDocument } from '../../reducer/types';

import './index.scss';

interface Props {
  documents: OcrDocument[];
  selectedDocuments: Set<string>;
  onSelect: (selectedKeys: string[]) => void;
}

function PageList({ documents, selectedDocuments, onSelect }: Props) {
  const handleClick = useCallback<(args: { key: React.Key; domEvent: React.MouseEvent<HTMLElement> }) => void>(
    ({ key, domEvent }) => {
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

  return (
    <div className="Pages">
      <Menu className="Pages-list" onClick={handleClick} selectedKeys={Array.from(selectedDocuments)}>
        {documents.map((doc, index) => (
          <Menu.Item
            key={doc.id}
            className={cx('Pages-item', selectedDocuments.has(doc.id.toString()) && 'Pages-item--selected')}
          >
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
