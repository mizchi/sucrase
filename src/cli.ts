import {transform} from "./index";
import path from "path";
import fs from "fs";

const target = path.join(process.cwd(), process.argv[2]);

if (fs.existsSync(target)) {
  const code = fs.readFileSync(target, "utf-8");
  const out = transform(code, {transforms: ["jsx"]});
  console.log(out.code);
}
