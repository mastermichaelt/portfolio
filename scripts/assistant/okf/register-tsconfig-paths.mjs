import { register } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const loaderDir = path.dirname(fileURLToPath(import.meta.url));

register(pathToFileURL(path.join(loaderDir, "tsconfig-paths-loader.mjs")).href);
