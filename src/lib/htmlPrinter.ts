function printOpeningTag(el: Element): string {
  let attributes = '';

  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];

    attributes += ` ${attr.name}="${attr.value}"`;
  }

  return `<${el.tagName.toLowerCase()}${attributes}>`;
}

function printClosingTag(el: Element): string {
  return `</${el.tagName.toLowerCase()}>`;
}

type Whitespace = ' ' | '  ' | '    ' | '\t';

function isSelfClosingTag(tagName: string) {
  const tagNameLower = tagName.toLowerCase();

  // https://developer.mozilla.org/en-US/docs/Glossary/Empty_element
  return (
    tagNameLower === 'area' ||
    tagNameLower === 'base' ||
    tagNameLower === 'br' ||
    tagNameLower === 'col' ||
    tagNameLower === 'embed' ||
    tagNameLower === 'hr' ||
    tagNameLower === 'img' ||
    tagNameLower === 'input' ||
    tagNameLower === 'link' ||
    tagNameLower === 'meta' ||
    tagNameLower === 'param' ||
    tagNameLower === 'source' ||
    tagNameLower === 'track' ||
    tagNameLower === 'wbr'
  );
}

function printElement(el: Element, level: number, whitespace: Whitespace = ' '): string {
  const padding = whitespace.repeat(level * 2);

  let html = '';

  html += padding;
  html += printOpeningTag(el);

  if (!el.children.length && isSelfClosingTag(el.tagName)) {
    html = html.replace(/>$/, ' />');
  } else if (el.children.length) {
    html += '\n';

    for (let i = 0; i < el.children.length; ++i) {
      html += printElement(el.children[i], level + 1);
    }

    html += padding;
    html += printClosingTag(el);
  } else {
    html += el.textContent;
    html += printClosingTag(el);
  }

  html += '\n';

  return html;
}

export default function printHtml(doc: Document): string {
  return printElement(doc.documentElement, 0);
}
