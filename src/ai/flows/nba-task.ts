'use server';
import '@/ai/schema/task';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TaskSchema } from '@/lib/taskboard/vikunja-schema';
import { TaskActionInput, TaskActionInputSchema as NbaTaskInputSchema, TaskActionOutput, TaskActionOutputSchema as NbaTaskOutputSchema } from '@/ai/schema/task';
import { createLogger, LogContext } from '@/lib/logger';


// // Define helpers for cleaning/preprocessing
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

const cleanDates = (dateStr: string | undefined): string | null =>
  (dateStr == null) ? null :
    ["0001-01-01T00:00:00Z", "0001-01-01T00:00:00.000Z", ""].includes(dateStr)
      ? null
      : dateStr;

// Preprocessor with kanban-focused cleaning
function prepareTask(task: z.infer<typeof TaskSchema>) {
  // Extract current bucket - use first in array as the main bucket
  const getCurrentBucket = () => {
    if (!task.buckets || task.buckets.length === 0) return 'unknown';
    return task.buckets[0]?.title || 'unknown';
  };

  return {
    currentBucket: getCurrentBucket(),
    title: task.title,
    created_by: { username: task.created_by.username },
    created: cleanDates(task.created),
    due_date: cleanDates(task.due_date),
    priority: task.priority == null ? null : (task.priority >= 0 ? task.priority : null),
    description: task.description || '',
    attachments: task.attachments?.map(a => ({
      file: {
        name: a.file.name,
        ...(a.file.summary && {
          summary: a.file.summary
        })
      }
    })),
    comments: task.comments?.map(c => ({
      author: {
        // Normalize AI author display name
        username: c.author.username === 'ai'
          ? '@ai'
          : c.author.username
      },
      created: cleanDates(c.created),
      comment: stripHtml(c.comment) // Convert HTML to plain text
    })),
    assignees: task.assignees?.map(a => ({ username: a.username }))
  };
}

// Create new prompt for task review
const prompt = ai.prompt('task-summarize-thread/deepseekv3-01');

// Define the new task review flow
const flow = ai.defineFlow(
  {
    name: 'nbaTaskFlow',
    inputSchema: NbaTaskInputSchema,
    outputSchema: NbaTaskOutputSchema,
  },
  async input => {
    const cleanedInput = prepareTask(input);
    const { output } = await prompt(cleanedInput);
    return output!;
  }
);

export async function nbaTaskFlow(
  logContext: LogContext,
  input: TaskActionInput
): Promise<TaskActionOutput> {
  const functionLogger = createLogger(logContext, {
    module: 'nba-task',
    function: 'nbaTaskFlow',
  })

  functionLogger.info({ input }, `**nbaTaskFlow** start the ai flow`);

  const output = await flow(input);

  functionLogger.info({ output }, `**nbaTaskFlow** completed the ai flow`);

  return output;

}
