import { pathToFileURL } from "node:url";

import { cliReady, runCli } from "./legacy";

export { cliReady, runCli } from "./legacy";

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  void runCli(process.argv);
}
