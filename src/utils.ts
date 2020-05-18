import { BlockType } from "./types";
import { Block } from "tesseract.js";

export const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(x, max));

const INCLUDES_PARAGRAPHS: string[] = [BlockType.CAPTION_TEXT, BlockType.FLOWING_TEXT, BlockType.PULLOUT_TEXT, BlockType.VERTICAL_TEXT];

export const canBlockHostChildren = (block: Block) => INCLUDES_PARAGRAPHS.includes(block.blocktype);