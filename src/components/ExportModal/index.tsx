import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Overlay, Tooltip } from 'react-bootstrap';
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism';
import { useCopyToClipboard } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { OcrDocument } from '../../reducer/types';
import { PageTreeItem } from '../../types';
import buildHocrDocument from '../../lib/hocrBuilder';
import printHtml from '../../lib/htmlPrinter';

interface Props {
  document?: OcrDocument;
  onClose?: () => void;
  show?: boolean;
}

export default function ExportModal({ document, onClose, show }: Props) {
  const clipboardButtonRef = useRef(null);

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
      width: document.pageImage.image.width,
      height: document.pageImage.image.height,
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
    <Modal onHide={onClose} show={show} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Export hOCR</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {hocr && (
          <SyntaxHighlighter language="markup" style={prism}>
            {hocr}
          </SyntaxHighlighter>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button ref={clipboardButtonRef} onClick={handleCopyToClipboard}>
          <FontAwesomeIcon icon="copy" /> Copy
        </Button>
        <Overlay target={clipboardButtonRef.current} show={showClipboardTooltip} placement="left">
          {(props) => (
            <Tooltip id="clipboard-copied-tooltip" {...props}>
              Copied!
            </Tooltip>
          )}
        </Overlay>

        <Button as="a" href={hocrDownload} download="file.hocr">
          <FontAwesomeIcon icon="file-download" /> Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
