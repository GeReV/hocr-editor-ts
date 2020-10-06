import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { OcrDocument } from '../../reducer/types';

export enum ExportType {
  Zip = 'zip',
  Folder = 'folder',
}

export interface ExportMessage {
  type: ExportType;
  hocr: string;
  images: string[];
}

interface Props {
  hocr: string | null;
  documents: OcrDocument[];
}

async function saveAs(type: ExportType, hocr: string, images: string[]) {
  const { ipcRenderer } = await import('electron');

  const message: ExportMessage = {
    type,
    hocr,
    images,
  };

  await ipcRenderer.invoke('export', message);
}

export default function ExportActions({ hocr, documents }: Props) {
  const handleSaveZip = useCallback(async () => {
    if (!hocr) {
      return;
    }

    const images = documents.map((doc) => doc.pageImage?.path).filter(Boolean);

    await saveAs(ExportType.Zip, hocr, images);
  }, [documents, hocr]);

  const handleSaveFolder = useCallback(async () => {
    if (!hocr) {
      return;
    }

    const images = documents.map((doc) => doc.pageImage?.path).filter(Boolean);

    await saveAs(ExportType.Folder, hocr, images);
  }, [documents, hocr]);

  return (
    <>
      <Button type="primary" icon={<FontAwesomeIcon icon="file-archive" />} onClick={handleSaveZip}>
        Save as Zip
      </Button>
      <Button type="primary" icon={<FontAwesomeIcon icon="folder" />} onClick={handleSaveFolder}>
        Save as folder
      </Button>
    </>
  );
}
