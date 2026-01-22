/**
 * JSONL/NDJSON format converter
 * Converts base dataset to newline-delimited JSON
 * One JSON object per line
 */

import { FlatArrayDataSet } from "../types";

export function convertToJsonl(data: FlatArrayDataSet): string {
  return data.records
    .map((record) => JSON.stringify(record))
    .join("\n");
}
