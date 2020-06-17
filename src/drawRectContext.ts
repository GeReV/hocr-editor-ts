import { createStateContext } from 'react-use';
import { IRect } from 'konva/types/types';

const empty: IRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

export const [useDrawRectContext, DrawRectProvider] = createStateContext<IRect>(empty);
