import { Bbox, Block, Line, Paragraph, RecognizeResult, Word } from "tesseract.js";
import {
  BaseTreeItem,
  BlockTreeItem,
  BlockType,
  ElementType,
  LineTreeItem,
  PageTreeItem,
  ParagraphTreeItem
} from "./types";
import { TreeMap } from "./pageReducer";

const INCLUDES_PARAGRAPHS: string[] = [BlockType.CAPTION_TEXT, BlockType.FLOWING_TEXT, BlockType.PULLOUT_TEXT, BlockType.VERTICAL_TEXT];

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

export function buildTree(recognitionResult: RecognizeResult): [BlockTreeItem[], TreeMap] {
  const map: TreeMap = {};

  const blockTreeItems = recognitionResult.data.blocks.map(block => {
    const blockTreeItem: BlockTreeItem = createBlockTreeItem(block);

    if (INCLUDES_PARAGRAPHS.includes(block.blocktype)) {
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
    }

    map[blockTreeItem.id] = blockTreeItem;
    
    return blockTreeItem;
  });
  
  return [blockTreeItems, map];
}

// function buildTree(recognitionResult: RecognizeResult): BlockTreeItem[] {
//   let id = 0;
//
//   return recognitionResult.data.blocks.map(block => {
//     const blockTreeItem: BlockTreeItem = {
//       id: id++,
//       type: ElementType.Block,
//       title: `Block (${block.blocktype})`,
//       parent: null,
//       value: block,
//       parentRelativeOffset: {
//         x: block.bbox.x0,
//         y: block.bbox.y0,
//       },
//       expanded: true,
//     };
//
//     function buildParagraphTree(block: Block): ParagraphTreeItem[] {
//       return block.paragraphs.map((para) => {
//         const paragraphTreeItem: ParagraphTreeItem = {
//           id: id++,
//           type: ElementType.Paragraph,
//           title: para.text,
//           subtitle: "Paragraph",
//           parent: blockTreeItem,
//           value: para,
//           parentRelativeOffset: {
//             x: para.bbox.x0 -block.bbox.x0,
//             y: para.bbox.y0 -block.bbox.y0
//           },
//           expanded: true,
//         };
//
//         paragraphTreeItem.children = para.lines.map((line) => {
//           const lineTreeItem: LineTreeItem = {
//             id: id++,
//             type: ElementType.Line,
//             title: line.text,
//             subtitle: "Line",
//             parent: paragraphTreeItem,
//             value: line,
//             parentRelativeOffset: {
//               x: line.bbox.x0-para.bbox.x0,
//               y: line.bbox.y0-para.bbox.y0
//             },
//             expanded: true,
//           };
//
//           lineTreeItem.children = line.words.map((word) => ({
//             id: id++,
//             type: ElementType.Word,
//             title: word.text,
//             parent: lineTreeItem,
//             value: word,
//             parentRelativeOffset: {
//               x: word.bbox.x0 - line.bbox.x0,
//               y: word.bbox.y0 - line.bbox.y0,
//             },
//             children: [],
//           }));
//
//           return lineTreeItem;
//         });
//
//         return paragraphTreeItem;
//       });
//     }
//
//     blockTreeItem.children = INCLUDES_PARAGRAPHS.includes(block.blocktype) ? buildParagraphTree(block) : [];
//
//     return blockTreeItem;
//   });
// }

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