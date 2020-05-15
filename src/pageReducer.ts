import { Bbox, Block, RecognizeResult } from "tesseract.js";
import { createAction } from '@reduxjs/toolkit';
import {
  BaseTreeItem,
  BlockTreeItem,
  ElementType,
  LineTreeItem,
  PageTreeItem,
  ParagraphTreeItem,
  Position
} from "./types";


export interface State {
  tree: BlockTreeItem[] | null;
  selectedId: number | null;
  hoveredId: number | null;
}

export interface UpdateTreeNodePositionPayload extends Position {
  nodeId: number;
}

export enum ActionType {
  Init = 'Init',
  UpdateTree = 'UpdateTree',
  UpdateTreeNodePosition = 'UpdateTreeNodePosition',
  ChangeSelected = 'ChangeSelected',
  ChangeHovered = 'ChangeHovered',
}

export type Action<T extends string, P = void> = { type: T, payload: P };

export type ReducerAction =
  Action<ActionType.Init, RecognizeResult> |
  Action<ActionType.UpdateTree, BlockTreeItem[]> |
  Action<ActionType.UpdateTreeNodePosition, UpdateTreeNodePositionPayload> |
  Action<ActionType.ChangeSelected, number | null> |
  Action<ActionType.ChangeHovered, number | null>;

export const createInit = createAction<RecognizeResult, ActionType.Init>(ActionType.Init);
export const createUpdateTree = createAction<BlockTreeItem[], ActionType.UpdateTree>(ActionType.UpdateTree);
export const createUpdateTreeNodePosition = createAction<(nodeId: number, position: Position) => { payload: UpdateTreeNodePositionPayload }, ActionType.UpdateTreeNodePosition>(
  ActionType.UpdateTreeNodePosition,
  (nodeId, position) => ({ payload: { nodeId, ...position } })
);
export const createChangeSelected = createAction<number | null, ActionType.ChangeSelected>(ActionType.ChangeSelected);
export const createChangeHovered = createAction<number | null, ActionType.ChangeHovered>(ActionType.ChangeHovered);

enum BlockType {
  CAPTION_TEXT = 'CAPTION_TEXT',
  FLOWING_IMAGE = 'FLOWING_IMAGE',
  FLOWING_TEXT = 'FLOWING_TEXT',
  HORZ_LINE = 'HORZ_LINE',
  PULLOUT_IMAGE = 'PULLOUT_IMAGE',
  PULLOUT_TEXT = 'PULLOUT_TEXT',
  VERT_LINE = 'VERT_LINE',
  VERTICAL_TEXT = 'VERTICAL_TEXT',
}

const INCLUDES_PARAGRAPHS: string[] = [BlockType.CAPTION_TEXT, BlockType.FLOWING_TEXT, BlockType.PULLOUT_TEXT, BlockType.VERTICAL_TEXT];

const offsetBbox = (bbox: Bbox, offset: Position): Bbox => ({
  x0: bbox.x0 + offset.x,
  y0: bbox.y0 + offset.y,
  x1: bbox.x1 + offset.x,
  y1: bbox.y1 + offset.y,
});

function buildTree(recognitionResult: RecognizeResult): BlockTreeItem[] {
  let id = 0;

  return recognitionResult.data.blocks.map(block => {
    const blockTreeItem: BlockTreeItem = {
      id: id++,
      type: ElementType.Block,
      title: `Block (${block.blocktype})`,
      parent: null,
      value: block,
      parentRelativeOffset: {
        x: block.bbox.x0,
        y: block.bbox.y0,
      },
      expanded: true,
    };

    function buildParagraphTree(block: Block): ParagraphTreeItem[] {
      return block.paragraphs.map((para) => {
        const paragraphTreeItem: ParagraphTreeItem = {
          id: id++,
          type: ElementType.Paragraph,
          title: para.text,
          subtitle: "Paragraph",
          parent: blockTreeItem,
          value: para,
          parentRelativeOffset: {
            x: para.bbox.x0 -block.bbox.x0,
            y: para.bbox.y0 -block.bbox.y0 
          },
          expanded: true,
        };

        paragraphTreeItem.children = para.lines.map((line) => {
          const lineTreeItem: LineTreeItem = {
            id: id++,
            type: ElementType.Line,
            title: line.text,
            subtitle: "Line",
            parent: paragraphTreeItem,
            value: line,
            parentRelativeOffset: { 
              x: line.bbox.x0-para.bbox.x0,
              y: line.bbox.y0-para.bbox.y0 
            },
            expanded: true,
          };

          lineTreeItem.children = line.words.map((word) => ({
            id: id++,
            type: ElementType.Word,
            title: word.text,
            parent: lineTreeItem,
            value: word,
            parentRelativeOffset: {
              x: word.bbox.x0 - line.bbox.x0,
              y: word.bbox.y0 - line.bbox.y0,
            },
            children: [],
          }));

          return lineTreeItem;
        });

        return paragraphTreeItem;
      });
    }

    blockTreeItem.children = INCLUDES_PARAGRAPHS.includes(block.blocktype) ? buildParagraphTree(block) : [];

    return blockTreeItem;
  });
}

function walkTreeMap<T extends BaseTreeItem<ElementType, any, any>>(tree: T[], transform: (item: T) => T): T[] {
  function walk(item: T): T {
    const transformedItem = transform(item);

    if (transformedItem.children && typeof transformedItem.children !== 'function') {
      transformedItem.children = walkTreeMap(item.children ?? [], transform);
    }

    return transformedItem;
  }

  return tree.map(block => walk(block));
}

function walkTree(tree: PageTreeItem[], action: (item: PageTreeItem) => void): void {
  walkTreeMap(tree, item => {
    action(item);
    return item;
  });
}

// function flattenTree(tree: PageTreeItem[]): Map<number, PageTreeItem> {
//   const items = new Map<number, PageTreeItem>();
//
//   walkTree(tree, item => items.set(item.id, item));
//
//   return items;
// }

export const initialState: State = {
  tree: null,
  selectedId: null,
  hoveredId: null,
};


function updateTreeNodePosition(tree: BlockTreeItem[] | null, nodeId: number, x: number, y: number) {
  if (!tree) {
    return tree;
  }

  function transform<T extends PageTreeItem>(item: T): T {
    const bbox = item.value.bbox;
    const newBbox = {
      x0: x + bbox.x0,
      y0: y + bbox.y0,
      x1: x + bbox.x1,
      y1: y + bbox.y1,
    };
    
    const newBounds: Position = {
      x,
      y,
    };
    
    return {
      ...item,
      value: {
        ...item.value,
        bbox: newBbox,
      },
      parentRelativeOffset: newBounds,
      children: item.children && walkTreeMap(item.children, transform),
    }
  }

  return walkTreeMap(tree, (item) => {
    if (item.id !== nodeId) {
      return item;
    }

    return transform(item)
  });
}

export function reducer(state: State, action: ReducerAction): State {
  switch (action.type) {
    case ActionType.Init: {
      const tree = buildTree(action.payload)

      return {
        tree,
        selectedId: null,
        hoveredId: null,
      };
    }
    case ActionType.ChangeSelected: {
      return {
        ...state,
        selectedId: action.payload,
      };
    }
    case ActionType.ChangeHovered: {
      return {
        ...state,
        hoveredId: action.payload,
      };
    }
    case ActionType.UpdateTree: {
      return {
        ...state,
        tree: action.payload,
      };
    }
    case ActionType.UpdateTreeNodePosition: {
      return {
        ...state,
        tree: updateTreeNodePosition(state.tree, action.payload.nodeId, action.payload.x, action.payload.y),
      }
    }
    default:
      throw new Error(`Unknown action ${action}`);
  }
}