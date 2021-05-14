// import computeSourceMap, {RawSourceMap} from "./computeSourceMap";
import {HelperManager} from "./HelperManager";
import identifyShadowedGlobals from "./identifyShadowedGlobals";
import NameManager from "./NameManager";
import {parse} from "./parser";
import type {Scope} from "./parser/tokenizer/state";
import TokenProcessor from "./TokenProcessor";
import RootTransformer from "./transformers/RootTransformer";
import formatTokens from "./util/formatTokens";
import getTSImportedNames from "./util/getTSImportedNames";
import type {Options, Transform} from "./Options";

export type {Options, Transform};

export interface TransformResult {
  code: string;
  sourceMap?: undefined;
}

export interface SucraseContext {
  tokenProcessor: TokenProcessor;
  scopes: Array<Scope>;
  nameManager: NameManager;
  importProcessor: null;
  helperManager: HelperManager;
}

// Re-export options types in an isolatedModules-friendly way so they can be used externally.
export function getVersion(): string {
  // eslint-disable-next-line
  return require("../package.json").version;
}

export function transform(code: string, options: Options): TransformResult {
  try {
    const sucraseContext = getSucraseContext(code, options);
    const transformer = new RootTransformer(sucraseContext, options.transforms, options);
    let result: TransformResult = {code: transformer.transform()};
    if (options.sourceMapOptions) {
      if (!options.filePath) {
        throw new Error("filePath must be specified when generating a source map.");
      }
      result = {
        ...result,
        sourceMap: undefined,
        // sourceMap: computeSourceMap(result.code, options.filePath, options.sourceMapOptions),
      };
    }
    return result;
  } catch (e) {
    if (options.filePath) {
      e.message = `Error transforming ${options.filePath}: ${e.message}`;
    }
    throw e;
  }
}

/**
 * Return a string representation of the sucrase tokens, mostly useful for
 * diagnostic purposes.
 */
export function getFormattedTokens(code: string, options: Options): string {
  const tokens = getSucraseContext(code, options).tokenProcessor.tokens;
  return formatTokens(code, tokens);
}

/**
 * Call into the parser/tokenizer and do some further preprocessing:
 * - Come up with a set of used names so that we can assign new names.
 * - Preprocess all import/export statements so we know which globals we are interested in.
 * - Compute situations where any of those globals are shadowed.
 *
 * In the future, some of these preprocessing steps can be skipped based on what actual work is
 * being done.
 */
function getSucraseContext(code: string, options: Options): SucraseContext {
  const isJSXEnabled = options.transforms.includes("jsx");
  const file = parse(code, isJSXEnabled);
  const tokens = file.tokens;
  const scopes = file.scopes;

  const nameManager = new NameManager(code, tokens);
  const helperManager = new HelperManager(nameManager);
  const tokenProcessor = new TokenProcessor(code, tokens, false, helperManager);

  const importProcessor = null;
  identifyShadowedGlobals(tokenProcessor, scopes, getTSImportedNames(tokenProcessor));
  return {tokenProcessor, scopes, nameManager, importProcessor, helperManager};
}
