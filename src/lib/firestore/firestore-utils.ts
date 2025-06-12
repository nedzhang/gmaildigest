// lib/firebase-utils.ts
export function getCollectionName(objectName: string): string {
  if (!process.env.PROJECT_CODE) {
    throw new Error("Project code environment variable not configured");
  }
  return `${process.env.PROJECT_CODE}#${objectName}`;
}

export const objectCollections = {
  users: () => getCollectionName("users"),
  tokens: (userEmail: string) => `${getCollectionName("users")}/${userEmail}/tokens`,
  emailAbstracts: (userEmail: string) => `${getCollectionName("users")}/${userEmail}/emailabs`,
  threadAbstracts: (userEmail: string) => `${getCollectionName("users")}/${userEmail}/threadabs`,
  tasks: () => getCollectionName("tasks"),
};
