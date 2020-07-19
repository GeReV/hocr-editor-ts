import React, { useCallback } from 'react';
import { Button, Col, Dropdown, Layout, Menu, Row } from 'antd';
import { useKey } from 'react-use';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OcrDocument } from './reducer/types';
import { useAppReducer } from './reducerContext';
import { createChangeOptions, createDeleteNode, createRedo, createSelectDocument, createUndo } from './reducer/actions';
import Header from './components/Header';
import PageCanvas from './components/PageCanvas';
import PageTreeView from './components/PageTreeView';
import PageList from './components/PageList';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/antd.css';
import './App.css';
import { LogView } from './components/LogView';

library.add(fas);

function App() {
  const [state, dispatch] = useAppReducer();

  useKey(
    'Delete',
    () => {
      if (state.selectedId === null) {
        return;
      }

      dispatch(createDeleteNode(state.selectedId));
    },
    undefined,
    [state.selectedId],
  );

  useKey(
    (evt) => evt.key === 'z' && (evt.ctrlKey || evt.metaKey),
    () => {
      dispatch(createUndo());
    },
    undefined,
    [dispatch],
  );

  useKey(
    (evt) => {
      const cmdShiftZ = evt.key.toLowerCase() === 'z' && (evt.ctrlKey || evt.metaKey) && evt.shiftKey;
      const ctrlY = evt.key === 'y' && evt.ctrlKey;

      return cmdShiftZ || ctrlY;
    },
    () => {
      dispatch(createRedo());
    },
    undefined,
    [dispatch],
  );

  const handleSelect = useCallback(
    (id: string) => {
      dispatch(createSelectDocument(id));
    },
    [dispatch],
  );

  const changeAutoResizeNodes = useCallback(
    () => dispatch(createChangeOptions({ autoResizeNodes: !state.options.autoResizeNodes })),
    [dispatch, state.options.autoResizeNodes],
  );

  const changeAutoDeleteEmptyNodes = useCallback(
    () => dispatch(createChangeOptions({ autoDeleteEmptyNodes: !state.options.autoDeleteEmptyNodes })),
    [dispatch, state.options.autoDeleteEmptyNodes],
  );

  const currentDocument: OcrDocument = state.documents[state.currentDocument];

  const hierarchyOptionsMenu = (
    <Menu>
      <Menu.Item
        onClick={changeAutoResizeNodes}
        icon={state.options.autoResizeNodes && <FontAwesomeIcon icon="check" />}
      >
        Auto-resize boxes after changes
      </Menu.Item>
      <Menu.Item
        onClick={changeAutoDeleteEmptyNodes}
        icon={state.options.autoDeleteEmptyNodes && <FontAwesomeIcon icon="check" />}
      >
        Auto-delete empty elements
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout className="App">
      <Layout.Header className="App-header">hOCR Editor</Layout.Header>
      <Layout.Content className="App-main">
        <Layout>
          <Layout.Sider className="App-panel" theme="light" width={160}>
            <Header>Pages</Header>
            <PageList documents={state.documents} currentDocument={currentDocument} onSelect={handleSelect} />
          </Layout.Sider>
          <Layout.Content className="App-canvas App-panel">
            <PageCanvas
              documents={state.documents}
              document={currentDocument}
              selectedId={state.selectedId}
              dispatch={dispatch}
              isDrawing={state.isDrawing}
              drawRect={state.drawRect}
              hasUndo={!!(state.snapshots.length && state.currentSnapshot > 0)}
              hasRedo={!!(state.snapshots.length && state.currentSnapshot < state.snapshots.length - 1)}
            />
          </Layout.Content>
          <Layout.Sider className="App-tree App-panel" theme="light" width={320}>
            <Header>
              <Row>
                <Col flex="auto">Hierarchy</Col>
                <Col>
                  <Dropdown overlay={hierarchyOptionsMenu} trigger={['click']}>
                    <Button type="text" size="small" icon={<FontAwesomeIcon icon="caret-down" />} />
                  </Dropdown>
                </Col>
              </Row>
            </Header>
            <PageTreeView currentDocument={currentDocument} selectedId={state.selectedId} dispatch={dispatch} />
          </Layout.Sider>
        </Layout>
      </Layout.Content>
      <Layout.Footer className="App-footer">
        <LogView lastUpdate={state.lastRecognizeUpdate} />
      </Layout.Footer>
    </Layout>
  );
}

export default App;
