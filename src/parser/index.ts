import type {Token} from "./tokenizer/index";
import type {Scope} from "./tokenizer/state";
import {augmentError, initParser, state} from "./traverser/base";
import {parseFile} from "./traverser/index";

export class File {
  tokens: Array<Token>;
  scopes: Array<Scope>;

  constructor(tokens: Array<Token>, scopes: Array<Scope>) {
    this.tokens = tokens;
    this.scopes = scopes;
  }
}

export function parse(input: string, isJSXEnabled: boolean): File {
  initParser(input, isJSXEnabled);
  const result = parseFile();
  if (state.error) {
    throw augmentError(state.error);
  }
  return result;
}
