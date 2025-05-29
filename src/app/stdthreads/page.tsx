import { StandardEmailThread } from '@/types/gmail';
import { retrieveUserThreads } from '@/lib/gmail-util'; // Assuming this function exists
import { getSession } from '@/lib/session';
import logger, { makeLogEntry } from '@/lib/logger';
import { headers } from 'next/headers';
import { hydrateThread } from '@/lib/stdmail-util';
import StdEmailThreadView from '@/components/thread/StdEmailThreadView';



const UserStdThreadsPage = async () => {

  const threads: StandardEmailThread[] = [];

  let loading = true;

  let error: string | null = null;

  // get x-request-id from header
  const requestId = (await headers()).get('x-request-id') || '';
  // get user id from session
  const userId = (await getSession()).userEmail || '';

  try {



    if (!!userId) {

      loading = true;
      // Call the function to retrieve threads for the specified user
      const userThreads = await retrieveUserThreads({ requestId, additional: { userId } }, userId);

      if (!userThreads) {
        error = '**stdthreads** No threads found for this user.';
        loading = false;
        return;
      }

      await Promise.all(userThreads.map(async (thread) => {
        const hydratedThread = await hydrateThread({ requestId }, userId, thread);
        threads.push(hydratedThread);
      }));

    }
  } catch (err) {
    error = 'Failed to load email threads.';
    logger.error(makeLogEntry(
      {
        requestId,
        time: Date.now(),
        module: 'stdthreads',
        function: 'UserStdThreadsPage',
        additional: { userId }
      }, { err }, '**UserStdThreadsPage** Failed to load email threads.'));
  } finally {
    loading = false;
  }

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
          <div key={thread.dbThreadKey} className="border p-4 rounded-md shadow-sm">
            <StdEmailThreadView thread={thread} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStdThreadsPage;