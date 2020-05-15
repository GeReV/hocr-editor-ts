import { createReducerContext } from 'react-use';
import { reducer, initialState } from './pageReducer';

export const [useAppReducer, AppReducerProvider] = createReducerContext(reducer, initialState);