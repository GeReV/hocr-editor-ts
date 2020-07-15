import React, { useCallback, useRef, useState } from 'react';
import { Form, Button, Input, Space } from 'antd';
import { useKey } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
  defaultValue?: string;
  onCancel: () => void;
  onSave: (text: string) => void;
}

function TreeNodeTextEditor({ defaultValue, onCancel, onSave }: Props) {
  const editorRef = useRef<Input>(null);

  const [value, setValue] = useState(defaultValue);

  const handleSave = useCallback(() => {
    onSave(value ?? '');
  }, [onSave, value]);

  useKey(
    'Escape',
    () => {
      onCancel();
    },
    undefined,
    [onCancel],
  );

  useKey(
    'Enter',
    () => {
      handleSave();
    },
    undefined,
    [handleSave],
  );

  return (
    <div className="Tree-rowEditor">
      <Form layout="inline">
        <Space>
          <Input
            ref={editorRef}
            type="text"
            defaultValue={value}
            onInput={(evt) => setValue(evt.currentTarget.value)}
            autoFocus
          />
          <Button.Group>
            <Button type="primary" onClick={() => handleSave()} icon={<FontAwesomeIcon icon="check" />} />
            <Button onClick={() => onCancel()} icon={<FontAwesomeIcon icon="times" />} />
          </Button.Group>
        </Space>
      </Form>
    </div>
  );
}

export default TreeNodeTextEditor;
