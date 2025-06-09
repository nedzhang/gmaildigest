// app/components/StdEmailThreadView.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { StandardEmailThread } from '@/types/gmail';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clipboard, ClipboardCheck, Trash2 } from 'lucide-react';
import { LogContext } from '@/lib/logger';
import { deleteEmailAbstract } from '@/lib/gduser-util';

interface EmailThreadViewProps {
  logContext: LogContext;
  userId: string;
  thread: StandardEmailThread;
  onDelete?: (deletedMessageId: string) => void; // Callback for parent component
}

const StdEmailThreadView: React.FC<EmailThreadViewProps> = ({
  logContext,
  userId,
  thread,
  onDelete
}) => {
  const [localThread, setLocalThread] = useState<StandardEmailThread>(thread);
  const [showThreadJson, setShowThreadJson] = useState(false);
  const [showMessageJson, setShowMessageJson] = useState<Record<string, boolean>>({});
  const [copiedThread, setCopiedThread] = useState(false);
  const [copiedMessages, setCopiedMessages] = useState<Record<string, boolean>>({});
  const [deletingMessages, setDeletingMessages] = useState<Record<string, boolean>>({});

  // Sync local state with prop changes
  useEffect(() => {
    setLocalThread(thread);
  }, [thread]);

  if (!localThread) {
    return <div className="p-4">Loading thread...</div>;
  }

  const threadKey = localThread.dbThreadKey || 'Thread Key Unknown';
  const displayKey = threadKey.length > 30
    ? `${threadKey.substring(0, 15)}...${threadKey.slice(-12)}`
    : threadKey;

  // Toggle for individual message JSON view
  const toggleMessageJson = (messageId: string) => {
    setShowMessageJson(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Copy thread JSON to clipboard
  const copyThreadJson = () => {
    navigator.clipboard.writeText(JSON.stringify(localThread, null, 2));
    setCopiedThread(true);
    setTimeout(() => setCopiedThread(false), 2000);
  };

  // Copy message JSON to clipboard
  const copyMessageJson = (messageId: string) => {
    const message = localThread.messages?.find(m => m.messageId === messageId);
    if (message) {
      navigator.clipboard.writeText(JSON.stringify(message, null, 2));
      setCopiedMessages(prev => ({ ...prev, [messageId]: true }));
      setTimeout(() => setCopiedMessages(prev => ({ ...prev, [messageId]: false })), 2000);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this email message?')) {
      return;
    }

    const originalThread = localThread;

    try {
      // Set deleting state
      setDeletingMessages(prev => ({ ...prev, [messageId]: true }));

      // Optimistic UI update

      setLocalThread(prev => ({
        ...prev,
        messages: prev.messages?.filter(msg => msg.messageId !== messageId) || []
      }));

      // Perform actual deletion
      await deleteEmailAbstract(logContext, userId, messageId);

      // Notify parent component
      if (onDelete) {
        onDelete(messageId);
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
      // Revert on error
      setLocalThread(originalThread);
      alert('Failed to delete email message. Please try again.');
    } finally {
      // Clear deleting state
      setDeletingMessages(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // If thread JSON view is enabled
  if (showThreadJson) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center">
            Thread JSON
            <span className="ml-2 font-mono rounded text-md">
              - {displayKey}
            </span>
          </h1>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 flex items-center gap-1 rounded text-sm ${copiedThread
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 hover:bg-gray-300'
                }`}
              onClick={copyThreadJson}
            >
              {copiedThread ? (
                <>
                  <ClipboardCheck size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard size={16} />
                  Copy JSON
                </>
              )}
            </button>
            <button
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              onClick={() => setShowThreadJson(false)}
            >
              Hide JSON
            </button>
          </div>
        </div>
        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
          {JSON.stringify(localThread, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center">
          Email Thread
          <span className="ml-2 font-mono rounded text-md">
            - {displayKey}
          </span>
        </h1>
        <button
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          onClick={() => setShowThreadJson(true)}
        >
          Show Thread JSON
        </button>
      </div>

      {localThread.summary && (
        <p className="text-sm text-gray-600 mb-4">Thread Summary: {localThread.summary}</p>
      )}
      {localThread.snippet && (
        <p className="text-sm text-gray-600 mb-4">Thread Snippet: {localThread.snippet}</p>
      )}

      <Accordion type="multiple" className="w-full">
        {localThread.messages?.map((message, index) => {
          const messageId = message.messageId!;
          const isJsonVisible = showMessageJson[messageId];
          const isCopied = copiedMessages[messageId];
          const isDeleting = deletingMessages[messageId];

          return (
            <AccordionItem
              key={messageId}
              value={messageId}
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
                <div className="flex justify-end mb-2 gap-2">
                  {isJsonVisible && (
                    <button
                      className={`px-2 py-1 flex items-center gap-1 rounded text-xs ${isCopied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      onClick={() => copyMessageJson(messageId)}
                    >
                      {isCopied ? (
                        <>
                          <ClipboardCheck size={14} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Clipboard size={14} />
                          Copy JSON
                        </>
                      )}
                    </button>
                  )}
                  <button
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                    onClick={() => toggleMessageJson(messageId)}
                  >
                    {isJsonVisible ? 'Hide JSON' : 'Show JSON'}
                  </button>
                  {/* Delete button */}
                  <button
                    className={`px-2 py-1 flex items-center gap-1 rounded text-xs ${isDeleting
                      ? 'bg-gray-300 text-gray-700'
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                      }`}
                    onClick={() => handleDeleteMessage(messageId)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <span className="flex items-center">
                        Deleting...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </span>
                    )}
                  </button>
                </div>

                {isJsonVisible ? (
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(message, null, 2)}
                  </pre>
                ) : (
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
                            <AccordionItem key={idx} value={`${messageId}-attachment-${idx}`}>
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
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default StdEmailThreadView;