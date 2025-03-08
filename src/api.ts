import { Octokit, App } from "octokit";
import { GraphQLClient } from "graphql-request";
import { z } from "zod";
import { type RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { getSdk } from "github-graphql/req";
import pLimit from "p-limit";

export const client = new GraphQLClient("https://api.github.com/graphql", {
  headers: {
    authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
    "User-Agent": "github-graphql package",
  },
});
export const sdk = getSdk(client);

export const octokit = new Octokit({
  auth: z.string().parse(process.env.GITHUB_TOKEN),
});

export type RepoResponse =
  RestEndpointMethodTypes["activity"]["listReposStarredByUser"]["response"]["data"][number];

export async function getAllStarredReposRest(username: string) {
  let repos: RepoResponse[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const response = await octokit.rest.activity.listReposStarredByUser({
        username: username,
        per_page: 200,
        page: page,
      });

      repos = repos.concat(response.data);
      hasNextPage = response.data.length === 100;
      page++;
    } catch (error) {
      console.error("Error fetching starred repositories:", error);
      break;
    }
  }
  return repos;
  console.log(`Total starred repositories: ${repos.length}`);
  await Bun.write("starred-repos2.json", JSON.stringify(repos, null, 2));
  repos.forEach((item, index) => {
    const repoInfo = "repo" in item ? item.repo : item;
    console.log(
      `${index + 1}. ${repoInfo.name} - ${
        repoInfo.description || "No description"
      }`
    );
  });
}
export async function getAllStarredReposGraphql(username: string) {
  let allRepos: any[] = [];
  let hasNextPage = true;
  let after: string | null = null;

  while (hasNextPage) {
    console.log(`Fetching page ${after}`);
    const startTime = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // @ts-ignore - Types need to be regenerated for the new query structure
    const res = await sdk.UserStarredRepos({
      username: username,
      after,
      first: 100,
    });

    if (res.errors) {
      console.error(res.errors);
      throw new Error(res.errors[0].message);
    }

    if (!res.data.user) {
      throw new Error(`User ${username} not found`);
    }

    const { edges, pageInfo } = res.data.user.starredRepositories;
    if (edges) {
      allRepos = allRepos.concat(edges); // Append new results since we're going forwards
    }
    // @ts-ignore - Types need to be regenerated for the new query structure
    hasNextPage = pageInfo.hasNextPage;
    // @ts-ignore - Types need to be regenerated for the new query structure
    after = pageInfo.endCursor ?? null;

    const endTime = performance.now();
    console.log(`Page fetch took ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`Total repos fetched: ${allRepos.length}`);
  }

  return allRepos;
}

export async function getRepos(repos: { owner: string; name: string }[]) {
  // Using p-limit for concurrency control
  const limit = pLimit(10);

  const results = await Promise.allSettled(
    repos.map((repo) =>
      limit(async () => {
        try {
          const res = await sdk.Repository({
            owner: repo.owner,
            name: repo.name,
          });
          if (!res.data) {
            throw new Error(`No data returned for ${repo.owner}/${repo.name}`);
          }
          return res.data;
        } catch (error) {
          console.error(`Failed to fetch ${repo.owner}/${repo.name}:`, error);
          throw error;
        }
      })
    )
  );

  // Filter out failures and only keep successful results
  return results
    .filter(
      (result): result is PromiseFulfilledResult<any> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
}
