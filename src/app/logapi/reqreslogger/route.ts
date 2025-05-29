import { NextResponse } from "next/server";

import logger from "@/lib/logger";
import { LogFn } from "pino";


// Get valid levels from Pino's level mapping
const validLevels = Object.values(logger.levels.labels) as string[];

// console.log('***** validLevels *****', validLevels, '***** validLevels *****');

// Type guard using logger's levels
function isValidLogLevel(level: string): boolean {
  return validLevels.includes(level);
}

export async function POST(req: Request) {
  const objectToLog = await req.json();
  const levelToLog: string = objectToLog.logsource?.level?.toString().toLowerCase() || "info";

  if (!!logger && isValidLogLevel(levelToLog)) {
    (logger[levelToLog as keyof LogFn] as LogFn)(objectToLog);
  } else {
    console.error(
      `message: "Invalid log level provided or logger is not initialized",
      double bang logger: ${!!logger},
      level requested: ${levelToLog},
      requestId: ${objectToLog.logsource?.requestId || 'unknown'},
      validLevels,
      objectToLog: ${JSON.stringify(objectToLog)},` // TODO: check if we should print the object. It might have sensitive data.
    );
  }

  return new Response('Logged successfully');
}