import { Bbox, Block, Line, Paragraph, RecognizeResult, Word } from "tesseract.js";
import {
  BaseTreeItem,
  BlockTreeItem,
  ElementType,
  LineTreeItem,
  PageTreeItem,
  ParagraphTreeItem
} from "./types";
import { TreeMap } from "./pageReducer";
import { canBlockHostChildren } from "./utils";

let id = 0;

const createTreeItem = <T extends ElementType, V extends { bbox: Bbox }, P extends BaseTreeItem<ElementType, any>>(type: T, parent: P | null, value: V): BaseTreeItem<T, V> => ({
  id: id++,
  type,
  parentId: parent?.id ?? null,
  value,
  parentRelativeOffset: {
    x: value.bbox.x0 - (parent?.value.bbox.x0 ?? 0),
    y: value.bbox.y0 - (parent?.value.bbox.y0 ?? 0),
  },
  children: [],
});

const createBlockTreeItem = (block: Block) => createTreeItem(ElementType.Block, null, block);

const createParagraphTreeItem = (parent: BlockTreeItem, para: Paragraph) => createTreeItem(ElementType.Paragraph, parent, para);

const createLineTreeItem = (parent: ParagraphTreeItem, line: Line) => createTreeItem(ElementType.Line, parent, line);

const createWordTreeItem = (parent: LineTreeItem, word: Word) => createTreeItem(ElementType.Word, parent, word);

export function buildTree(recognitionResult: RecognizeResult): [number[], TreeMap] {
  const map: TreeMap = {};

  const blockTreeItems = recognitionResult.data.blocks.map(block => {
    const blockTreeItem: BlockTreeItem = createBlockTreeItem(block);

    map[blockTreeItem.id] = blockTreeItem;
    
    if (!canBlockHostChildren(block)) {
      return blockTreeItem.id;
    }
    
    blockTreeItem.children = block.paragraphs.map(para => {
      const paragraphTreeItem: ParagraphTreeItem = createParagraphTreeItem(blockTreeItem, para);

      paragraphTreeItem.children = para.lines.map((line) => {
        const lineTreeItem: LineTreeItem = createLineTreeItem(paragraphTreeItem, line);

        lineTreeItem.children = line.words.map((word) => {
          const wordTreeItem = createWordTreeItem(lineTreeItem, word)

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
  
  console.log(blockTreeItems, map);

  return [blockTreeItems, map];
}

export function walkChildren(children: number[], map: TreeMap, action: (item: PageTreeItem) => void): void {
  function resolveChild(childId: number): PageTreeItem {
    const child = map[childId];

    if (!child) {
      throw new Error(`Could not find child with ID ${childId} in tree.`);
    }

    return child;
  }

  walkTree(children.map(resolveChild), map, action);
}

export function walkTree(tree: PageTreeItem[], map: TreeMap, action: (item: PageTreeItem) => void): void {

  function walk(item: PageTreeItem): void {
    action(item);

    walkChildren(item.children, map, action);
  }

  tree.forEach(block => walk(block));
}