"use server";

import { revalidateTag } from "next/cache";

export async function revalidateApplicationCache(applicationId: string) {
  revalidateTag("application", "max");
  revalidateTag(`application-${applicationId}`, "max");
}

export async function revalidateDocumentsCache(applicationId: string) {
  revalidateTag("documents", "max");
  revalidateTag(`documents-${applicationId}`, "max");
  revalidateTag("all-documents", "max");
  revalidateTag(`all-documents-${applicationId}`, "max");
}

export async function revalidateTasksCache(applicationId: string) {
  revalidateTag("tasks", "max");
  revalidateTag(`tasks-${applicationId}`, "max");
}

export async function revalidateClientTasksCache() {
  revalidateTag("client-tasks", "max");
}

