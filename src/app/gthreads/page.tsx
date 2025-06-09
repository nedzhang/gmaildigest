'use client'

import { useEffect, useState } from 'react';
import { GmailThread } from '@/types/gmail';
import { getGmailThreads } from '@/lib/gmail-util'; // Assuming this function exists
import EmailThreadView from '@/components/thread/EmailThreadView';
import { getSession } from '@/lib/session';
import { getCurrentUserEmailThread } from './backend';
import logger from '@/lib/logger';
import { headers } from 'next/headers';

// get x-request-id from header
const requestId = (await headers()).get('x-request-id') || '';

const UserThreadsPage = () => {
  const [threads, setThreads] = useState<GmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        // Call the function to retrieve threads for the specified user
        const userThreads = await getCurrentUserEmailThread(requestId);
        logger.debug("**gthreads** userThreads:", userThreads);
        if (!userThreads) {
          setError('**gthreads** No threads found for this user.');
          setLoading(false);
          return;
        }
        logger.debug("**UserThreadsPage** userThreads: ", userThreads)
        setThreads(userThreads);
      } catch (err) {
        setError('Failed to load email threads.');
        logger.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading threads...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!threads || threads.length === 0) {
    return <div className="container mx-auto p-4">No threads found for this user.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Email Threads for distinguished user</h1>
      <div className="space-y-8">
        {threads.map((thread) => (
          <div key={thread.id} className="border p-4 rounded-md shadow-sm">
            <EmailThreadView thread={thread} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserThreadsPage;