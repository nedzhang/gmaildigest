/**
 * @jest-environment node
 */

import logger, { createLogContext, createLogger, LogContext } from "@/lib/logger";
import { generateId } from "@/lib/uid-util";
import { listUserThreadAbs } from "./thread-abs-store";

describe("thread-abs-store", () => {
  describe("listUserThreadAbs", () => {
    const mockRequestId = generateId();
    const mockUserId = "ned.zhang@paracognition.ai".toLowerCase();

    const mockLogContext: LogContext = createLogContext({
      requestId: mockRequestId,
      additional: {
        userId: mockUserId,
      },
    });

    const functionLogger = createLogger(mockLogContext, {
      module: 'thread-abs-store.test',
      function: 'listUserThreadAbs',
    })

    it("get list of threadabs from database for the user", async () => {
      const threadAbsList = await listUserThreadAbs(
        mockLogContext,
        mockUserId,
        true,
      );

      expect(threadAbsList).toBeDefined();
      expect(threadAbsList?.length).toBeGreaterThan(0);

      functionLogger.info({ threadAbsKeys: threadAbsList }, `**gduser-util.test** listUserThreadAbstractKeys returned a list of keys`);
    });
  });
});
