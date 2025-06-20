import { jsonifyError } from '@/lib/error-util';
import { createLogContext, createLogger, LogContext } from '@/lib/logger';
import { TokenRequestError } from '@/lib/taskboard/vikunja-auth';
import { listProjects } from '@/lib/taskboard/vikunja-int';
import { ProjectArray } from '@/lib/taskboard/vikunja-schema';
import { NextRequest, NextResponse } from 'next/server';


const MAX_PAGES = 200; // Safeguard against infinite loops

export async function GET(req: NextRequest) {
  const logContext = createLogContext({ req });

  try {
    const projectList: number[] | undefined = await listUserProjects(logContext);

    // if (projectList) {
    //   await listProjects(logContext, projectList);
    // }
    return NextResponse.json(projectList); // Return aggregated results

  } catch (error) {
    const err = error as TokenRequestError;
    return NextResponse.json({
      error: jsonifyError(error)
    }, { status: (err && err.code) || 500 });
  }
}


async function listUserProjects(logContext: LogContext) {

  let pageNumber = 1;
  const perPage = 25;

  const projectList: number[] = [];

  while (pageNumber <= MAX_PAGES) {
    const projects = await listProjects(logContext, pageNumber, perPage);

    if (projects.success) {
      // Break conditions: invalid response or empty array
      if (!Array.isArray(projects.data) || projects.data.length === 0) {
        break;
      }
      await addToProjectList(projects.data, projectList);
      pageNumber++;
    } else {
      throw new Error(`Failed while retreiving project list. ${projects.errorMessage}`);
    }
  }

  return projectList && projectList.length > 0 ? projectList : undefined;

}

async function addToProjectList(projects: ProjectArray, projectList: number[]) {
  await Promise.all(projects.map((p: any) => {
    const projectId = p.id;
    if (projectId) projectList.push(projectId);
  }));
}

