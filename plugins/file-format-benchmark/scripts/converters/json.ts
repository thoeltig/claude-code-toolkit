/**
 * JSON format converter
 * Converts base dataset to minified JSON
 */

import { FlatArrayDataSet, NestedDataSet } from "../types";

export function convertToPrettyJson(data: FlatArrayDataSet | NestedDataSet): string {
  return JSON.stringify(data.records, null, 2);
}

export function convertToMinifiedJson(data: FlatArrayDataSet | NestedDataSet): string {
  return JSON.stringify(data.records);
}
