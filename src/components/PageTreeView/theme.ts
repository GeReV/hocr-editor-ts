import { ThemeProps, NodeRendererProps } from 'react-sortable-tree';

import nodeContentRenderer, { Props } from './nodeContentRenderer';
import treeNodeRenderer from './treeNodeRenderer';

const theme: ThemeProps = {
  nodeContentRenderer,
  treeNodeRenderer,
  scaffoldBlockPxWidth: 25,
  rowHeight: 25,
  slideRegionSize: 50,
};

export default theme;