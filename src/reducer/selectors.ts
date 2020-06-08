import { State } from './types';

export function isAnyDocumentProcessing(state: State): boolean {
  return state.documents.some((doc) => doc.isProcessing);
}
