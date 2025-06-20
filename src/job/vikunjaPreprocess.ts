import { summarizeText } from "@/ai/flows/summarize-text";
import { formatError, jsonifyError } from "@/lib/error-util";
import { extractText } from "@/lib/extract-text-util";
import { getTaskAbs, setTaskAbs } from "@/lib/firestore/task-store";
import { ChildLogger, createLogger, LogContext } from "@/lib/logger";
import { deepMergeObjects, shallowCopyObjProperties } from "@/lib/object-util";
import { getAttachment, getBucketsInProject, hydrateTask, listProjects } from "@/lib/taskboard/vikunja-int";
import { KanbanBucket, Project, Task } from "@/lib/taskboard/vikunja-schema";
import { objectInputType, ZodNumber, ZodString, ZodOptional, ZodArray, ZodObject, ZodBoolean, ZodEnum, ZodTypeAny, objectOutputType, ZodRecord, ZodUnknown } from "zod";


const MAX_PAGES = 200;

export async function preprocessKanbanBuckets(logContext: LogContext) {

    const functionLogger = createLogger(logContext, {
        module: 'vikunjaPreprocess',
        function: 'preprocessKanbanBuckets',
    })
    // Get all projects
    const projectList = await listUserProjects(logContext);

    if (projectList && projectList.length > 0) {
        // Go through each project to find kanban views
        for (const project of projectList) {
            if (!project.views || project.views.length === 0) {
                functionLogger.error({ projectId: project.id }, 'Project has no views. Skipping.');
                continue;
            }

            // Find kanban view (view_kind = "kanban")
            const kanbanView = project.views.find(view => view.view_kind === 'kanban');

            if (!kanbanView) {
                functionLogger.error({ projectId: project.id }, 'Project has no kanban view. Skipping.');
                continue;
            }

            functionLogger.trace(
                { projectId: project.id, viewId: kanbanView.id },
                `Found kanban view "${kanbanView.title}" (${kanbanView.id})`
            );


            try {
                // Get tasks for this kanban view
                const projectBuckets = await getAllBucketsInProject(logContext, project.id, kanbanView.id);


                // // Validate and parse bucket data
                // const parseResult = KanbanBucketArraySchema.safeParse(projectBuckets);

                // if (!parseResult.success) {
                //     functionLogger.error(
                //         { projectId: project.id, errors: parseResult.error.flatten() },
                //         'Invalid kanban bucket data format'
                //     );
                //     continue;
                // }

                // const buckets = parseResult.data;

                if (projectBuckets) {
                    // Process each bucket in the kanban view
                    for (const bucket of projectBuckets) {
                        // await processBucket(logContext, bucket, project.id, kanbanView.id);
                        if (bucket.tasks && bucket.tasks.length > 0) {
                            functionLogger.info({ bucket }, `Prepare to preproces tasks in bucket: ${bucket.title}`)
                            processTasksInBucket(logContext, bucket);
                        } else {
                            functionLogger.debug({ bucket }, `Skipping bucket because it has no tasks. Bucket title: ${bucket.title}`);
                        }
                    }
                }

            } catch (error) {
                functionLogger.error({ error: jsonifyError(error) },
                    `Failed to get buckets for project: ${project.id} view: ${kanbanView.id}. error: ${formatError(error)}`);
            }
        }

        functionLogger.info({ projectCount: projectList.length }, 
            `Finished processing user projects for user`);

    }
}


async function listUserProjects(logContext: LogContext) {

    let pageNumber = 1;
    const perPage = 25;

    const projectList: Project[] = []

    while (pageNumber <= MAX_PAGES) {
        const apiResult = await listProjects(logContext, pageNumber, perPage);

        if (apiResult.success) {
            // Break conditions: invalid response or empty array
            if (!Array.isArray(apiResult.data) || apiResult.data.length === 0) {
                break;
            }

            projectList.push(...apiResult.data);

            //   await addToProjectList(projects.data, projectList);
            pageNumber++;
        } else {
            throw new Error(`Failed while retreiving project list. ${apiResult.errorMessage}`);
        }
    }

    return projectList && projectList.length > 0 ? projectList : undefined;

}

async function getAllBucketsInProject(logContext: LogContext, projectId: number, viewId: number) {

    let pageNumber = 1;
    const perPage = 500;

    const functionLogger = createLogger(logContext, {
        module: 'vikunjaPreprocess',
        function: 'getAllBucketsInProject',
    })

    // vikunja api doesn't page this API. it would just return the first page again and again. 

    const apiResult = await getBucketsInProject(logContext, projectId, viewId, pageNumber, perPage);

    if (!apiResult.success) {
        functionLogger.error({ error: jsonifyError(apiResult.errorData) },
            `Failed to get buckets in project ${projectId} with view ${viewId}. ${apiResult.errorMessage}`
        )
        throw new Error(`Failed to get buckets in project ${projectId} with view ${viewId}.`)
    }


    if (!Array.isArray(apiResult.data) || apiResult.data.length === 0) {
        return undefined;
    } else {
        return apiResult.data;
    }



    // const bucketList: KanbanBucket[] = [];

    // while (pageNumber <= MAX_PAGES) {
    //     const apiResult = await getBucketsInProject(logContext, projectId, viewId, pageNumber, perPage);

    //     if (apiResult.success) {
    //         // Break conditions: invalid response or empty array
    //         if (!Array.isArray(apiResult.data) || apiResult.data.length === 0) {
    //             break;
    //         }

    //         bucketList.push(...apiResult.data);

    //         //   await addToProjectList(projects.data, projectList);
    //         pageNumber++;
    //     } else {
    //         throw new Error(`Failed while retreiving project list. ${apiResult.errorMessage}`);
    //     }
    // }

    // return bucketList;

}


async function processTasksInBucket(logContext: LogContext, bucket: KanbanBucket) {
    const functionLogger = createLogger(logContext, {
        module: 'vikunjaPreprocess',
        function: 'processTasksInBucket',
    })

    if (bucket && bucket.tasks && bucket.tasks.length > 0) {

        // const bucketSimple = shallowCopyObjProperties(bucket, ["id", "title", "project_view_id", "limit", "count", "position", "created", "updated"]);

        for (const task of bucket.tasks) {
            // // put bucket into task
            // task.buckets = [bucketSimple];
            // now we should hydrate the task with the task in DB. 
            const hydratedTask: Task = await hydrateTask(logContext, task.id);
            // save the task to db
            setTaskAbs(logContext, task.id.toString(), hydratedTask);
        }

    } else {

        functionLogger.warn({ bucket }, `processTaskInBucket called with a bucket without tasks. Callers should have checked for this. Maybe something to look into. bucket id: ${bucket.id}`);
        return;

    }
}

