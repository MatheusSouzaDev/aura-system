import Module from "node:module";
import path from "node:path";

type ResolveFilenameFn = (
  request: string,
  parent: NodeModule | null,
  isMain: boolean,
  options: unknown,
) => string;

const moduleConstructor = Module as unknown as {
  _resolveFilename: ResolveFilenameFn;
};

const originalResolveFilename = moduleConstructor._resolveFilename;
const projectRoot = process.cwd();
const compiledRoot = path.join(projectRoot, ".test-dist");
const stubbedModules: Record<string, string> = {
  "@/app/_components/add-transaction-button": path.join(
    compiledRoot,
    "tests",
    "__mocks__",
    "add-transaction-button.js",
  ),
};

moduleConstructor._resolveFilename = function patchedResolveFilename(
  request: string,
  parent: NodeModule | null,
  isMain: boolean,
  options: unknown,
) {
  if (request in stubbedModules) {
    return originalResolveFilename.call(
      this,
      stubbedModules[request],
      parent,
      isMain,
      options,
    );
  }

  if (request.startsWith("@/")) {
    const absolutePath = path.resolve(compiledRoot, request.slice(2));
    return originalResolveFilename.call(
      this,
      absolutePath,
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
