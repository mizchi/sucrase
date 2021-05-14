import {throws} from "assert";

import {transform} from "../src";
import {test} from "./folio.config";

test("gives proper line numbers in syntax errors", () => {
  throws(
    () => transform("const x = 1;\nconst y = )\n", {transforms: []}),
    /SyntaxError: Unexpected token \(2:11\)/,
  );
});
