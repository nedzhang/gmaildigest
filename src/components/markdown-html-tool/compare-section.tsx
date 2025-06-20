'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { compareMarkdown } from '@/lib/markdown-html-util';

export function CompareSection() {
  const [md1, setMd1] = useState('');
  const [md2, setMd2] = useState('');
  const [ignoreFromatting, setIgnoreWhitespace] = useState(false);
  const [result, setResult] = useState<{ isSame?: boolean; error?: string }>({});

  async function handleCompare() {
    if (!md1.trim() || !md2.trim()) {
      setResult({ error: 'Both fields are required' });
      return;
    }
    
    try {
    //   const isSame = await compareMarkdown(md1, md2, ignoreWhitespace);
      const isSame = await compareMarkdown(md1, md2, ignoreFromatting);

      setResult({ isSame });
    } catch (error) {
      setResult({ error: 'Comparison failed. Please check your input.' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Textarea
          value={md1}
          onChange={(e) => setMd1(e.target.value)}
          placeholder="First Markdown content..."
          className="min-h-[100px]"
        />
        <Textarea
          value={md2}
          onChange={(e) => setMd2(e.target.value)}
          placeholder="Second Markdown content..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="ignore-format"
          checked={ignoreFromatting}
          onCheckedChange={(checked) => setIgnoreWhitespace(!!checked)}
        />
        <Label htmlFor="ignore-format">Ignore Formatting</Label>
      </div>

      <Button onClick={handleCompare}>Compare</Button>

      {result.error && (
        <div className="text-red-500 p-3 bg-destructive/10 rounded-md">
          {result.error}
        </div>
      )}

      {typeof result.isSame === 'boolean' && (
        <div className={`p-3 rounded-md ${result.isSame ? 'bg-greenобновить-100 text-green-800' : 'bg-destructive/10 text-destructive'}`}>
          {result.isSame ? 'Markdown contents are identical!' : 'Markdown contents are different'}
        </div>
      )}
    </div>
  );
}
