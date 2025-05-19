export interface ThreadSummary {
  id: string; // Corresponds to threadId
  subject: string;
  sender: string;
  summary: string;
  receivedAt: string; // Timestamp string, can be formatted later
}
