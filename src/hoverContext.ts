import { ItemId } from './types';
import { createStateContext } from 'react-use';


export const [useHoveredState, HoveredStateProvider] = createStateContext<ItemId | null>(null);
