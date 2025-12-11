/**
 * JSON format converter
 * Converts base dataset to minified JSON
 */

import { BaseDataSet } from "../types";

export function convertToJson(data: BaseDataSet): string {
  // Create structure with metadata and records
  const structure = {
    metadata: data.metadata,
    records: data.records,
  };

  // Return minified JSON (no whitespace)
  return JSON.stringify(structure);
}

/**
 * Convert to minified JSON (for comparison)
 * Even stricter minification
 */
export function convertToMinifiedJson(data: BaseDataSet): string {
  const structure = {
    m: data.metadata,
    r: data.records,
  };

  return JSON.stringify(structure);
}
