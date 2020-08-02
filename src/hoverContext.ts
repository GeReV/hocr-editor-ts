import { createStateContext } from 'react-use';

import { ItemId } from './types';

export const [useHoveredState, HoveredStateProvider] = createStateContext<ItemId | null>(null);
