// src/lib/markdown-html-util.ts

// This utility is intent for server side.

import Turndown from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
// import { marked } from 'marked';
// import type { Token, Tokens } from 'marked';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import { convert as htmlToText } from 'html-to-text';

// Initialize and configure turndown service
const turndownService = new Turndown({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  hr: '---',
}).use(gfm);

// Add custom rule for images to ensure consistent formatting
// turndownService.addRule('imageRule', {
//   filter: 'img',
//   replacement: (_, node: Turndown.Node) => {
//     const img = node as HTMLImageElement;
//     const alt = img.getAttribute('alt') || '';
//     const src = img.getAttribute('src') || '';
//     return `![${alt}](${src})`;
//   }
// });
turndownService.addRule('imageRule', {
  filter: 'img',
  replacement: (_, node) => {
    const img = node as HTMLElement;
    const alt = img.getAttribute('alt') || '';
    const src = img.getAttribute('src') || '';
    return `![${alt}](${src})`;
  }
});

/**
 * Converts HTML to GitHub-Flavored Markdown
 */
export async function htmlToMarkdown(html: string) {
  if (!html) return '';

  try {
    const cleanedHtml = html
      .replace(/<\/div>/gi, '\n</div>')
      .replace(/<\/p>/gi, '\n</p>')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/g, ' ');
    return turndownService.turndown(cleanedHtml);
  } catch (error) {
    console.error('HTML to Markdown conversion failed', error, html);
    return html;
  }
}

// function createMarkdownRenderer() {
//   const renderer = new marked.Renderer();

//   renderer.listitem = function (item: Tokens.ListItem) {
//     // Create a parser instance to process inner tokens
//     const parseTokens = new marked.Parser({
//       renderer: new marked.Renderer(),
//       gfm: true
//     });

//     // Process tokens if available, otherwise use raw text
//     const content = item.tokens && item.tokens.length > 0
//       ? parseTokens.parseInline(item.tokens)
//       : item.text;

//     if (item.task) {
//       return `<li><input type="checkbox"${item.checked ? ' checked' : ''}>${content}</li>`;
//     }
//     return `<li>${content}</li>`;
//   };

//   return renderer;
// }



/**
 * Converts Markdown to HTML with proper inline formatting
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  // if (!markdown) return '';

  // const options = {
  //   renderer: createMarkdownRenderer(),
  //   breaks: true,
  //   gfm: true
  // };

  // return marked.parse(markdown.trim(), options) as Promise<string>;

  if (!markdown) return '';

  const result = await unified()
    .use(remarkParse)         // Parse Markdown
    .use(remarkGfm)          // Support GFM (tables, task lists, etc.)
    .use(remarkHtml, {       // Convert to HTML
      sanitize: false,       // Keep all HTML
      closeSelfClosing: true // Proper HTML syntax
    })
    .process(markdown.trim());

  return result.toString();
}


// Define custom formatter types
type FormatterContext = {
  addInline: (text: string) => void;
  addBlock: (text: string) => void;
};

type Walker = (nodes: any[], context: FormatterContext) => void;

type Formatter = (
  elem: { attribs: Record<string, string>; children?: any[] },
  walk: Walker,
  context: FormatterContext,
  options: Record<string, any>
) => void;


/**
 * Converts HTML to plain text with proper whitespace handling
 */
export async function htmlToPlainText(html: string) {
  if (!html) return '';

  return htmlToText(html, {
    wordwrap: false,
    preserveNewlines: false,
    formatters: {
      imgFormatter: ((elem, _walk, builder) => {
        const alt = elem.attribs.alt || '';
        builder.addInline(alt);
      }) as Formatter,
    },
    selectors: [
      {
        selector: 'img',
        format: 'imgFormatter'
      },
      {
        selector: 'a',
        options: {
          ignoreHref: true
        }
      },
      {
        selector: 'ul',
        options: { itemPrefix: ' ' } // Remove asterisk prefix for lists
      },
      {
        selector: 'ol',
        options: { itemPrefix: ' ' } // Remove numbers for lists
      },
      { selector: 'h1', options: { uppercase: false } },
      { selector: 'h2', options: { uppercase: false } },
      { selector: 'h3', options: { uppercase: false } },
      { selector: 'h4', options: { uppercase: false } },
      { selector: 'h5', options: { uppercase: false } },
      { selector: 'h6', options: { uppercase: false } },
    ]
  })
    .replace(/\s+/g, ' ')   // Collapse multiple whitespaces
    .trim();
}


/**
 * Converts Markdown to plain text with proper formatting stripping
 */
export async function markdownToPlainText(markdown: string | undefined): Promise<string> {
  if (!markdown) return '';
  const html = await markdownToHtml(markdown);
  return htmlToPlainText(html);
}

/**
 * Normalizes whitespace in a string
 */
function normalizeWhitespace(text: string | undefined): string {

  if (!text) return '';

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Compares two markdown strings with configurable formatting sensitivity
 */
export async function compareMarkdown(
  markdown1: string | undefined,
  markdown2: string | undefined,
  ignoreFormat: boolean = true
): Promise<boolean> {

  if (markdown1 === undefined && markdown2 === undefined) {
    return true;
  }

  if ((markdown1 === undefined && markdown2 !== undefined) || (markdown1 !== undefined && markdown2 === undefined)) {
    return false;
  }

  // Fast path for identical strings
  if (markdown1 === markdown2) return true;

  // Compare content only when ignoring formatting
  if (ignoreFormat) {
    const [plain1, plain2] = await Promise.all([
      markdownToPlainText(markdown1),
      markdownToPlainText(markdown2)
    ]);
    return normalizeWhitespace(plain1) === normalizeWhitespace(plain2);
  }

  // Structural comparison
  const norm1 = normalizeWhitespace(markdown1);
  const norm2 = normalizeWhitespace(markdown2);
  if (norm1 === norm2) return true;

  // Compare HTML structure
  const [html1, html2] = await Promise.all([
    markdownToHtml(norm1),
    markdownToHtml(norm2)
  ]);
  return normalizeWhitespace(html1) === normalizeWhitespace(html2);
}
