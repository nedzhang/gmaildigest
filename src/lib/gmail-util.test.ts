/**
 * @jest-environment node
 */

import { z } from 'zod';
import {
  GmailMessage,
  GmailMessageSchema,
  GmailThread,
  GmailThreadSchema,
  GmailThreadList,
  GmailThreadListSchema,
} from '@/types/gmail';
import { retrieveUserThreads } from './gmail-util'; // Assuming these are the exported functions
import { LogContext } from './logger';
import { generateId } from './uid-util';

describe('gmail-util', () => {
  describe('parseGmailMessage', () => {

    const mockRequestId = generateId();

    const mockLogContext: LogContext = {
      requestId: mockRequestId,
    }

    it('should get user gmail threads from Gmail API', () => {

      retrieveUserThreads(mockLogContext,
        'ned.zhang@paracognition.ai'
      )
        .then(gmailThreadList => {

          expect(gmailThreadList).toBeDefined();
          // expect(() => GmailThreadListSchema.parse(gmailThreadList)).not.toThrow();
          expect(gmailThreadList?.length).toBeGreaterThan(0);

          gmailThreadList?.map((thread) => {
            expect(() => GmailThreadSchema.parse(thread)).not.toThrow();
            expect(thread.id).toBeDefined();
            expect(thread.historyId).toBeDefined();
            // expect(thread.snippet).toBeDefined();
            // expect(thread.messages).toBeDefined();

          });

        })
        .catch(error => {
          console.error('Error:', error);
        });

    }, // 20 * 1000 // time out in 20 seconds
    );
  });
});