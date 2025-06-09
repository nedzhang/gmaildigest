import { NextRequest, NextResponse } from 'next/server';
import { LogContext, makeLogContext } from '@/lib/logger';
import { extractText } from '@/lib/extract-text-util';


export async function POST(request: NextRequest) {

  
  try {
    const { filename, mimetype, data } = await request.json();
    
    const logContext = makeLogContext( {req: request} )

    // Validate input
    if (!filename || !mimetype || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const extractedText = await extractText(logContext, filename, mimetype, data);

    // Summarize with DeepSeek API
    // const summary = await summarizeWithDeepSeek(extractedText);
    return NextResponse.json({ extractedText });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Processing failed' },
      { status: 500 }
    );
  }
}

// // DeepSeek Summarization
// async function summarizeWithDeepSeek(text: string): Promise<string> {
//   const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
//   const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

//   const response = await fetch(DEEPSEEK_URL, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
//     },
//     body: JSON.stringify({
//       model: "deepseek-chat",
//       messages: [
//         { 
//           role: "system", 
//           content: "You are a helpful document summarization assistant. Provide concise summaries focusing on key points." 
//         },
//         { 
//           role: "user", 
//           content: `Summarize the following document:\n\n${text.substring(0, 128000)}` 
//         }
//       ]
//     })
//   });

//   if (!response.ok) throw new Error('DeepSeek API request failed');

//   const result = await response.json();
//   return result.choices[0]?.message?.content?.trim() || 'No summary generated';
// }