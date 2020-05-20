import { ThemeProps } from 'react-sortable-tree';

import nodeContentRenderer from './nodeContentRenderer';
import treeNodeRenderer from './treeNodeRenderer';

const theme: ThemeProps = {
  nodeContentRenderer,
  treeNodeRenderer,
  scaffoldBlockPxWidth: 24,
  rowHeight: 24,
  slideRegionSize: 48,
};

export default theme;