export {test, expect} from "folio";
import {test, setConfig} from "folio";

setConfig({testDir: __dirname, timeout: 20000});

test.runWith({retries: 0});
