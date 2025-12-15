/**
 * JSON format converter
 * Converts base dataset to minified JSON
 */

import { BaseDataSet } from "../types";

export function convertToPrettyJson(data: BaseDataSet): string {
  return JSON.stringify(data.records, null, 2);
}

export function convertToMinifiedJson(data: BaseDataSet): string {
  return JSON.stringify(data.records);
}
