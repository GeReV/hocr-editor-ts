

import { PageImage, Block, Direction, Line, Page, Paragraph, Word, Graphic, BlockType } from '../types';
import { createUniqueIdentifier } from '../utils';
import * as t from 'tesseract.js';

const isGraphic = (block: t.Block) =>
  block.blocktype === BlockType.PULLOUT_IMAGE ||
  block.blocktype === BlockType.FLOWING_IMAGE ||
  block.blocktype === BlockType.HEADING_IMAGE;

const isRuler = (block: t.Block) => block.blocktype === BlockType.HORZ_LINE || block.blocktype === BlockType.VERT_LINE;

export function convertPage(page: t.Page, image: PageImage): Page {
  const blockCounter = createUniqueIdentifier();
  const paragraphCounter = createUniqueIdentifier();
  const lineCounter = createUniqueIdentifier();
  const wordCounter = createUniqueIdentifier();

  function convertWord(word: t.Word): Word {
    return {
      type: 'word',
      id: `word_1_${wordCounter()}`,
      bbox: word.bbox,
      language: word.language,
      size: word.font_size,
      text: word.text,
      confidence: word.confidence,
    };
  }

  function convertLine(line: t.Line): Line {
    return {
      type: 'line',
      bbox: line.bbox,
      id: `line_1_${lineCounter()}`,
      size: null,
      ascenders: null,
      descenders: null,
      baseline: null,
      children: line.words.map(convertWord),
    };
  }

  function convertParagraph(para: t.Paragraph): Paragraph {
    return {
      type: 'paragraph',
      bbox: para.bbox,
      id: `par_1_${paragraphCounter()}`,
      direction: para.is_ltr ? Direction.Ltr : Direction.Rtl,
      children: para.lines.map(convertLine),
    };
  }

  function convertBlock(block: t.Block): Block | Graphic {
    return {
      type: isGraphic(block) ? 'graphic' : 'block',
      id: `carea_1_${blockCounter()}`,
      bbox: block.bbox,
      children: block.paragraphs.map(convertParagraph),
    };
  }

  return {
    type: 'page',
    id: 'page_1',
    version: page.version,
    title: '',
    rotation: 0,
    image: null,
    bbox: {
      x0: 0,
      y0: 0,
      x1: image.width,
      y1: image.height,
    },
    resolution: null,
    page_number: 1,
    children: page.blocks.filter((b) => !isRuler(b)).map(convertBlock),
  };
}
