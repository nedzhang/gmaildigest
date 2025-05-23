
import cron from 'node-cron';

import { NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function GET() {

  cron.schedule('*/1 * * * *', () => {
    logger.info('Running cron job every 1 minutes');
    // Add task logic here
  });
  return NextResponse.json({ message: 'Cron scheduler has started' });
}


