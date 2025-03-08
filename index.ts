import { Octokit, App } from "octokit";
import { z } from "zod";
import { getSdk } from "github-graphql/req";
import { GraphQLClient } from "graphql-request";

const client = new GraphQLClient("https://api.github.com/graphql", {
  headers: {
    authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
    "User-Agent": "github-graphql package",
  },
});
const sdk = getSdk(client);

const res = await sdk.Repository({
  owner: "HuakunShen",
  name: "github-graphql",
});

console.log(res.data);

