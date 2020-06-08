import { OcrDocument } from './types';

export function isAnyDocumentProcessing(documents: OcrDocument[]): boolean {
  return documents.some((doc) => doc.isProcessing);
}
