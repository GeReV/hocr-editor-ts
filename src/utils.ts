import { Block } from 'tesseract.js';
import { BlockType, PageImage } from './types';

export const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(x, max));

const INCLUDES_PARAGRAPHS: string[] = [
  BlockType.CAPTION_TEXT,
  BlockType.FLOWING_TEXT,
  BlockType.PULLOUT_TEXT,
  BlockType.VERTICAL_TEXT,
];

export const canBlockHostChildren = (block: Block) => INCLUDES_PARAGRAPHS.includes(block.blocktype);

const THUMBNAIL_MAX_WIDTH = 120;
const THUMBNAIL_MAX_HEIGHT = 160;

export function truncate(s: string, len: number = 20): string {
  if (s.length <= len) {
    return s;
  }

  // Slice and add ellipsis.
  return `${s.slice(0, len).trim()}\u2026`;
}

export function resizeImage(image: ImageBitmap, width: number, height: number): string | null {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL();
}

export async function loadImage(buffer: ArrayBuffer, mimeType: string): Promise<PageImage | null> {
  const blob = new Blob([buffer], { type: mimeType });

  const img = await createImageBitmap(blob);

  let width = img.width;
  let height = img.height;

  if (width > height) {
    const ratio = THUMBNAIL_MAX_WIDTH / width;

    width = THUMBNAIL_MAX_WIDTH;
    height *= ratio;
  } else {
    const ratio = THUMBNAIL_MAX_HEIGHT / height;

    width *= ratio;
    height = THUMBNAIL_MAX_HEIGHT;
  }

  const thumbnailUrlObject = resizeImage(img, width, height);

  if (!thumbnailUrlObject) {
    return null;
  }

  return {
    image: img,
    urlObject: URL.createObjectURL(blob),
    thumbnailUrlObject,
  };
}

export const createUniqueIdentifier = (): (() => number) => {
  let counter = 0;

  return () => ++counter;
};
