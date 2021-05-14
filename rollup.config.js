import ts from "@wessberg/rollup-plugin-ts";
import resolve from "@rollup/plugin-node-resolve";
import analyzer from "rollup-plugin-analyzer";
import replace from "@rollup/plugin-replace";

export default {
  input: "src/light.ts",
  output: [
    {
      file: "dist/bundle.js",
      format: "es",
    },
  ],
  plugins: [
    resolve(),
    replace({
      include: ["src/parser/traverser/*.ts"],
      exclude: ["src/parser/traverser/base.ts"],
      preventAssignment: true,
      isFlowEnabled: JSON.stringify(false),
    }),
    ts(),
    analyzer({
      summaryOnly: true,
    }),
  ],
};
