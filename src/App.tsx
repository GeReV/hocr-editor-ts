import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { useKey } from 'react-use';
import { Button, Col, Dropdown, Layout, Menu, Row } from 'antd';
import React, { useCallback, useState } from 'react';
import { OcrDocument } from './reducer/types';
import { useAppReducer } from './reducerContext';
import {
  createChangeOptions,
  createDeleteNode,
  createRedo,
  createSelectDocuments,
  createUndo,
} from './reducer/actions';
import Header from './components/Header';
import PageCanvas from './components/PageCanvas';
import PageTreeView from './components/PageTreeView';
import PageList from './components/PageList';
import { LogView } from './components/LogView';
import SettingsModal from './components/SettingsModal';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/antd.css';
import './App.css';

library.add(fas);

function App() {
  const [state, dispatch] = useAppReducer();

  const [showSettings, setShowSettings] = useState(false);

  const onSettingsClose = useCallback(() => setShowSettings(false), []);

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
    (ids: string[]) => {
      dispatch(createSelectDocuments(ids));
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
    <>
      <Layout className="App">
        {process.env.REACT_APP_ELECTRON ? null : <Layout.Header className="App-header">hOCR Editor</Layout.Header>}
        <Layout.Content className="App-main">
          <Layout>
            <Layout.Sider className="App-panel" theme="light" width={160}>
              <Header>Pages</Header>
              <PageList
                documents={state.documents}
                selectedDocuments={state.selectedDocuments}
                onSelect={handleSelect}
              />
            </Layout.Sider>
            <Layout.Content className="App-canvas App-panel">
              <PageCanvas
                documents={state.documents}
                document={currentDocument}
                selectedId={state.selectedId}
                dispatch={dispatch}
                isDrawing={state.isDrawing}
                drawRect={state.drawRect}
                lockInteractions={state.lockInteractions}
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
      {process.env.REACT_APP_ELECTRON ? <SettingsModal visible={showSettings} onClose={onSettingsClose} /> : null}
    </>
  );
}

export default App;
