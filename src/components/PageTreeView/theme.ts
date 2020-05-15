import { ThemeProps, NodeRendererProps } from 'react-sortable-tree';

import nodeContentRenderer, { Props } from './nodeContentRenderer';
import treeNodeRenderer from './treeNodeRenderer';

type EnhancedThemeProps<P extends NodeRendererProps> = Omit<ThemeProps, 'nodeContentRenderer'> & {
  nodeContentRenderer?: React.ComponentType<P>;
}

const theme: EnhancedThemeProps<Props> = {
  nodeContentRenderer,
  treeNodeRenderer,
  scaffoldBlockPxWidth: 25,
  rowHeight: 25,
  slideRegionSize: 50,
};

export default theme;