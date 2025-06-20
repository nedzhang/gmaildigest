// test/vikunja-schema.test.ts
import { z } from 'zod';
import {
    TaskSchema,
    ProjectSchema,
    NotificationSchema,
    ProjectsArraySchema,
    NotificationsArraySchema,
    KanbanBucketSchema,
    SubscriptionSchema,
    FilterSchema,
    BucketConfigurationSchema,
    ViewItemSchema
} from './vikunja-schema';


describe('Vikunja Schema Validation Tests', () => {
    // Helper to generate base data
    const baseUser = {
        id: 1,
        username: 'testuser',
        created: '2023-01-01T00:00:00Z',
        updated: '2023-01-01T00:00:00Z',
        name: 'Test User'
    };

    const minimalTask = {
        id: 1,
        title: 'Minimal task',
        done: false,
        project_id: 1,
        hex_color: '#7f23ff',
        percent_done: 0,
        identifier: '#1',
        index: 1,
        cover_image_attachment_id: 0,
        is_favorite: false,
        created: '2023-01-01T00:00:00Z',
        updated: '2023-01-01T00:00:00Z',
        position: 0,
        created_by: baseUser
    };

    const dbTask = {
      "due_date": "0001-01-01T00:00:00Z",
      "position": 0,
      "updated": "2025-06-15T13:54:59Z",
      "buckets": [
        {
          "limit": 0,
          "id": 2,
          "updated": "2025-06-09T16:02:10Z",
          "title": "Crafting",
          "created": "2025-06-09T16:02:10Z",
          "position": 100,
          "count": 0,
          "project_view_id": 5
        }
      ],
      "hex_color": "",
      "start_date": "0001-01-01T00:00:00Z",
      "created": "2025-06-15T13:53:32Z",
      "percent_done": 0,
      "is_favorite": false,
      "identifier": "#2",
      "cover_image_attachment_id": 0,
      "title": "need a quick quote for Liquid N",
      "attachments": [
        {
          "file": {
            "name": "2_RFQ-NIAID-25-2248299.pdf",
            "size": 168314,
            "id": 2,
            "mime": "",
            "created": "2025-06-15T13:54:59Z"
          },
          "created": "2025-06-15T13:54:59Z",
          "task_id": 2,
          "created_by": {
            "id": 2,
            "updated": "2025-06-09T16:02:10Z",
            "username": "test2",
            "created": "2025-06-09T16:02:10Z",
            "name": ""
          },
          "id": 2
        }
      ],
      "created_by": {
        "created": "2025-06-09T16:02:10Z",
        "username": "test2",
        "name": "",
        "id": 2,
        "updated": "2025-06-09T16:02:10Z"
      },
      "done_at": "0001-01-01T00:00:00Z",
      "project_id": 2,
      "priority": 0,
      "bucket_id": 0,
      "description": "<p>Got a call from Mildred Moss for a quick quote. Attached the document that they have created. </p>",
      "id": 2,
      "repeat_mode": 0,
      "related_tasks": {},
      "repeat_after": 0,
      "end_date": "0001-01-01T00:00:00Z",
      "index": 2,
      "done": false
    };

    describe('TaskSchema', () => {
        const minimalTask = {
            id: 1,
            title: 'Minimal task',
            done: false,
            project_id: 1,
            hex_color: '#7f23ff',
            percent_done: 0,
            identifier: '#1',
            index: 1,
            cover_image_attachment_id: 0,
            is_favorite: false,
            created: '2023-01-01T00:00:00Z',
            updated: '2023-01-01T00:00:00Z',
            position: 0,
            created_by: baseUser
        };

        it('validates minimal task', () => {
            expect(() => TaskSchema.parse(minimalTask)).not.toThrow();
        });

        it('validates full task', () => {
            const fullTask = {
                ...minimalTask,
                description: 'Task description',
                due_date: '2023-12-31T00:00:00Z',
                done_at: '2023-01-02T00:00:00Z',
                reminders: [{ relative_period: 3600, relative_to: 'due_date' }],
                repeat_after: 86400,
                repeat_mode: 1,
                priority: 2,
                start_date: '2023-01-01T00:00:00Z',
                end_date: '2023-12-31T00:00:00Z',
                assignees: [baseUser],
                labels: [{
                    id: 1,
                    title: 'Important',
                    hex_color: '#ff0000',
                    created: '2023-01-01T00:00:00Z',
                    updated: '2023-01-01T00:00:00Z',
                    created_by: baseUser
                }],
                related_tasks: { block: [] },
                attachments: [{
                    id: 1,
                    task_id: 1,
                    created_by: baseUser,
                    file: {
                        id: 1,
                        name: 'document.pdf',
                        size: 1024,
                        created: '2023-01-01T00:00:00Z'
                    },
                    created: '2023-01-01T00:00:00Z'
                }],
                bucket_id: 1,
                comments: [{
                    id: 1,
                    comment: 'Comment text',
                    author: baseUser,
                    created: '2023-01-01T00:00:00Z',
                    updated: '2023-01-01T00:00:00Z'
                }],
                reactions: { '🔥': [baseUser] },
                buckets: [{
                    id: 1,
                    title: 'Backlog',
                    project_view_id: 5,
                    limit: 10,
                    count: 5,
                    position: 100,
                    created: '2023-01-01T00:00:00Z',
                    updated: '2023-01-01T00:00:00Z',
                }]
            };
            expect(() => TaskSchema.parse(fullTask)).not.toThrow();
        });

        it('rejects invalid percent_done', () => {
            const invalidTask = { ...minimalTask, percent_done: 150 };
            expect(() => TaskSchema.parse(invalidTask)).toThrow();
        });

        it('rejects missing required fields', () => {
            const invalidTask = { ...minimalTask };
            delete invalidTask.title;
            expect(() => TaskSchema.parse(invalidTask)).toThrow();
        });

        it('Validate db version of task', () => {

            expect(() => TaskSchema.parse(dbTask)).not.toThrow();
        });
    });

    describe('ProjectSchema', () => {
        const minimalProject = {
            id: 1,
            title: 'Minimal Project',
            description: 'Project description',
            hex_color: '#333333',
            created: '2023-01-01T00:00:00Z',
            updated: '2023-01-01T00:00:00Z',
            is_archived: false,
            is_favorite: false,
            identifier: 'PROJ-1',
            position: 1,
            owner: baseUser,
            max_right: 50,
        };

        it('validates minimal project', () => {
            expect(() => ProjectSchema.parse(minimalProject)).not.toThrow();
        });

        it('validates full project', () => {
            const fullProject = {
                ...minimalProject,
                background_blur_hash: 'LKV|yDx]00}l0dHXkoz6TxZxaxjG',
                background_information: {
                    type: 'unsplash',
                    author_name: 'John Doe'
                },
                parent_project_id: 0,
                subscription: {
                    id: 1,
                    created: '2023-01-01',
                    entity: 1,
                    entity_id: 1
                },
                views: [{
                    created: '2023-01-01T00:00:00Z',
                    id: 1,
                    title: 'Main View',
                    position: 1,
                    project_id: 1,
                    updated: '2023-01-01T00:00:00Z',
                    view_kind: 'kanban',
                    bucket_configuration: [{
                        title: 'Column 1',
                        filter: { order_by: ['id'], filter_include_nulls: true }
                    }],
                    bucket_configuration_mode: 'manual',
                    default_bucket_id: 1,
                    done_bucket_id: 5,
                    filter: { s: 'active' }
                }]
            };
            expect(() => ProjectSchema.parse(fullProject)).not.toThrow();
        });
    });

    describe('NotificationSchema', () => {
        const minimalNotification = {
            id: 1,
            name: 'test_notification',
            notification: { key: 'value' },
            created: '2023-01-01T00:00:00Z'
        };

        it('validates minimal notification', () => {
            expect(() => NotificationSchema.parse(minimalNotification)).not.toThrow();
        });

        it('validates with read_at', () => {
            const notification = {
                ...minimalNotification,
                read_at: '2023-01-02T00:00:00Z'
            };
            expect(() => NotificationSchema.parse(notification)).not.toThrow();
        });
    });

    describe('SubscriptionSchema', () => {
        it('validates subscription', () => {
            const subscription = {
                created: '2023-01-01',
                entity: 1,
                entity_id: 2,
                id: 3
            };
            expect(() => SubscriptionSchema.parse(subscription)).not.toThrow();
        });

        // the date might not be a ISO date format
        // it('rejects invalid date format', () => {
        //     const invalid = {
        //         created: '2023/01/01',
        //         entity: 1,
        //         entity_id: 2,
        //         id: 3
        //     };
        //     expect(() => SubscriptionSchema.parse(invalid)).toThrow();
        // });
    });

    describe('FilterSchema', () => {
        it('validates with all optional fields', () => {
            const filter = {
                filter: 'active:true',
                filter_include_nulls: true,
                order_by: ['title', '-created'],
                s: 'search term',
                sort_by: ['priority']
            };
            expect(() => FilterSchema.parse(filter)).not.toThrow();
        });

        it('validates with empty object', () => {
            expect(() => FilterSchema.parse({})).not.toThrow();
        });
    });

    describe('BucketConfigurationSchema', () => {
        it('validates bucket configuration', () => {
            const config = {
                title: 'Column Config',
                filter: { s: 'important' }
            };
            expect(() => BucketConfigurationSchema.parse(config)).not.toThrow();
        });
    });

    describe('ViewItemSchema', () => {
        const minimalView = {
            created: '2023-01-01T00:00:00Z',
            id: 1,
            position: 1,
            project_id: 1,
            title: 'Main View',
            updated: '2023-01-01T00:00:00Z',
            view_kind: 'list'
        };

        it('validates minimal view item', () => {
            expect(() => ViewItemSchema.parse(minimalView)).not.toThrow();
        });

        it('validates full view item', () => {
            const fullView = {
                ...minimalView,
                bucket_configuration: [{
                    title: 'Column',
                    filter: { order_by: ['id'] }
                }],
                bucket_configuration_mode: 'auto',
                default_bucket_id: 1,
                done_bucket_id: 2,
                filter: { filter: 'status:active' }
            };
            expect(() => ViewItemSchema.parse(fullView)).not.toThrow();
        });
    });


    describe('KanbanBucketSchema', () => {
        const minimalBucket = {
            id: 1,
            title: 'Backlog',
            project_view_id: 1,
            position: 100,
            created: '2023-01-01T00:00:00Z',
            updated: '2023-01-01T00:00:00Z',
            created_by: {
                id: 1,
                name: 'Owner',
                username: 'owner',
                created: '2023-01-01T00:00:00Z',
                updated: '2023-01-01T00:00:00Z'
            }
        };

        it('validates minimal kanban bucket', () => {
            expect(() => KanbanBucketSchema.parse(minimalBucket)).not.toThrow();
        });

        it('validates with tasks', () => {
            // Now uses the globally available minimalTask
            const bucketWithTasks = {
                ...minimalBucket,
                tasks: [{
                    ...minimalTask,
                    id: 1,
                    title: 'Task in bucket'
                }],
                limit: 10,
                count: 1
            };
            expect(() => KanbanBucketSchema.parse(bucketWithTasks)).not.toThrow();
        });
    });

    describe('ProjectsArraySchema', () => {
        it('validates projects array', () => {
            const projects = [
                {
                    id: 1,
                    title: 'Project 1',
                    description: 'First project',
                    hex_color: '#111111',
                    created: '2023-01-01T00:00:00Z',
                    updated: '2023-01-01T00:00:00Z',
                    is_archived: false,
                    is_favorite: false,
                    identifier: 'P1',
                    position: 1,
                    owner: baseUser
                },
                {
                    id: 2,
                    title: 'Project 2',
                    description: 'Second project',
                    hex_color: '#222222',
                    created: '2023-01-02T00:00:00Z',
                    updated: '2023-01-02T00:00:00Z',
                    is_archived: true,
                    is_favorite: true,
                    identifier: 'P2',
                    position: 2,
                    owner: baseUser
                }
            ];
            expect(() => ProjectsArraySchema.parse(projects)).not.toThrow();
        });

        it('rejects invalid project array', () => {
            const projects = [
                {
                    title: 'Invalid Project',
                    // Missing required fields
                }
            ];
            expect(() => ProjectsArraySchema.parse(projects)).toThrow();
        });
    });

    describe('NotificationsArraySchema', () => {
        it('validates notifications array', () => {
            const notifications = [
                {
                    id: 1,
                    name: 'note1',
                    notification: { data: 'value1' },
                    created: '2023-01-01T00:00:00Z',
                    read_at: null
                },
                {
                    id: 2,
                    name: 'note2',
                    notification: { data: 'value2' },
                    created: '2023-01-02T00:00:00Z'
                }
            ];
            expect(() => NotificationsArraySchema.parse(notifications)).not.toThrow();
        });

        it('rejects invalid notifications', () => {
            const notifications = [
                {
                    name: 'invalid',
                    // Missing id and created
                }
            ];
            expect(() => NotificationsArraySchema.parse(notifications)).toThrow();
        });
    });
});
