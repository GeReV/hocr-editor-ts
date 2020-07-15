import {
  BaseTreeItem,
  Block,
  BlockTreeItem,
  DocumentTreeItem,
  ElementType,
  Graphic,
  ItemId,
  Line,
  LineTreeItem,
  OcrElement,
  Page,
  PageTreeItem,
  Paragraph,
  ParagraphTreeItem,
  Word,
} from './types';
import { TreeItems } from './reducer/types';
import assert from './lib/assert';

const createTreeItem = <T extends ElementType, V extends OcrElement<any>, P extends BaseTreeItem<ElementType, any>>(
  type: T,
  parent: P | null,
  data: V,
): BaseTreeItem<T, V> => ({
  id: data.id,
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
  id: page.id,
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

const createGraphicTreeItem = (parent: PageTreeItem, graphic: Graphic) =>
  createTreeItem(ElementType.Graphic, parent, graphic);

const createParagraphTreeItem = (parent: BlockTreeItem, para: Paragraph) =>
  createTreeItem(ElementType.Paragraph, parent, para);

const createLineTreeItem = (parent: ParagraphTreeItem, line: Line) => createTreeItem(ElementType.Line, parent, line);

const createWordTreeItem = (parent: LineTreeItem, word: Word) => createTreeItem(ElementType.Word, parent, word);

function assertIsBlock(block: DocumentTreeItem): asserts block is BlockTreeItem {
  assert(block.type === ElementType.Block, 'Item is of type %s, expected block.', block.data.type);
}

export function buildTree(page: Page): [ItemId, TreeItems] {
  const map: TreeItems = {};

  const root = createRootTreeItem(page);

  map[root.id] = root;

  root.children = page.children.map((block) => {
    const treeItem = block.type === 'block' ? createBlockTreeItem(root, block) : createGraphicTreeItem(root, block);

    map[treeItem.id] = treeItem;

    // if (!canBlockHostChildren(block)) {
    //   return blockTreeItem.id;
    // }

    if (block.type === 'graphic') {
      return treeItem.id;
    }

    assertIsBlock(treeItem);

    treeItem.children = block.children.map((para) => {
      const paragraphTreeItem: ParagraphTreeItem = createParagraphTreeItem(treeItem, para);

      paragraphTreeItem.children = para.children.map((line) => {
        const lineTreeItem: LineTreeItem = createLineTreeItem(paragraphTreeItem, line);

        lineTreeItem.children = line.children.map((word) => {
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

    return treeItem.id;
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
