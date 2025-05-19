import ThreadCard from '@/components/dashboard/ThreadCard';
import { mockThreadSummaries } from '@/lib/mock-data';
import type { ThreadSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// In a real application, this data would be fetched from Firestore.
async function getSummaries(): Promise<ThreadSummary[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockThreadSummaries.sort((a,b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

export default async function DashboardPage() {
  const summaries = await getSummaries();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-foreground">Your Email Summaries</h1>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No summaries yet.</p>
          <p className="text-muted-foreground">Check back later or try refreshing.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
