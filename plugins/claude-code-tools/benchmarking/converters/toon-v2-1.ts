/**
 * TOON v2.1 format converter
 * Converts base dataset to TOON (Token-Oriented Object Notation) v2.1
 * Preserves nested object structure with YAML-style indentation:
 * - Nested objects as indented key-value pairs
 * - Minimal quoting
 * - Expanded form for arrays with nested objects
 */

import { BaseDataSet, DataRecord } from "../types";

export function convertToToonV21(data: BaseDataSet): string {
  if (data.records.length === 0) {
    return "";
  }

  // For v2.1, we preserve nesting, so don't flatten
  // Check if records have uniform fields at top level
  const isUniform = areRecordsUniform(data.records);

  if (isUniform) {
    return convertToToonTabular(data);
  } else {
    return convertToToonExpanded(data);
  }
}

/**
 * Check if all records have the same set of fields
 */
function areRecordsUniform(records: DataRecord[]): boolean {
  if (records.length === 0) return true;

  const firstFields = new Set(Object.keys(records[0]));

  return records.every((record) => {
    const recordFields = Object.keys(record);
    return (
      recordFields.length === firstFields.size &&
      recordFields.every((key) => firstFields.has(key))
    );
  });
}

/**
 * Convert to TOON v2.1 tabular form (compact)
 */
function convertToToonTabular(data: BaseDataSet): string {
  const fields = Object.keys(data.records[0]).sort();

  // Build header: records[N]{field1,field2,...}:
  const fieldList = fields.join(",");
  const header = `records[${data.records.length}]{${fieldList}}:`;

  const rows: string[] = [header];

  for (const record of data.records) {
    const values = fields.map((field) => formatToonValue(record[field]));
    rows.push(` ${values.join(",")}`);
  }

  return rows.join("\n");
}

/**
 * Convert to TOON v2.1 expanded form (preserves nested structure)
 * Format: records[N]: - field: value (with nested indentation)
 */
function convertToToonExpanded(data: BaseDataSet): string {
  const header = `records[${data.records.length}]:`;
  const rows: string[] = [header];

  for (const record of data.records) {
    rows.push("  -");
    const fields = Object.keys(record).sort();
    for (const field of fields) {
      const value = record[field];
      formatToonField(field, value, rows, 4);
    }
  }

  return rows.join("\n");
}

/**
 * Format a field with its value, handling nested objects with proper indentation
 * Preserves nested structure (v2.1 style)
 */
function formatToonField(
  field: string,
  value: unknown,
  rows: string[],
  indent: number
): void {
  const spaces = " ".repeat(indent);

  // Handle null/undefined - skip them
  if (value === null || value === undefined) {
    return;
  }

  // Check if value is a nested object
  if (typeof value === "object" && !Array.isArray(value)) {
    const nestedObj = value as DataRecord;
    rows.push(`${spaces}${field}:`);

    // Output nested fields with extra indentation
    const nestedFields = Object.keys(nestedObj).sort();
    for (const nestedField of nestedFields) {
      const nestedValue = nestedObj[nestedField];
      formatToonField(nestedField, nestedValue, rows, indent + 2);
    }
  } else {
    const formattedValue = formatToonValue(value);
    rows.push(`${spaces}${field}: ${formattedValue}`);
  }
}

/**
 * Format a value for TOON v2.1 output
 * Quotes only when necessary
 */
function formatToonValue(value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "null";
  }

  // Handle array - inline format
  if (Array.isArray(value)) {
    const arrayItems = value.map((item) => String(item)).join(",");
    return `[${arrayItems}]`;
  }

  // Handle boolean
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  // Handle number
  if (typeof value === "number") {
    return String(value);
  }

  // Handle string - quote if contains special chars
  const stringValue = String(value);
  if (needsQuoting(stringValue)) {
    return `"${stringValue.replace(/"/g, '\\"')}"`;
  }

  return stringValue;
}

/**
 * Determine if a string value needs quoting in TOON format
 */
function needsQuoting(value: string): boolean {
  // Quote if contains comma, newline, quote, colon, or leading/trailing spaces
  return (
    value.includes(",") ||
    value.includes("\n") ||
    value.includes('"') ||
    value.includes(":") ||
    value.startsWith(" ") ||
    value.endsWith(" ")
  );
}
