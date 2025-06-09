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
import logger, { LogContext, makeLogContext, makeLogEntry } from "./logger";
import { generateId } from "./uid-util";

describe("gmail-util", () => {
  describe("parseGmailMessage", () => {
    const mockRequestId = generateId();

    const mockLogContext: LogContext = {
      requestId: mockRequestId,
    };

    it("should get user gmail threads from Gmail API", () => {
      getGmailThreads(mockLogContext, "ned.zhang@paracognition.ai")
        .then((gmailThreadList) => {
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

          logger.info(makeLogEntry(
            {
              ...mockLogContext,
              time: Date.now(),
              module: "gmail-util.test",
              function: "parseGemaiMessage",
            },
            { gmailThreadList },
            `**gmail-util.test** Retrieved user's gmails.`,
          ));
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } // 20 * 1000 // time out in 20 seconds
    );
  });
});
