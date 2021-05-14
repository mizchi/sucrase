import {URL, pathToFileURL} from "url";
import {transform} from "./index";

const baseURL = pathToFileURL(`${process.cwd()}/`).href;

const extensionsRegex = /\.tsx?$/;

export function resolve(specifier: string, context: any, defaultResolve: any) {
  const {parentURL = baseURL} = context;
  if (extensionsRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href,
    };
  }

  // Let Node.js handle all other specifiers.
  return defaultResolve(specifier, context, defaultResolve);
}

export function getFormat(url: string, context: any, defaultGetFormat: any) {
  if (extensionsRegex.test(url)) {
    return {
      format: "module",
    };
  }
  return defaultGetFormat(url, context, defaultGetFormat);
}

export function transformSource(source: Buffer, context: any, defaultTransformSource: any) {
  const {url, format} = context;
  if (extensionsRegex.test(url)) {
    const text = source.toString("utf-8");
    return {
      source: transform(text, {transforms: ["jsx"]}).code,
    };
  }
  return defaultTransformSource(source, context, defaultTransformSource);
}
