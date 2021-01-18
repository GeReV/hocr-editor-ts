import { reducer, initialState } from './reducer';
import { createReducerContext } from 'react-use';


export const [useAppReducer, AppReducerProvider, AppReducerContext] = createReducerContext(reducer, initialState);
