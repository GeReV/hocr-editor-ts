import { Bbox, Block, Line, Page, Paragraph, RecognizeResult, Word } from 'tesseract.js';
import {
  BaseTreeItem,
  BlockTreeItem,
  DocumentTreeItem,
  ElementType,
  ItemId,
  LineTreeItem,
  PageTreeItem,
  ParagraphTreeItem,
} from './types';
import { TreeItems } from './reducer/types';
import { canBlockHostChildren } from './utils';

let id = 0;

const createTreeItem = <T extends ElementType, V extends { bbox: Bbox }, P extends BaseTreeItem<ElementType, any>>(
  type: T,
  parent: P | null,
  data: V,
): BaseTreeItem<T, V> => ({
  id: String(id++),
  type,
  parentId: parent?.id.toString() ?? null,
  data: data,
  parentRelativeOffset:
    parent?.type === ElementType.Page
      ? {
          x: data.bbox.x0,
          y: data.bbox.y0,
        }
      : {
          x: data.bbox.x0 - (parent?.data.bbox.x0 ?? 0),
          y: data.bbox.y0 - (parent?.data.bbox.y0 ?? 0),
        },
  children: [],
  isExpanded: type === ElementType.Block || type === ElementType.Paragraph,
});

const createRootTreeItem = (page: Page): PageTreeItem => ({
  id: String(id++),
  type: ElementType.Page,
  parentId: null,
  data: page,
  parentRelativeOffset: {
    x: 0,
    y: 0,
  },
  children: [],
  isExpanded: true,
});

const createBlockTreeItem = (parent: PageTreeItem, block: Block) => createTreeItem(ElementType.Block, parent, block);

const createParagraphTreeItem = (parent: BlockTreeItem, para: Paragraph) =>
  createTreeItem(ElementType.Paragraph, parent, para);

const createLineTreeItem = (parent: ParagraphTreeItem, line: Line) => createTreeItem(ElementType.Line, parent, line);

const createWordTreeItem = (parent: LineTreeItem, word: Word) => createTreeItem(ElementType.Word, parent, word);

export function buildTree(recognitionResult: RecognizeResult): [ItemId, TreeItems] {
  const map: TreeItems = {};

  const root = createRootTreeItem(recognitionResult.data);

  map[root.id] = root;

  root.children = recognitionResult.data.blocks.map((block) => {
    const blockTreeItem: BlockTreeItem = createBlockTreeItem(root, block);

    map[blockTreeItem.id] = blockTreeItem;

    if (!canBlockHostChildren(block)) {
      return blockTreeItem.id;
    }

    blockTreeItem.children = block.paragraphs.map((para) => {
      const paragraphTreeItem: ParagraphTreeItem = createParagraphTreeItem(blockTreeItem, para);

      paragraphTreeItem.children = para.lines.map((line) => {
        const lineTreeItem: LineTreeItem = createLineTreeItem(paragraphTreeItem, line);

        lineTreeItem.children = line.words.map((word) => {
          const wordTreeItem = createWordTreeItem(lineTreeItem, word);

          map[wordTreeItem.id] = wordTreeItem;

          return wordTreeItem.id;
        });

        map[lineTreeItem.id] = lineTreeItem;

        return lineTreeItem.id;
      });

      map[paragraphTreeItem.id] = paragraphTreeItem;

      return paragraphTreeItem.id;
    });

    return blockTreeItem.id;
  });

  return [root.id, map];
}

export function walkChildren(children: ItemId[], map: TreeItems, action: (item: DocumentTreeItem) => void): void {
  function resolveChild(childId: ItemId): DocumentTreeItem {
    const child = map[childId.toString()];

    if (!child) {
      throw new Error(`Could not find child with ID ${childId} in tree.`);
    }

    return child;
  }

  walkTree(children.map(resolveChild), map, action);
}

export function walkTree(tree: DocumentTreeItem[], map: TreeItems, action: (item: DocumentTreeItem) => void): void {
  function walk(item: DocumentTreeItem): void {
    action(item);

    walkChildren(item.children, map, action);
  }

  tree.forEach((block) => walk(block));
}
