'use server';

import htmlToMd from 'html-to-md';
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { htmlToMarkdown, htmlToPlainText, markdownToHtml, markdownToPlainText } from '@/lib/markdown-html-util';

export async function convertContent(input: string) {
  const isHtml = /<[a-z][\s\S]*>/i.test(input);
  
  try {
    if (isHtml) {
      // const markdown = htmlToMd(input);
      const markdown = await htmlToMarkdown(input);
      const plain = await htmlToPlainText(input);
      return { markdown, plain };
    } else {
      // const file = await remark()
      //   .use(remarkRehype)
      //   .use(rehypeSanitize)
      //   .use(rehypeStringify)
      //   .process(input);
      // return { html: String(file) };
      const html = await markdownToHtml(input);
      const plain = await markdownToPlainText(input);
      return { html, plain };
    }
  } catch (error) {
    console.error('Conversion error:', error);
    return { error: 'Conversion failed. Please check your input.' };
  }
}

// export async function compareMarkdown(md1: string, md2: string, ignoreWhitespace: boolean) {
//   const normalize = (s: string) => 
//     ignoreWhitespace ? s.replace(/\s+/g, ' ') : s;
  
//   return normalize(md1) === normalize(md2);
// }
