/**
 * JSONL/NDJSON format converter
 * Converts base dataset to newline-delimited JSON
 * One JSON object per line
 */

import { BaseDataSet } from "../types";

export function convertToJsonl(data: BaseDataSet): string {
  return data.records
    .map((record) => JSON.stringify(record))
    .join("\n");
}
