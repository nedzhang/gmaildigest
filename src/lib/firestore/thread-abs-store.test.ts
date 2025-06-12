/**
 * @jest-environment node
 */

import logger, { LogContext, LogContextSchema, makeLogContext, makeLogEntry } from "@/lib/logger";
import { generateId } from "@/lib/uid-util";
import { listUserThreadAbs } from "./thread-abs-store";

describe("thread-abs-store", () => {
  describe("listUserThreadAbs", () => {
    const mockRequestId = generateId();
    const mockUserId = "ned.zhang@paracognition.ai".toLowerCase();

    const mockLogContext: LogContext = makeLogContext({
      requestId: mockRequestId,
      additional: {
        userId: mockUserId,
      },
    });

    it("get list of threadabs from database for the user", async () => {
      const threadAbsList = await listUserThreadAbs(
        mockLogContext,
        mockUserId,
        true,
      );

      expect(threadAbsList).toBeDefined();
      expect(threadAbsList?.length).toBeGreaterThan(0);

      logger.info(makeLogEntry({
        ...mockLogContext,
        time: Date.now(),
        module: 'gduser-util.test',
        function: 'listUserThreadAbstractKeys', 
      }, { threadAbsKeys: threadAbsList }, `**gduser-util.test** listUserThreadAbstractKeys returned a list of keys`));
    });
  });
});
