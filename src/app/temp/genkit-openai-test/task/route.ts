import "@/ai/schema/task";

import logger, { createLogContext, createLogger } from "@/lib/logger";
import dotenv from "dotenv";
import { ai } from "@/ai/genkit";
import { NextRequest, NextResponse } from "next/server";
import { formatError, jsonifyError } from "@/lib/error-util";
import { nbaTaskFlow } from "@/ai/flows/nba-task";
import { TaskActionInput } from "@/ai/schema/task";
import { processTaskNba } from "@/ai/tool/task-action";


dotenv.config();

const taskToTest: TaskActionInput = {
  "id": 1,
  "title": "irrigation system",
  "description": "",
  "done": false,
  "done_at": "0001-01-01T00:00:00Z",
  "due_date": "0001-01-01T00:00:00Z",
  "reminders": [],
  "project_id": 2,
  "repeat_after": 0,
  "repeat_mode": 0,
  "priority": 0,
  "start_date": "0001-01-01T00:00:00Z",
  "end_date": "0001-01-01T00:00:00Z",
  "assignees": [],
  "labels": [],
  "hex_color": "",
  "percent_done": 0,
  "identifier": "#1",
  "index": 1,
  "related_tasks": {},
  "attachments": [
    {
      "id": 1,
      "task_id": 1,
      "created_by": {
        "created": "2025-06-09T16:02:10Z",
        "id": 2,
        "name": "",
        "updated": "2025-06-09T16:02:10Z",
        "username": "test2"
      },
      "file": {
        "id": 1,
        "name": "Sol_140P8525Q0015.pdf",
        "mime": "",
        "size": 415966,
        "created": "2025-06-09T16:04:34Z",
        "summary": "### Summary of Document Sol_140P8524Q0015.pdf\n\n#### Overview\nThis document is a solicitation for the replacement of an irrigation system at the John Muir National Historic Site. The project is set aside for Small Business (SB) concerns only, with a North American Industry Classification System (NAICS) code of 238220 and a small business size standard of $19.0 million. The construction magnitude is estimated between $100,000 and $250,000. The solicitation is issued by the National Park Service (NPS) and requires the contractor to provide all necessary labor, materials, equipment, and transportation for the project.\n\n#### Requirements and Qualification Criteria\n- **Eligibility**: Only small businesses are eligible to submit proposals.\n- **Scope of Work**: The contractor must provide all mobilization, labor, supervision, materials, equipment, transportation, site rehabilitation, cleanup, and demobilization.\n- **Project Duration**: The project must be completed within 230 calendar days after the Notice to Proceed (NTP) is issued.\n\n#### Key Dates\n- **Proposal Submission Deadline**: Proposals must be submitted by 12:00 PM PST on Thursday, May 15, 2025.\n- **Questions Deadline**: All questions must be submitted via email to Brian Roppolo (brian_roppolo@nps.gov) by May 15, 2025.\n- **Project Completion**: The project must be completed by January 17, 2026.\n\n#### Submission Process\n- **Submission Method**: Only emailed proposals will be accepted.\n- **Required Documents**: Proposals must include:\n  - Total quoted price and price breakdown.\n  - Signed acknowledgment of SF1442.\n  - Draft schedule and technical approach.\n  - Three prior project experiences.\n  - Responses to specific questions regarding legal judgments and debarment status.\n\n#### Evaluation Criteria\n- **Price**: The total quoted price and cost breakdown.\n- **Technical**: Documentation of the firm’s ability to meet specifications.\n- **Past Performance**: Evidence of recent projects of similar size and scope within the past five years.\n\n#### Contacts\n- **Primary Contact**: Brian Roppolo\n  - Email: brian_roppolo@nps.gov\n  - Phone: 206-220-4215\n- **Secondary Contact**: Keith Park\n  - Email: keith_park@nps.gov\n\n#### Additional Notes\n- The government reserves the right to cancel the solicitation.\n- Proposals must be valid for at least 60 days.\n- All contractors must be registered in the System for Award Management (SAM) at the time of proposal submission.",
      },
      "created": "2025-06-09T16:04:34Z"
    }
  ],
  "cover_image_attachment_id": 0,
  "is_favorite": false,
  "created": "2025-06-09T16:03:47Z",
  "updated": "2025-06-09T16:24:53Z",
  "bucket_id": 0,
  "comments": [
    {
      "id": 1,
      "comment": "<p>@ai can you summarize the attachment?</p>",
      "author": {
        "created": "2025-06-09T16:02:10Z",
        "id": 2,
        "name": "",
        "updated": "2025-06-09T16:02:10Z",
        "username": "test2"
      },
      "created": "2025-06-09T16:23:51Z",
      "updated": "2025-06-09T16:23:51Z"
    },
    {
      "id": 2,
      "comment": "<p>I am going to update this after summarization</p>",
      "author": {
        "created": "2025-06-09T16:02:10Z",
        "id": 2,
        "name": "",
        "updated": "2025-06-09T16:02:10Z",
        "username": "test2"
      },
      "created": "2025-06-09T16:24:53Z",
      "updated": "2025-06-09T16:24:53Z"
    }
  ],
  "position": 0,
  "reactions": {},
  "created_by": {
    "created": "2025-06-09T16:02:10Z",
    "id": 2,
    "name": "",
    "updated": "2025-06-09T16:02:10Z",
    "username": "test2"
  },
  "buckets": [
    {
      "id": 2,
      "title": "Crafting",
      "project_view_id": 5,
      "limit": 0,
      "count": 0,
      "position": 100,
      "created": "2025-06-09T16:02:10Z",
      "updated": "2025-06-09T16:02:10Z"
    }
  ]
};

export async function GET(req: NextRequest) {
  const logContext = createLogContext({ req });

  const functionLogger = createLogger(logContext, {
    module: 'genkit-openai-test/task',
    function: 'GET',
  })

  functionLogger.info(
    { ai },
    "**genkit-openai-test/task** genkit ai object initialized.",
  );

  try {
    const aiResponse = await nbaTaskFlow(logContext, taskToTest);

    // now we need to act base on the aiResponse

    await processTaskNba(logContext, taskToTest, aiResponse, 'ai');

    functionLogger.info(
      { aiResponse },
      "**genkit-openai-test/task** genkit ai flow responded.",
    );

    return NextResponse.json(aiResponse);
  } catch (error) {

    const errorJson = jsonifyError(error)
    functionLogger.error({ errorJson },
      `**genkit-openai-test/task** failed during flow exeuction.\n${formatError(error)}`
    )

    return NextResponse.json(errorJson);
  }
}
