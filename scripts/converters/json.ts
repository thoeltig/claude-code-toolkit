/**
 * JSON format converter
 * Converts base dataset to minified JSON
 */

import { FlatArrayDataSet } from "../types";

export function convertToPrettyJson(data: FlatArrayDataSet): string {
  return JSON.stringify(data.records, null, 2);
}

export function convertToMinifiedJson(data: FlatArrayDataSet): string {
  return JSON.stringify(data.records);
}
