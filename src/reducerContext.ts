import { createReducerContext } from 'react-use';
import { reducer, initialState } from './reducer';

export const [useAppReducer, AppReducerProvider] = createReducerContext(reducer, initialState);