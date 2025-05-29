// EmailThreadView.tsx
import React from 'react';
import { StandardEmailThread } from '@/types/gmail'; // Adjust import path
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface EmailThreadViewProps {
  thread: StandardEmailThread;
}

const StdEmailThreadView: React.FC<EmailThreadViewProps> = ({ thread }) => {
  if (!thread) {
    return <div className="p-4">Loading thread...</div>;
  }

  const threadKey = thread.dbThreadKey || 'Thread Key Unknown';
  const displayKey = threadKey.length > 30 
    ? `${threadKey.substring(0, 15)}...${threadKey.slice(-12)}` 
    : threadKey;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        Email Thread
        <span className="ml-2 font-mono rounded text-md">
          - {displayKey}
        </span>
      </h1>
      {thread.summary && (
        <p className="text-sm text-gray-600 mb-4">Thread Summary: {thread.summary}</p>
      )}
      {thread.snippet && (
        <p className="text-sm text-gray-600 mb-4">Thread Snippet: {thread.snippet}</p>
      )}

      <Accordion type="multiple" className="w-full">
        {thread.messages?.map((message, index) => (
          <AccordionItem
            key={message.messageId!}
            value={message.messageId!}
            className="mb-4 border rounded-md overflow-hidden"
          >
            <AccordionTrigger className="p-4 hover:no-underline">
              <div className="w-full text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">{message.subject}</h2>
                    <p className="text-sm text-gray-600">
                      <strong>From:</strong> {message.from}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>To:</strong> {message.to}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {message.receivedAt}
                    </p>
                    {message.snippet && (
                      <p className="text-sm text-gray-500 mt-1 max-w-xs line-clamp-1">
                        {message.snippet}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="p-4 pt-0 border-t">
              <div className="mt-2">
                {message.summary && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <p className="font-medium text-gray-700">Summary:</p>
                    <p>{message.summary}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-md font-semibold mb-2">Body:</h3>
                  <div dangerouslySetInnerHTML={{ __html: message.body! }} />
                </div>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">Attachments:</h3>
                    <Accordion type="multiple" className="w-full">
                      {message.attachments.map((attachment, idx) => (
                        <AccordionItem key={idx} value={`${message.messageId}-attachment-${idx}`}>
                          <AccordionTrigger className="py-2 hover:no-underline">
                            <div className="flex items-center">
                              <span className="mr-2">
                                {attachment.filename || 'Untitled Attachment'}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({attachment.mimetype})
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-2 bg-gray-50 rounded-md">
                              {attachment.summary ? (
                                <p>{attachment.summary}</p>
                              ) : (
                                <p className="text-gray-500 italic">
                                  No summary available for this attachment
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default StdEmailThreadView;