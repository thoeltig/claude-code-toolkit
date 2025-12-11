/**
 * Format converter orchestrator
 * Routes to appropriate format converter
 */

import { BaseDataSet, Format } from "../types";
import { convertToCsv } from "./csv";
import { convertToJson, convertToMinifiedJson } from "./json";
import { convertToMarkdown } from "./markdown";
import { convertToYaml } from "./yaml";
import { convertToApacheLogs } from "./apache";

export function convertToFormat(data: BaseDataSet, format: Format): string {
  switch (format) {
    case "csv":
      return convertToCsv(data);
    case "json":
      return convertToJson(data);
    case "markdown":
      return convertToMarkdown(data);
    case "yaml":
      return convertToYaml(data);
    case "apache":
      return convertToApacheLogs(data);
    default:
      const _exhaustive: never = format;
      return _exhaustive;
  }
}

export function convertToMinifiedJson(data: BaseDataSet): string {
  return convertToMinifiedJson(data);
}

// Re-export for convenience
export { convertToCsv, convertToJson, convertToMarkdown, convertToYaml, convertToApacheLogs };
