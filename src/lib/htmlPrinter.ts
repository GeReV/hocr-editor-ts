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

function printElement(el: Element, level: number): string {
  const padding = ' '.repeat(level * 2);

  let html = '';

  html += padding;
  html += printOpeningTag(el);

  if (el.children.length) {
    html += '\n';

    for (let i = 0; i < el.children.length; ++i) {
      html += printElement(el.children[i], level + 1);
    }

    html += padding;
    html += printClosingTag(el);
    html += '\n';
  } else if (el.textContent) {
    html += el.textContent;
    html += printClosingTag(el);
    html += '\n';
  } else {
    html = html.replace(/>$/, ' />');
  }

  return html;
}

export default function printHtml(doc: Document): string {
  return printElement(doc.documentElement, 0);
}