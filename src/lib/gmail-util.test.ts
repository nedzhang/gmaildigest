/**
 * @jest-environment node
 */

import { z } from "zod";
import {
  GmailMessage,
  GmailMessageSchema,
  GmailThread,
  GmailThreadList,
  GmailThreadListSchema,
  GmailThreadSchema,
} from "@/types/gmail";
import { getGmailThreads } from "./gmail-util"; // Assuming these are the exported functions
import logger, { createLogger, LogContext } from "./logger";
import { generateId } from "./uid-util";

describe("gmail-util", () => {
  describe("parseGmailMessage", () => {
    const mockRequestId = generateId();
    const mockLogContext: LogContext = {
      requestId: mockRequestId,
    };

    const functionLogger = createLogger(mockLogContext, {
      module: 'gmail-util-test',
      function: 'parseGmailMessage',
    })

    // Corrected test using async/await
    it("should get user gmail threads from Gmail API", async () => {
      // Use await to pause execution until promise resolves
      const gmailThreadList = await getGmailThreads(mockLogContext, "ned.zhang@paracognition.ai");

      expect(gmailThreadList).toBeDefined();
      expect(gmailThreadList?.length).toBeGreaterThan(0);

      gmailThreadList?.forEach((thread) => {
        expect(() => GmailThreadSchema.parse(thread)).not.toThrow();
        expect(thread.id).toBeDefined();
        expect(thread.historyId).toBeDefined();
      });

      functionLogger.info(
        { gmailThreadList },
        `**gmail-util.test** Retrieved user's gmails.`
      );

    }, 20000); // Timeout extended to 20 seconds
  });
});
