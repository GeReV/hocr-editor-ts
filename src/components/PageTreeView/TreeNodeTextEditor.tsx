import React, { useCallback, useRef } from "react";
import { Button, Col, Form } from "react-bootstrap";
import { useKey } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  defaultValue?: string;
  onCancel: () => void;
  onSave: (text: string) => void;
}

function TreeNodeTextEditor({ defaultValue, onCancel, onSave }: Props) {
  const editorRef = useRef<HTMLInputElement | null>(null);

  const handleSave = useCallback(() => {
    const text = editorRef.current?.value ?? '';

    onSave(text);
  }, [onSave]);

  useKey('Escape', () => {
    onCancel();
  }, undefined, [onCancel]);

  useKey('Enter', () => {
    handleSave();
  }, undefined, [handleSave]);

  return (
    <Form className="Tree-rowEditor">
      <Form.Row>
        <Col xs={true}>
          <Form.Control
            ref={editorRef}
            type="text"
            size="sm"
            defaultValue={defaultValue}
            autoFocus
          />
        </Col>
        <Col xs="auto">
          <Button
            type="submit"
            variant="success"
            size="sm"
            onClick={() => handleSave()}
          >
            <FontAwesomeIcon icon="check" />
          </Button>
          {' '}
          <Button
            variant="light"
            size="sm"
            onClick={() => onCancel()}
          >
            <FontAwesomeIcon icon="times" />
          </Button>
        </Col>
      </Form.Row>
    </Form>
  );
}

export default TreeNodeTextEditor;