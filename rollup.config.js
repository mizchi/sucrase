import ts from "@wessberg/rollup-plugin-ts";
import resolve from "@rollup/plugin-node-resolve";
import analyzer from "rollup-plugin-analyzer";
import {terser} from "rollup-plugin-terser";

const plugins = [
  resolve(),
  ts(),
  analyzer({
    summaryOnly: true,
  }),
  terser({module: true}),
];

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "es",
      },
    ],
    plugins,
  },
  {
    input: "src/cli.ts",
    output: [
      {
        file: "dist/cli.js",
        format: "es",
      },
    ],
    plugins,
  },
  {
    input: "src/loader.ts",
    output: [
      {
        file: "dist/loader.js",
        format: "es",
      },
    ],
    plugins,
  },
];
