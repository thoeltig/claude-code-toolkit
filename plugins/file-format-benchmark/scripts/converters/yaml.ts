/**
 * YAML format converter
 * Converts flat and nested datasets to YAML format
 */

import { FlatArrayDataSet, NestedDataSet } from "../types";

export function convertToYaml(data: FlatArrayDataSet | NestedDataSet): string {
  const lines: string[] = [];

  // Add products
  lines.push("products:");

  for (const record of data.records) {
    lines.push("  - product:");
    recordToYaml(record, 3, lines);
  }

  return lines.join("\n");
}

/**
 * Convert a record to YAML lines with proper indentation
 */
function recordToYaml(record: any, indent: number, lines: string[]): void {
  const pad = " ".repeat(indent);

  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) {
      lines.push(`${pad}${key}: null`);
    } else if (isObject(value)) {
      lines.push(`${pad}${key}:`);
      objectToYaml(value, indent + 2, lines);
    } else {
      const yamlValue = formatYamlValue(value);
      lines.push(`${pad}${key}: ${yamlValue}`);
    }
  }
}

/**
 * Convert a nested object to YAML lines
 */
function objectToYaml(obj: any, indent: number, lines: string[]): void {
  const pad = " ".repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      lines.push(`${pad}${key}: null`);
    } else if (isObject(value)) {
      lines.push(`${pad}${key}:`);
      objectToYaml(value, indent + 2, lines);
    } else {
      const yamlValue = formatYamlValue(value);
      lines.push(`${pad}${key}: ${yamlValue}`);
    }
  }
}

/**
 * Check if value is an object (not array, not null)
 */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Format value for YAML output
 */
function formatYamlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    // Quote strings that need it
    if (value.includes(":") || value.includes("\n") || value.includes('"') || value.includes("'")) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return JSON.stringify(value);
}
