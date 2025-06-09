import { StandardEmailThread } from '@/types/gmail';
import { getGmailThreads } from '@/lib/gmail-util';
import { getSession } from '@/lib/session';
import logger, { LogContext, makeLogContext, makeLogEntry } from '@/lib/logger';
import { headers } from 'next/headers';
import { hydrateThread } from '@/lib/stdmail-util';
import StdEmailThreadView from '@/components/thread/StdEmailThreadView';
import { listUserThreadAbs } from '@/lib/gduser-util';


async function loadUserThreadsFromDb(logContext: LogContext, userId: string) {

  var loading = false;
  var error = '';

  const threadList = await listUserThreadAbs(logContext, userId, true);

  if (threadList && threadList.length > 0) {

  } else {
    error = `No thread abstract found for user: ${userId}`;
  }

  loading = false;

  return { loading, error, threads: threadList }

}

async function hydrateThreadsFromGmail(logContext: LogContext, userId: string) {

  var loading = false;
  var error = '';
  const threads: StandardEmailThread[] = [];

  try {

    if (!!userId) {

      loading = true;
      // Call the function to retrieve threads for the specified user
      const userThreads = await getGmailThreads(logContext, userId);

      if (!userThreads) {
        error = '**stdthreads** No threads found for this user.';
        loading = false;
        return { loading, error, threads };
      }

      await Promise.all(userThreads.map(async (thread) => {
        try {
          if (logContext.additional) logContext.additional['threadId'] = thread.id;

          const hydratedThread = await hydrateThread(logContext, userId, thread);
          threads.push(hydratedThread);
        } catch (err) {
          // log failure to hydrate a thread but keep going for the rest
          logger.error(makeLogEntry(
            {
              ...logContext,
              time: Date.now(),
              module: 'stdthreads',
              function: 'UserStdThreadsPage',
            }, { thread, err }, `**UserStdThreadsPage** hydration failed for thread ${thread.id || thread.dbThreadKey}.`));
        }
      }));

    }
  } catch (err) {
    error = 'Failed to load email threads.';
    logger.error(makeLogEntry(
      {
        ...logContext,
        time: Date.now(),
        module: 'stdthreads',
        function: 'UserStdThreadsPage',
      }, { err }, '**UserStdThreadsPage** Failed to load email threads.'));
  } finally {
    loading = false;
  }

  return { loading, error, threads };

}


const UserStdThreadsPage = async () => {

  // const threads: StandardEmailThread[] = [];

  // let loading = true;

  // let error: string | null = null;

  // get x-request-id from header
  const requestId = (await headers()).get('x-request-id') || '';
  // get user id from session
  const userId = (await getSession()).userEmail || '';

  const logContext = makeLogContext({
    requestId,
    additional: {
      userId,
    }
  })

  // const { loading, error, threads } = await hydrateThreadsFromGmail(logContext, userId);
  const { loading, error, threads } = await loadUserThreadsFromDb(logContext, userId);

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
            {/* Add key to reset component state when thread changes */}
            <StdEmailThreadView
              key={`thread-${thread.dbThreadKey}`}
              logContext={logContext}
              userId={userId}
              thread={thread}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStdThreadsPage;