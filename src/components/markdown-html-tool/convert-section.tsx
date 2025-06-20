// components/markdown-html-tool/convert-section.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { convertContent } from '@/action/mark-html-action';

export function ConverterSection() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ 
    html?: string; 
    markdown?: string;
    plain?: string;
    error?: string 
  }>({});

  async function handleConvert() {
    if (!input.trim()) {
      setResult({ error: 'Input is empty' });
      return;
    }
    
    try {
      const res = await convertContent(input);
      setResult(res);
    } catch (error) {
      setResult({ error: 'Conversion failed. Please check your input.' });
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste your Markdown or HTML here..."
        className="min-h-[150px]"
      />
      
      <Button onClick={handleConvert}>Convert</Button>
      
      {result.error && (
        <div className="text-red-500 p-3 bg-destructive/10 rounded-md">
          {result.error}
        </div>
      )}

      {(result.html || result.markdown) && (
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Converted Result:</h3>
            <pre className="whitespace-pre-wrap bg-muted/50 p-3 rounded-md text-sm">
              {result.html || result.markdown}
            </pre>
          </div>

          {result.plain && (
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold mb-2">Plain Text Result:</h3>
              <pre className="whitespace-pre-wrap bg-muted/50 p-3 rounded-md text-sm">
                {result.plain}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
