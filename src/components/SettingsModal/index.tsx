import React, { useCallback } from 'react';
import { Form, Modal } from 'antd';
import { Store } from 'antd/lib/form/interface';
import { ipcRenderer } from 'electron';
import { useAsync } from 'react-use';

import { Config } from '../../../electron/config';
import FileSelectionInput from './FileSelectionInput';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: Props) {
  const [form] = Form.useForm();

  const handleOk = useCallback(() => {
    form.submit();
  }, [form]);

  const handleFinish = useCallback(
    async (values: Store) => {
      const { tesseractPath } = values;

      const config: Config = {
        tesseractPath,
      };

      await ipcRenderer.invoke('config', config);

      onClose();
    },
    [onClose],
  );

  const initialValues = useAsync<Config>(() => ipcRenderer.invoke('config'), []);

  return (
    <Modal title="Settings" visible={visible} onOk={handleOk} onCancel={onClose}>
      {initialValues.loading ? (
        'Loading...'
      ) : (
        <Form form={form} initialValues={initialValues.value} onFinish={handleFinish}>
          <Form.Item label="Tesseract Path" name="tesseractPath" rules={[{ required: true }]}>
            <FileSelectionInput />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
