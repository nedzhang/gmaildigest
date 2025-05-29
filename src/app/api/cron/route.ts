import cron from "node-cron";

import { NextRequest, NextResponse } from "next/server";
import logger, { makeLogEntry } from "@/lib/logger";

export async function GET(req: NextRequest) {
  cron.schedule("*/1 * * * *", () => {
    logger.info(makeLogEntry(
      {
        time: Date.now(),
        module: "cron",
        function: "GET",
        requestId: req.headers.get("x-request-id") || "unknown",
      },
      {},
      "Running cron job every 1 minutes",
    )// Add task logic here
    );
  });
  return NextResponse.json({ message: "Cron scheduler has started" });
}
