import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, Overlay, Tooltip } from "react-bootstrap";
import { OcrDocument } from "../../reducer/types";
import buildHocrDocument from "../../lib/hocr_builder";
import { PageTreeItem } from "../../types";
import { useCopyToClipboard } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  document?: OcrDocument;
  onClose?: () => void;
  show?: boolean;
}

export default function ExportModal({ document, onClose, show }: Props) {
  const clipboardButtonRef = useRef(null);

  const hocr = useMemo(() => {
    if (!document?.tree) {
      return null;
    }

    const rootTreeItem = document.tree.items[document.tree.rootId] as PageTreeItem;

    const page = rootTreeItem.data;

    const doc = buildHocrDocument(page, {
      width: document.pageImage.image.width,
      height: document.pageImage.image.height,
    });

    const serializer = new XMLSerializer();

    return serializer.serializeToString(doc);
  }, [document]);

  const hocrDownload = useMemo(() => hocr ? `data:text/html;charset=utf-8,${encodeURIComponent(hocr)}` : '#', [hocr]);

  const [showClipboardTooltip, setShowClipboardTooltip] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopyToClipboard = useCallback(() => {
    copyToClipboard(hocr ?? '');
    setShowClipboardTooltip(true);
  }, [hocr, copyToClipboard]);

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
      onHide={onClose}
      show={show}
      size="xl"
      centered
    >
      <Modal.Header
        closeButton
      >
        <Modal.Title>Export hOCR</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {
          hocr && (
            <code>
              <pre>{hocr}</pre>
            </code>
          )
        }
      </Modal.Body>
      <Modal.Footer>
        <Button
          ref={clipboardButtonRef}
          onClick={handleCopyToClipboard}
        >
          <FontAwesomeIcon icon="copy" />
          {' '}
          Copy
        </Button>
        <Overlay
          target={clipboardButtonRef.current}
          show={showClipboardTooltip}
          placement="left"
        >
          {(props) => (
            <Tooltip id="clipboard-copied-tooltip" {...props}>Copied!</Tooltip>
          )}
        </Overlay>

        <Button
          as="a"
          href={hocrDownload}
          download="file.hocr"
        >
          <FontAwesomeIcon icon="file-download" />
          {' '}
          Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
}