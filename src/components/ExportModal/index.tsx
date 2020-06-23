import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Space, Tooltip } from 'antd';
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism';
import { useCopyToClipboard } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { OcrDocument } from '../../reducer/types';
import { PageTreeItem } from '../../types';
import buildHocrDocument from '../../lib/hocrBuilder';
import printHtml from '../../lib/htmlPrinter';

import './index.css';

interface Props {
  document?: OcrDocument;
  onClose?: () => void;
  show?: boolean;
}

export default function ExportModal({ document, onClose, show }: Props) {
  const [hocr, setHocr] = useState<string | null>(null);

  const hocrDownload = useMemo(() => (hocr ? `data:text/html;charset=utf-8,${encodeURIComponent(hocr)}` : '#'), [hocr]);

  const [showClipboardTooltip, setShowClipboardTooltip] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopyToClipboard = useCallback(() => {
    copyToClipboard(hocr ?? '');
    setShowClipboardTooltip(true);
  }, [hocr, copyToClipboard]);

  useEffect(() => {
    if (!document?.tree || !show || !!hocr) {
      return;
    }

    const rootTreeItem = document.tree.items[document.tree.rootId] as PageTreeItem;

    const page = rootTreeItem.data;

    const size = {
      width: document.pageImage.width,
      height: document.pageImage.height,
    };

    const doc = buildHocrDocument(page, size, document.filename);

    setHocr(printHtml(doc));
  }, [document, show, hocr]);

  useEffect(() => {
    let timeoutId: number;

    if (showClipboardTooltip) {
      timeoutId = window.setTimeout(() => setShowClipboardTooltip(false), 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showClipboardTooltip]);

  return (
    <Modal
      onCancel={onClose}
      onOk={onClose}
      visible={show}
      centered
      title="Export hOCR"
      className="ExportModal"
      width={960}
      footer={
        <Space>
          <Tooltip title="Copied!" placement="left" trigger={[]} visible={showClipboardTooltip}>
            <Button type="primary" onClick={handleCopyToClipboard} icon={<FontAwesomeIcon icon="copy" />}>
              Copy
            </Button>
          </Tooltip>
          <Button
            type="primary"
            href={hocrDownload}
            download="file.hocr"
            icon={<FontAwesomeIcon icon="file-download" />}
          >
            Download
          </Button>
        </Space>
      }
    >
      {hocr && (
        <SyntaxHighlighter language="markup" style={prism}>
          {hocr}
        </SyntaxHighlighter>
      )}
    </Modal>
  );
}
