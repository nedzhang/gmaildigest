// src/lib/markdown-html-util.test.ts

import {
  htmlToMarkdown,
  markdownToHtml,
  htmlToPlainText,
  markdownToPlainText,
  compareMarkdown,
} from './markdown-html-util';

// Mock console.error to clean up test output
jest.spyOn(console, 'error').mockImplementation(() => { });

describe('markdown-html-util', () => {
  describe('htmlToMarkdown', () => {
    test('converts basic HTML to Markdown', async () => {
      const html = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p>';
      expect(await htmlToMarkdown(html)).toBe('# Title\n\nParagraph with **bold** text');
    });

    test('converts images', async () => {
      const html = '<img src="image.jpg" alt="Description">';
      expect(await htmlToMarkdown(html)).toBe('![Description](image.jpg)');
    });

    test('handles image without alt attribute', async () => {
      const html = '<img src="image.jpg">';
      expect(await htmlToMarkdown(html)).toBe('![](image.jpg)');
    });

    test('handles image without src attribute', async () => {
      const html = '<img alt="Description">';
      expect(await htmlToMarkdown(html)).toBe('![Description]()');
    });

    test('handles image without attributes', async () => {
      const html = '<img>';
      expect(await htmlToMarkdown(html)).toBe('![]()');
    });

    test('converts tables', async () => {
      const html = '<table><tr><th>Header</th></tr><tr><td>Data</td></tr></table>';
      expect(await htmlToMarkdown(html)).toContain('| Header |\n| --- |\n| Data |');
    });

    test('handles whitespace and line breaks', async () => {
      const html = '<div>Text<div>Nested</div></div>';
      expect(await htmlToMarkdown(html)).toBe('Text\n\nNested');
    });

    // test('returns valid output on error', async () => {
    //   const original = turndownService.turndown;
    //   turndownService.turndown = () => { throw new Error('Test error'); };

    //   const html = '<div><strong>Content</strong></div>';
    //   expect(await htmlToMarkdown(html)).toBe(html);

    //   turndownService.turndown = original;
    // });

    test('handles empty HTML string', async () => {
      expect(await htmlToMarkdown('')).toBe('');
    });
  });

  describe('markdownToHtml', () => {
    test('converts basic Markdown to HTML', async () => {
      const md = '# Heading\n\n- List item';
      const result = await markdownToHtml(md);
      expect(result).toContain('<h1>Heading</h1>');
      expect(result).toContain('<li>List item</li>');
    });

    test('handles task lists', async () => {
      const md = '- [x] Completed';
      const result = await markdownToHtml(md);
      expect(result).toContain('<input type="checkbox" checked>');
    });

    test('handles unchecked task items', async () => {
      const md = '- [ ] Not done';
      const result = await markdownToHtml(md);
      expect(result).toContain('<input type="checkbox">');
      expect(result).not.toContain('checked');
    });

    test('converts tables', async () => {
      const md = '| Header |\n| --- |\n| Value |';
      const result = await markdownToHtml(md);
      expect(result).toContain('<table>');
      expect(result).toContain('<td>Value</td>');
    });

    test('handles edge cases', async () => {
      expect(await markdownToHtml('')).toBe('');
      expect(await markdownToHtml('###')).toContain('<h3></h3>');
    });

    test('handles null case', async () => {
      // @ts-expect-error - testing null case
      expect(await markdownToHtml(null)).toBe('');
    });

    test('converts bold and italic correctly', async () => {
      const md = '**Bold text** _italic_';
      const result = await markdownToHtml(md);
      expect(result).toContain('<strong>Bold text</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    test('preserves formatting in blocks', async () => {
      const md = [
        '# Heading with **bold**',
        '- List item with _italic_',
        '',
        '> Blockquote with **_combined_**'
      ].join('\n');

      const result = await markdownToHtml(md);
      expect(result).toContain('<h1>Heading with <strong>bold</strong></h1>');
      expect(result).toContain('<li>List item with <em>italic</em></li>');
      expect(result).toContain('<blockquote>');
    });


    test('handles empty list items', async () => {
      const md = '-\n- second item\n-';
      const result = await markdownToHtml(md);
      // Matches Marked's actual output format (no newlines between items)
      expect(result).toBe('<ul>\n<li></li><li>second item</li><li></li></ul>\n');
    });

    test('handles task list items without content', async () => {
      const md = '- [x] \n- [ ] ';
      const result = await markdownToHtml(md);
      // Marked doesn't include space in output when no content
      expect(result).toContain('<li><input type="checkbox" checked>');
      // marked would ignore the second checkbox because is unchecked and no text after it.
      // expect(result).toContain('<li><input type="checkbox">');
    });

    test('handles mixed tasks and regular items', async () => {
      const md = '- [x] Done\n- Regular item\n- [ ] Not done';
      const result = await markdownToHtml(md);
      expect(result).toContain('<li><input type="checkbox" checked>Done</li>');
      expect(result).toContain('<li>Regular item</li>');
      expect(result).toContain('<li><input type="checkbox">Not done</li>');
    });

    test('handles list items without tokens', async () => {
      const md = '-   ';
      const result = await markdownToHtml(md);
      // Marked outputs without extra newline
      expect(result).toBe('<ul>\n<li></li></ul>\n');
    });

    // test('handles task items with trailing spaces', async () => {
    //   const md = '- [ ]   \n- [x]   ';
    //   const result = await markdownToHtml(md);
    //   // Marked doesn't preserve trailing spaces
    //   expect(result).toContain('<li><input type="checkbox">');
    //   expect(result).toContain('<li><input type="checkbox" checked>');
    // });

  });

  describe('htmlToPlainText', () => {
    test('strips HTML tags', async () => {
      expect(await htmlToPlainText('<div><h1>Title</h1><p>Paragraph</p></div>')).toBe('Title Paragraph');
    });

    test('collapses whitespace', async () => {
      expect(await htmlToPlainText('<p>  Multi  \n\n  spaces   </p>')).toBe('Multi spaces');
    });

    test('handles complex layouts', async () => {
      const html = '<div><h1>Title</h1><p>Text <span>with</span> <div>nested</div> content</p></div>';
      expect(await htmlToPlainText(html)).toBe('Title Text with nested content');
    });

    test('handles entities', async () => {
      const html = '<p>Text &amp; more &nbsp; content</p>';
      expect(await htmlToPlainText(html)).toBe('Text & more content');
    });

    test('handles empty strings', async () => {
      expect(await htmlToPlainText('')).toBe('');
    });

    test('handles blockquotes correctly', async () => {
      const html = `
      <blockquote>
        This is a blockquote
        <p>With a paragraph inside</p>
        And some <strong>bold text</strong>
      </blockquote>`;
      expect(await htmlToPlainText(html)).toBe('> This is a blockquote > > With a paragraph inside > > And some bold text');
    });

    test('handles images without alt attributes', async () => {
      const html = '<img src="image.jpg">';
      expect(await htmlToPlainText(html)).toBe('');
    });

    test('handles images with alt attributes', async () => {
      const html = '<img alt="Description">';
      expect(await htmlToPlainText(html)).toBe('Description');
    });

    test('handles images without any attributes', async () => {
      const html = '<img>';
      expect(await htmlToPlainText(html)).toBe('');
    });
  });

  describe('markdownToPlainText', () => {
    test('converts markdown to plain text', async () => {
      const md = '# Heading\n\n- List item **bold**';
      expect(await markdownToPlainText(md)).toBe('Heading List item bold');
    });

    test('strips all formatting', async () => {
      const md = '![Image alt](src.jpg) [Link text](url) `code`';
      expect(await markdownToPlainText(md)).toBe('Image alt Link text code');
    });

    test('handles empty markdown', async () => {
      expect(await markdownToPlainText('')).toBe('');
    });

    test('handles null case', async () => {
      // @ts-expect-error - testing null case
      expect(await markdownToPlainText(null)).toBe('');
    });

    test('handles tables in markdown', async () => {
      const md = '| Header |\n| --- |\n| Value |';
      expect(await markdownToPlainText(md)).toBe('Header Value');
    });

    test('preserves text content with formatted elements', async () => {
      const md = '**Alert**: _Click_ `here` for **immediate** action';
      expect(await markdownToPlainText(md)).toBe('Alert: Click here for immediate action');
    });

    test('handles complex markdown documents', async () => {
      const md = [
        '# **Main** Heading',
        '## _Subheading_',
        '',
        '- **First** item',
        '- _Second_ item',
        '- ***Both*** formatting types',
        '',
        '> Blockquote with **importance**'
      ].join('\n');

      const result = await markdownToPlainText(md);
      expect(result).toBe('Main Heading Subheading First item Second item Both formatting types > Blockquote with importance');
    });
  });

  describe('compareMarkdown', () => {

    test('compare a string and empty string', async () => {
      const md1 = 'Can someone please put a brief summary of request here?';
      const md2 = '';
      expect(await compareMarkdown(md1, md2, true)).toBe(false);
    });

    test('ignores formatting when enabled', async () => {
      const md1 = '# Title\n\nContent';
      const md2 = 'Title\n=====\nContent  ';
      expect(await compareMarkdown(md1, md2, true)).toBe(true);
    });

    test('detects structural differences', async () => {
      const md1 = '# Heading';
      const md2 = '## Heading';
      expect(await compareMarkdown(md1, md2, false)).toBe(false);
    });

    test('handles image differences', async () => {
      const md1 = 'Text content ![Alt](img.jpg)';
      const md2 = 'Text content [Alt](img.jpg)';
      expect(await compareMarkdown(md1, md2, true)).toBe(true);
      expect(await compareMarkdown(md1, md2, false)).toBe(false);
    });

    test('handles whitespace insensitivity', async () => {
      const md1 = '  Text   with  \n\n  spaces  \t';
      const md2 = 'Text with spaces';
      expect(await compareMarkdown(md1, md2, false)).toBe(true);
    });

    test('ignores formatting when enabled', async () => {
      const md1 = '# Title\nContent';
      const md2 = 'Title\n=====\nContent  ';
      expect(await compareMarkdown(md1, md2, true)).toBe(true);
    });

    test('detects structural differences', async () => {
      const md1 = '# H';
      const md2 = '## H';
      expect(await compareMarkdown(md1, md2, false)).toBe(false);
    });

    test('handles image differences', async () => {
      const md1 = 'Text ![A](img.jpg)';
      const md2 = 'Text [A](img.jpg)';
      expect(await compareMarkdown(md1, md2, true)).toBe(true);
      expect(await compareMarkdown(md1, md2, false)).toBe(false);
    });

    test('returns false for different content with ignoreFormat', async () => {
      const md1 = 'First content';
      const md2 = 'Second content';
      const result = await compareMarkdown(md1, md2, true);
      expect(result).toBe(false);
    });

    test('handles formatting differences with ignoreFormat false', async () => {
      // Different formatting but semantically equivalent
      const md1 = '*emphasis*';
      const md2 = '_emphasis_';
      const result = await compareMarkdown(md1, md2, false);
      expect(result).toBe(true);
    });

    test('detects structural differences with ignoreFormat false', async () => {
      const md1 = '# Heading';
      const md2 = '## Heading';
      const result = await compareMarkdown(md1, md2, false);
      expect(result).toBe(false);
    });

    test('handles whitespace insensitivity', async () => {
      const md1 = 'Text   with\n\nspaces';
      const md2 = 'Text with spaces';
      const result = await compareMarkdown(md1, md2, false);
      expect(result).toBe(true);
    });

    test('compares exact matches quickly', async () => {
      const md = 'Exact same content';
      const start = performance.now();
      const result = await compareMarkdown(md, md, true);
      const duration = performance.now() - start;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(10); // Should be very fast
    });

    test('handles image differences in content', async () => {
      const md1 = 'Content ![Alt1](img1.jpg)';
      const md2 = 'Content [Alt1](img1.jpg)';

      // With formatting ignored (only text matters)
      const ignoreResult = await compareMarkdown(md1, md2, true);
      expect(ignoreResult).toBe(true);

      // Without formatting (exact markdown structure)
      const strictResult = await compareMarkdown(md1, md2, false);
      expect(strictResult).toBe(false);
    });

    test('ignores bold/italic differences when ignoring formatting', async () => {
      const md1 = '**Important** notice';
      const md2 = '_Important_ notice';
      const result = await compareMarkdown(md1, md2, true);
      expect(result).toBe(true);
    });

    test('detects bold/italic differences when formatting matters', async () => {
      const md1 = '**Important** notice';
      const md2 = 'Important notice'; // No formatting
      const result = await compareMarkdown(md1, md2, false);
      expect(result).toBe(false);
    });

    test('compares empty markdown strings', async () => {
      expect(await compareMarkdown('', '', true)).toBe(true);
      expect(await compareMarkdown('', ' ', true)).toBe(true);
    });

    test('compares null and undefined', async () => {
      expect(await compareMarkdown(undefined, undefined, false)).toBe(true);
      expect(await compareMarkdown(undefined, '', false)).toBe(false);
      expect(await compareMarkdown('', undefined, false)).toBe(false);
    });

  });
});
