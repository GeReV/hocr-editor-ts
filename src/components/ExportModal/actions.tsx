import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';

interface Props {
  hocr: string | null;
}

export default function ExportActions({ hocr }: Props) {
  const hocrDownload = useMemo(() => (hocr ? `data:text/html;charset=utf-8,${encodeURIComponent(hocr)}` : '#'), [hocr]);

  return (
    <Button type="primary" href={hocrDownload} download="file.hocr" icon={<FontAwesomeIcon icon="file-download" />}>
      Download
    </Button>
  );
}
