import * as pirates from "pirates";

import {Options, transform} from "./index";

export interface HookOptions {
  matcher?: (code: string) => boolean;
  ignoreNodeModules?: boolean;
}

export type RevertFunction = () => void;

export function addHook(
  extension: string,
  options: Options,
  hookOptions?: HookOptions,
): RevertFunction {
  return pirates.addHook(
    (code: string, filePath: string): string => {
      const {code: transformedCode, sourceMap} = transform(code, {
        ...options,
        sourceMapOptions: {compiledFilename: filePath},
        filePath,
      });
      const mapBase64 = Buffer.from(JSON.stringify(sourceMap)).toString("base64");
      const suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
      return `${transformedCode}\n${suffix}`;
    },
    {...hookOptions, exts: [extension]},
  );
}

export function registerJS(hookOptions?: HookOptions): RevertFunction {
  return addHook(".js", {transforms: ["jsx"]}, hookOptions);
}

export function registerJSX(hookOptions?: HookOptions): RevertFunction {
  return addHook(".jsx", {transforms: ["jsx"]}, hookOptions);
}

export function registerTS(hookOptions?: HookOptions): RevertFunction {
  return addHook(".ts", {transforms: []}, hookOptions);
}

export function registerTSX(hookOptions?: HookOptions): RevertFunction {
  return addHook(".tsx", {transforms: ["jsx"]}, hookOptions);
}

export function registerTSLegacyModuleInterop(hookOptions?: HookOptions): RevertFunction {
  return addHook(
    ".ts",
    {
      transforms: [],
      enableLegacyTypeScriptModuleInterop: true,
    },
    hookOptions,
  );
}

export function registerTSXLegacyModuleInterop(hookOptions?: HookOptions): RevertFunction {
  return addHook(
    ".tsx",
    {
      transforms: ["jsx"],
      enableLegacyTypeScriptModuleInterop: true,
    },
    hookOptions,
  );
}

export function registerAll(hookOptions?: HookOptions): RevertFunction {
  const reverts = [
    registerJS(hookOptions),
    registerJSX(hookOptions),
    registerTS(hookOptions),
    registerTSX(hookOptions),
  ];

  return () => {
    for (const fn of reverts) {
      fn();
    }
  };
}
