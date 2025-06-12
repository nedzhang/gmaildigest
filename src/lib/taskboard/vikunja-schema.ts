// vikunja-schema.ts
// vikunja-schema.ts
import { z } from 'zod';

// ============== Much Cleaner Schema Definitions ==============
const UserSchema = z.object({
  created: z.string().datetime(),
  email: z.string().email().optional(),
  id: z.number().int().nonnegative(),
  name: z.string(),
  updated: z.string().datetime(),
  username: z.string(),
}).passthrough().describe("Vikunja user object");

// Create explicit types
const AttachmentSchema = z.object({
  id: z.number().int().nonnegative(),
  task_id: z.number().int().nonnegative(),
  created_by: UserSchema,
  file: z.object({
    id: z.number().int().nonnegative(),
    name: z.string(),
    mime: z.string().optional(),
    size: z.number().int().nonnegative(),
    created: z.string().datetime(),
  }),
  created: z.string().datetime(),
}).passthrough();

const CommentSchema = z.object({
  id: z.number().int().nonnegative(),
  comment: z.string(),
  author: UserSchema,
  reactions: z.record(z.array(UserSchema)).optional(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
}).passthrough();

const LabelSchema = z.object({
  created: z.string().datetime(),
  created_by: UserSchema,
  description: z.string().optional(),
  hex_color: z.string(),
  id: z.number().int().nonnegative(),
  title: z.string(),
  updated: z.string().datetime(),
}).passthrough();

const ReminderSchema = z.object({
  relative_period: z.number().int(),
  relative_to: z.enum(['due_date', 'other']),
  reminder: z.string(),
}).passthrough();

// Simplified Task Schema - much cleaner!
export const TaskSchema = z.object({
  id: z.number().int().nonnegative(),
  title: z.string(),
  description: z.string().optional(),
  done: z.boolean(),
  done_at: z.string().datetime(),
  due_date: z.string().datetime(),
  reminders: z.array(ReminderSchema).optional().default([]),
  project_id: z.number().int().nonnegative(),
  repeat_after: z.number().int().nonnegative(),
  repeat_mode: z.number().int().nonnegative(),
  priority: z.number().int().nonnegative(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  assignees: z.array(UserSchema).optional().default([]),
  labels: z.array(LabelSchema).optional().default([]),
  hex_color: z.string(),
  percent_done: z.number().int().min(0).max(100),
  identifier: z.string(),
  index: z.number().int(),
  related_tasks: z.record(z.array(z.unknown())).optional().default({}),
  attachments: z.array(AttachmentSchema).optional().default([]),
  cover_image_attachment_id: z.number().int().nonnegative(),
  is_favorite: z.boolean(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  bucket_id: z.number().int().nonnegative(),
  comments: z.array(CommentSchema).optional().default([]),
  position: z.number().int().nonnegative(),
  reactions: z.record(z.array(UserSchema)).optional().default({}),
  created_by: UserSchema,
}).passthrough();

// =====================
// Notification Schema
// =====================

export const NotificationSchema = z.object({
  created: z.string().datetime(),
  id: z.number().int().nonnegative(),
  name: z.string(),
  notification: z.unknown(),
  read_at: z.string().datetime().nullable().optional(),
}).passthrough();

export const NotificationsArraySchema = z.array(NotificationSchema);

export type NotificationsArray = z.infer<typeof NotificationsArraySchema>;

export type Task = z.infer<typeof TaskSchema>;