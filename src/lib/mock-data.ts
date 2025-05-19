import type { ThreadSummary } from '@/types';

export const mockThreadSummaries: ThreadSummary[] = [
  {
    id: 'thread_1',
    subject: 'Project Phoenix Q3 Update & Next Steps',
    sender: 'Katherine Miller <k.miller@example.com>',
    summary: 'The Q3 targets for Project Phoenix were largely met, with a 15% increase in user engagement. Key action items for Q4 include focusing on mobile optimization and expanding marketing efforts in the APAC region. A detailed report is attached.',
    receivedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'thread_2',
    subject: 'Team Offsite Planning - Venue Options',
    sender: 'John Doe <john.doe@example.com>',
    summary: 'The team discussed three potential venues for the upcoming offsite: Mountain Retreat Lodge, Lakeside Conference Center, and City Hub Space. Pros and cons for each were debated, with a preference emerging for Lakeside due to its amenities and accessibility. A poll will be sent out shortly for final votes.',
    receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: 'thread_3',
    subject: 'Feedback Request: New UI Mockups for Dashboard',
    sender: 'Alice Wonderland <alice.w@example.com>',
    summary: 'Alice shared new UI mockups for the main dashboard, focusing on a cleaner layout and improved data visualization. She is requesting feedback by EOD Friday, specifically on the new navigation panel and the revised color scheme. Link to Figma in email.',
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 'thread_4',
    subject: 'Your Weekly Tech Digest - AI, Cloud, and More',
    sender: 'Tech Weekly Newsletter <newsletter@techweekly.io>',
    summary: 'This week\'s tech digest covers breakthroughs in generative AI models, new security features in major cloud platforms, and a look at the future of quantum computing. Several interesting articles and upcoming webinars are highlighted.',
    receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
];
