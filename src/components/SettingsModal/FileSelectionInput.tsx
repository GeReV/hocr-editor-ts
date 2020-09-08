import React, { useCallback } from 'react';
import { Button, Col, Input, Row } from 'antd';
import { ipcRenderer } from 'electron';

interface Props {
  value?: string | undefined;
  onChange?: (value: string) => void;
}

export default function FileSelectionInput({ value, onChange }: Props) {
  const handleChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(evt.currentTarget.value);
      }
    },
    [onChange],
  );

  const onBrowse = useCallback(async () => {
    const result: string | null = await ipcRenderer.invoke('browse');

    if (result && onChange) {
      onChange(result);
    }
  }, [onChange]);

  return (
    <Row gutter={8}>
      <Col flex={1}>
        <Input placeholder="Choose path" value={value} onChange={handleChange} />
      </Col>
      <Col>
        <Button onClick={onBrowse}>Browse</Button>
      </Col>
    </Row>
  );
}
