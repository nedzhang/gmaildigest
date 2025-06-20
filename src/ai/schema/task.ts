import { AppActionSchema, TaskSchema } from "@/lib/taskboard/vikunja-schema"
import { z } from "zod";
import { ai } from "../genkit";

// ##############################################################
// ************************ Task Thread ************************
// ##############################################################


export const TaskActionInputSchema = TaskSchema; // We'll use the full schema

export type TaskActionInput = z.infer<typeof TaskActionInputSchema>;

// Define the schema so we can use it in our prompt files.
ai.defineSchema(
  "TaskActionInputSchema",
  TaskActionInputSchema,
);

// Define new input/output schemas for kanban review
export const TaskActionOutputSchema = AppActionSchema;

export type TaskActionOutput = z.infer<
  typeof TaskActionOutputSchema
>;

// Define the schema so we can use it in our prompt files.
ai.defineSchema(
  "TaskActionOutputSchema",
  TaskActionOutputSchema,
);
