import repos from "./starred-repos.json";
import { clearRepos, createRepo } from "./src/repo";
import ora from "ora";
import { getDb } from "./src/surreal";

const spinner = ora("Processing repositories").start();
let processed = 0;
const db = await getDb();
await clearRepos(db);
for (const repo of repos) {
  await createRepo(db, {
    id: `${repo.node.owner.login}/${repo.node.name}`,
    repoName: repo.node.name,
    repoOwner: repo.node.owner.login,
    repoUrl: repo.node.url,
    repoDescription: repo.node.description ?? "",
    repoStars: repo.node.stargazerCount,
    languages: repo.node.languages.edges.map((language) => ({
      language: language.node.name,
      size: language.size,
    })),
  });
  processed++;
  spinner.text = `Processing repositories (${processed}/${repos.length})`;
}
await db.close();
spinner.succeed(`Successfully processed ${repos.length} repositories`);
