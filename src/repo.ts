import { getDb } from "./surreal";
import Surreal, { jsonify } from "surrealdb";

interface Repo {
  id: string;
  repoName: string;
  repoOwner: string;
  repoUrl: string;
  repoDescription: string;
  repoStars: number;
  languages: { language: string; size: number }[];
  [key: string]: unknown;
}

export async function createRepo(db: Surreal, repo: Repo): Promise<void> {
  // Check if the database is initialized
  // Create a new repo
  try {
    const createdRepo = await db.upsert<Repo>("repo", repo);
    // const createdRepo = await db.create<Repo>("Repo", repo);
    // db.insert()
    // Log the created repo
    // console.log("Repo created:", jsonify(createdRepo));
  } catch (err: unknown) {
    console.error(
      "Failed to create repo:",
      err instanceof Error ? err.message : String(err)
    );
  }
}

export async function clearRepos(db: Surreal) {
  try {
    console.log(await db.delete("repo"));
  } catch (err: unknown) {
    console.error(
      "Failed to clear repos:",
      err instanceof Error ? err.message : String(err)
    );
  }
}

export async function readAllRepos(db: Surreal): Promise<Repo[]> {
  return await db.select<Repo>("repo");
}
