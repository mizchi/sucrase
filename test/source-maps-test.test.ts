import * as assert from "assert";

import {transform} from "../src";
import {test} from "./folio.config";

test("generates a simple line-based source map", () => {
  const result = transform(
    `\
      import a from "./a";
      const x: number = 1;
      console.log(x + 1);
    `,
    {
      transforms: [],
      sourceMapOptions: {compiledFilename: "test.js"},
      filePath: "test.ts",
    },
  );
  assert.deepEqual(result.sourceMap, {
    version: 3,
    sources: ["test.ts"],
    names: [],
    mappings: "AAAA;AACA;AACA;AACA",
    file: "test.js",
  });
});
