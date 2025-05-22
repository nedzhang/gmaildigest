// app/thread/[threadId]/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GmailThread } from '@/types/gmail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
} from '@/components/ui/accordion';
import { promises as fs } from 'fs';
import path from 'path';
import EmailThreadView from '@/components/thread/EmailThreadView';
interface PageProps {
  params: {
    threadId: string;
  };
}

// const decodeBase64 = (base64: string): string => {
//   try {
//     return Buffer.from(base64, 'base64').toString('utf-8');
//   } catch (error) {
//     console.error('Error decoding base64:', error);
//     return 'Error decoding content.';
//   }
// };

// const renderPartContent = (part: any, showRaw: boolean): JSX.Element | string => { // TODO: Define a proper type for 'part'
//   if (!part.body || !part.body.data) {
//     return showRaw ? JSON.stringify(part, null, 2) : 'No content available.';
//   }

//   const decodedContent = decodeBase64(part.body.data);

//   if (showRaw) {
//     return <pre>{JSON.stringify(part, null, 2)}</pre>;
//   }

//   if (part.mimeType === 'text/plain') {
//     return <pre className="whitespace-pre-wrap">{decodedContent}</pre>;
//   } else if (part.mimeType === 'text/html') {
//     return <div dangerouslySetInnerHTML={{ __html: decodedContent }} />;
//   } else {
//     return `Unsupported MIME type: ${part.mimeType}.`;
//   }
// };

// const getHeader = (headers: { name: string; value: string }[] | undefined, name: string): string | undefined => {
//   if (headers) {
//     const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
//     return header?.value;
//   } else {
//     return undefined;
//   }
// };

export default function ThreadPage() {
  const params = useParams<PageProps['params']>();
  const { threadId } = params;
  const [thread, setThread] = useState<GmailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThread = async () => {
      if (!threadId) {
        setError('Invalid thread ID.');
        setLoading(false);
        return;
      }

      try {
        // In a real application, you would fetch this from an API endpoint
        // that reads the file securely. 
        const res = await fetch(`/api/threads/${threadId}`);

        if (!res.ok) {
          setError(`Error loading thread: ${res.statusText}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setThread(data as GmailThread);
      } catch (err) {
        setError('Failed to load email thread.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [threadId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!thread) {
    return <div>Thread not found.</div>;
  }

  return (
    <EmailThreadView thread={thread} />
  );
}