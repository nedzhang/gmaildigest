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

// // Create explicit types
// const AttachmentSchema = z.object({
//   id: z.number().int().nonnegative(),
//   task_id: z.number().int().nonnegative(),
//   created_by: UserSchema,
//   file: z.object({
//     id: z.number().int().nonnegative(),
//     name: z.string(),
//     mime: z.string().optional(),
//     size: z.number().int().nonnegative(),
//     created: z.string().datetime(),
//     summary: z.string().optional(),
//   }),
//   created: z.string().datetime(),
// }).passthrough();

export const CommentSchema = z.object({
  id: z.number().int().nonnegative(),
  comment: z.string(),
  author: UserSchema,
  reactions: z.record(z.array(UserSchema)).optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional(),
}).passthrough();

export type Comment = z.infer<typeof CommentSchema>;

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
  reminder: z.string().optional(),
}).passthrough();

// // Simplified Task Schema - much cleaner!
// export const TaskSchema = z.object({
//   id: z.number().int().nonnegative(),
//   title: z.string(),
//   description: z.string().optional(),
//   done: z.boolean(),
//   done_at: z.string().datetime(),
//   due_date: z.string().datetime(),
//   reminders: z.array(ReminderSchema).optional().default([]),
//   project_id: z.number().int().nonnegative(),
//   repeat_after: z.number().int().nonnegative(),
//   repeat_mode: z.number().int().nonnegative(),
//   priority: z.number().int().nonnegative(),
//   start_date: z.string().datetime(),
//   end_date: z.string().datetime(),
//   assignees: z.array(UserSchema).optional().default([]),
//   labels: z.array(LabelSchema).optional().default([]),
//   hex_color: z.string(),
//   percent_done: z.number().int().min(0).max(100),
//   identifier: z.string(),
//   index: z.number().int(),
//   related_tasks: z.record(z.array(z.unknown())).optional().default({}),
//   attachments: z.array(AttachmentSchema).optional().default([]),
//   cover_image_attachment_id: z.number().int().nonnegative(),
//   is_favorite: z.boolean(),
//   created: z.string().datetime(),
//   updated: z.string().datetime(),
//   bucket_id: z.number().int().nonnegative(),
//   comments: z.array(CommentSchema).optional().default([]),
//   position: z.number().int().nonnegative(),
//   reactions: z.record(z.array(UserSchema)).optional().default({}),
//   created_by: UserSchema,
// }).passthrough();

// Add Bucket schema
const BucketSchema = z.object({
  id: z.number().int().nonnegative(),
  title: z.string(),
  project_view_id: z.number().int().nonnegative(),
  limit: z.number().int(),
  count: z.number().int(),
  position: z.number().int(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
}).passthrough();

// Also update AttachmentSchema to include the summary field
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
    summary: z.string().optional(), // Add summary field
  }),
  created: z.string().datetime(),
}).passthrough();

// Define new applicaiton action (things that AI/App can do to a task and maybe other objects later)
export const AppActionSchema = z.object({
  action: z.enum(["comment", "append", "upload", "email", "nothing"]),
  payload: z.object({
    content: z.string(),
    filename: z.string().optional(),
    subject: z.string().optional(),
    to: z.string().optional()
  }),
  reason: z.string(),
  created: z.string().optional(),
});

export type AppAction = z.infer<typeof AppActionSchema>;

// Update TaskSchema to include buckets and refine other fields
export const TaskSchema = z.object({
  id: z.number().int().nonnegative(),
  title: z.string(),
  description: z.string().optional(),
  done: z.boolean(),
  done_at: z.string().datetime().optional(),
  due_date: z.string().datetime().optional(),
  reminders: z.array(ReminderSchema).optional(),
  project_id: z.number().int().nonnegative(),
  repeat_after: z.number().int().nonnegative().optional(),
  repeat_mode: z.number().int().nonnegative().optional(),
  priority: z.number().int().nonnegative().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  assignees: z.array(UserSchema).optional(),
  labels: z.array(LabelSchema).optional(),
  hex_color: z.string(),
  percent_done: z.number().int().min(0).max(100),
  identifier: z.string(),
  index: z.number().int(),
  related_tasks: z.record(z.array(z.unknown())).optional(),
  attachments: z.array(AttachmentSchema).optional(),
  cover_image_attachment_id: z.number().int().nonnegative(),
  is_favorite: z.boolean(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  bucket_id: z.number().int().nonnegative().optional(),
  comments: z.array(CommentSchema).optional(),
  position: z.number().int().nonnegative(),
  reactions: z.record(z.array(UserSchema)).optional(),
  created_by: UserSchema,
  buckets: z.array(BucketSchema).optional(), // Add new field
  app_actions: z.array(AppActionSchema).optional().describe('Actions that AI/App has done to the task'),
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



export const SubscriptionSchema = z.object({
  created: z.string(),
  entity: z.number(),
  entity_id: z.number(),
  id: z.number(),
});

export const FilterSchema = z.object({
  filter: z.string().optional(),
  filter_include_nulls: z.boolean().optional(),
  order_by: z.array(z.string()).optional(),
  s: z.string().optional(),
  sort_by: z.array(z.string()).optional(),
});

export const BucketConfigurationSchema = z.object({
  filter: FilterSchema.optional(),
  title: z.string(),
});

export const ViewItemSchema = z.object({
  bucket_configuration: z.array(BucketConfigurationSchema).optional(),
  bucket_configuration_mode: z.string().optional(),
  created: z.string(),
  default_bucket_id: z.number().optional(),
  done_bucket_id: z.number().optional(),
  filter: FilterSchema.optional(),
  id: z.number(),
  position: z.number(),
  project_id: z.number(),
  title: z.string(),
  updated: z.string(),
  view_kind: z.string(),
});

export const ProjectSchema = z.object({
  background_blur_hash: z.string().optional().nullable(),
  background_information: z.unknown().nullable(),
  created: z.string(),
  description: z.string(),
  hex_color: z.string(),
  id: z.number(),
  identifier: z.string(),
  is_archived: z.boolean(),
  is_favorite: z.boolean(),
  max_right: z.number().optional(),
  owner: UserSchema,
  parent_project_id: z.number().optional().nullable(),
  position: z.number(),
  subscription: SubscriptionSchema.optional().nullable(),
  title: z.string(),
  updated: z.string(),
  views: z.array(ViewItemSchema).optional(),
});

// Kanban specific schemas
export const KanbanBucketSchema = z.object({
  id: z.number().int().nonnegative(),
  title: z.string(),
  project_view_id: z.number().int().nonnegative(),
  tasks: z.array(TaskSchema).optional(),
  limit: z.number().int().optional(),
  count: z.number().int().optional(),
  position: z.number().int(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  created_by: UserSchema.pick({ 
    id: true, 
    name: true, 
    username: true, 
    created: true, 
    updated: true 
  }),
}).passthrough();

export const KanbanBucketArraySchema = z.array(KanbanBucketSchema);

export type KanbanBucket = z.infer<typeof KanbanBucketSchema>;

export const ProjectsArraySchema = z.array(ProjectSchema);

export type Project = z.infer<typeof ProjectSchema>;

export type ProjectArray = z.infer<typeof ProjectsArraySchema>

export const NotificationsArraySchema = z.array(NotificationSchema);

export type NotificationsArray = z.infer<typeof NotificationsArraySchema>;

export type Task = z.infer<typeof TaskSchema>;