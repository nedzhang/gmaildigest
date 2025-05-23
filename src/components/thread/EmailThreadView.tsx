import React, { useState } from 'react';
import { GmailThread, PayloadPart } from '@/types/gmail'; // Adjust the import path as necessary
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Adjust the import path as necessary
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'; // Adjust the import path as necessary
import logger from '@/lib/logger';

interface EmailThreadViewProps {
  thread: GmailThread;
}

const getHeader = (headers: { name: string; value: string }[] | undefined, name: string): string | undefined => {
  return headers?.find(header => header.name.toLowerCase() === name.toLowerCase())?.value;
};

const decodeBase64 = (base64: string): string => {
  try {
    return atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  } catch (e) {
    logger.error("Failed to decode base64:", e);
    return "Error decoding content.";
  }
};

const renderPartContent = (part: PayloadPart): JSX.Element | string => {
  if (!part.body?.data) {
    return "No content for this part.";
  }

  const decodedContent = decodeBase64(part.body.data);

  switch (part.mimeType) {
    case 'text/plain':
      return <pre className="whitespace-pre-wrap">{decodedContent}</pre>;
    case 'text/html':
      // This is a basic rendering. For full security and complex HTML,
      // consider a library or more robust sanitization.
      return <div dangerouslySetInnerHTML={{ __html: decodedContent }} />;
    default:
      return `Unsupported MIME type: ${part.mimeType}`;
  }
};

const EmailThreadView: React.FC<EmailThreadViewProps> = ({ thread }) => {
  const [showRawMime, setShowRawMime] = useState(false);

  if (!thread) {
    return <div className="p-4">Loading thread...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Email Thread</h1>
      <p className="text-sm text-gray-600 mb-4">Thread ID: {thread.id}</p>

      <ToggleGroup
        type="single"
        value={showRawMime ? 'raw' : 'rendered'}
        onValueChange={(value) => setShowRawMime(value === 'raw')}
        className="mb-4"
      >
        <ToggleGroupItem value="rendered" aria-label="Toggle rendered view">
          Rendered View
        </ToggleGroupItem>
        <ToggleGroupItem value="raw" aria-label="Toggle raw MIME">
          Raw MIME
        </ToggleGroupItem>
      </ToggleGroup>

      {thread.messages.map((message) => (
        <div key={message.id} className="border rounded-md p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Message ID: {message.id}</h2>
          <p><strong>From:</strong> {getHeader(message.payload?.headers, 'From')}</p>
          <p><strong>To:</strong> {getHeader(message.payload?.headers, 'To')}</p>
          {getHeader(message.payload?.headers, 'Subject') && (
            <p><strong>Subject:</strong> {getHeader(message.payload?.headers, 'Subject')}</p>
          )}
          {getHeader(message.payload?.headers, 'Date') && (
            <p><strong>Date:</strong> {new Date(getHeader(message.payload?.headers, 'Date') as string).toLocaleString()}</p>
          )}
          <p><strong>Snippet:</strong> {message.snippet}</p>

          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="headers">
              <AccordionTrigger>View Headers</AccordionTrigger>
              <AccordionContent>
                <h3>Headers:</h3>
                <ul className="list-disc pl-5">
                  {message.payload?.headers?.map((header, index) => (
                    <li key={index}>
                      <strong>{header.name}:</strong> {header.value}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {message.payload?.parts && (
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">Message Parts:</h3>
              {message.payload.parts.map((part, partIndex) => (
                <Accordion type="single" collapsible key={partIndex} className="w-full">
                  <AccordionItem value={`part-${partIndex}`}>
                    <AccordionTrigger>{part.mimeType} {part.filename ? `(${part.filename})` : ''}</AccordionTrigger>
                    <AccordionContent>
                      {showRawMime ? (
                        <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                          {JSON.stringify(part, null, 2)}
                        </pre>
                      ) : (
                        renderPartContent(part)
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          )}

          {/* Handle cases with no parts, potentially rendering the body if available and not multipart */}
          {!message.payload?.parts && message.payload?.body?.data && (
             <div className="mt-4">
               <h3 className="text-md font-semibold mb-2">Message Body:</h3>
               {showRawMime ? (
                        <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                          {JSON.stringify(message.payload.body, null, 2)}
                        </pre>
                      ) : (
                        renderPartContent(message.payload as any) // Cast as any for simplicity, ideally refine renderPartContent to handle body directly
                      )}
             </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EmailThreadView;