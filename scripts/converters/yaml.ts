/**
 * YAML format converter
 * Converts base dataset to YAML format
 */

import { BaseDataSet } from "../types";

export function convertToYaml(data: BaseDataSet): string {
  const lines: string[] = [];

  // Add products
  lines.push("products:");

  for (const record of data.records) {
    lines.push("  - product:");
    for (const [key, value] of Object.entries(record)) {
      const yamlValue = formatYamlValue(value);
      lines.push(`      ${key}: ${yamlValue}`);
    }
  }

  return lines.join("\n");
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
