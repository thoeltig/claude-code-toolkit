/**
 * Format converter orchestrator
 * Routes to appropriate format converter
 */

import { BaseDataSet, Format } from "../types";
import { convertToCsv } from "./csv";
import { convertToPrettyJson, convertToMinifiedJson } from "./json";
import { convertToMarkdown } from "./markdown";
import { convertToYaml } from "./yaml";
import { convertToApacheLogs } from "./apache";
import { convertToJsonl } from "./jsonl";
import { convertToToonV21 } from "./toon-v2-1";

export function convertToFormat(data: BaseDataSet, format: Format): string {
  switch (format) {
    case "csv":
      return convertToCsv(data);
    case "json_pretty":
      return convertToPrettyJson(data);
    case "json_compact":
      return convertToMinifiedJson(data);
    case "markdown":
      return convertToMarkdown(data);
    case "yaml":
      return convertToYaml(data);
    case "apache":
      return convertToApacheLogs(data);
    case "jsonl":
      return convertToJsonl(data);
    case "toon_v2_1":
      return convertToToonV21(data);
    default:
      const _exhaustive: never = format;
      return _exhaustive;
  }
}