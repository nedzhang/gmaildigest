import type { ThreadSummary } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ThreadCardProps {
  thread: ThreadSummary;
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}


export default function ThreadCard({ thread }: ThreadCardProps) {
  const timeAgo = formatDistanceToNow(new Date(thread.receivedAt), { addSuffix: true });
  const senderName = thread.sender.split('<')[0].trim();
  const senderInitials = getInitials(senderName);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            {/* In a real app, you might have actual avatar URLs */}
            {/* <AvatarImage src={`https://i.pravatar.cc/40?u=${thread.sender}`} alt={senderName} /> */}
            <AvatarFallback className="bg-primary text-primary-foreground">{senderInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{thread.subject}</CardTitle>
            <CardDescription className="text-sm">{senderName}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm leading-relaxed">{thread.summary}</p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </CardFooter>
    </Card>
  );
}
