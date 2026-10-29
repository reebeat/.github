// The live platform services (file system, path, child processes) of the node composition root. The CLI and the tests
// that run real files and processes both take them from here, so one module names the platform package.
import { NodeServices } from "@effect/platform-node";

export const nodeServices = NodeServices.layer;
