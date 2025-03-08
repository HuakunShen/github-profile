import { getAllStarredReposGraphql, getRepos } from "./src/api";

const res = await getAllStarredReposGraphql("HuakunShen");
console.log(res);
Bun.write("starred-repos.json", JSON.stringify(res, null, 2));
const repos = await getRepos([
  { owner: "CrossCopy", name: "tauri-plugin-clipboard" },
  { owner: "kunkunsh", name: "kunkun" },
]);
console.log(repos);
Bun.write("repos.json", JSON.stringify(repos, null, 2));
