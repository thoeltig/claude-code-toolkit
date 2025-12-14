/**
 * Markdown format converter
 * Converts base dataset to markdown tables and sections
 */

import { BaseDataSet, DataRecord } from "../types";

export function convertToMarkdown(data: BaseDataSet): string {
  const lines: string[] = [];

  // Group records by category
  const byCategory = new Map<string, DataRecord[]>();
  for (const record of data.records) {
    const category = String(record.category || "Uncategorized");
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(record);
  }

  // Create sections for each category
  for (const [category, records] of byCategory) {
    lines.push(`## ${category}`);
    lines.push("");

    // Create table for category
    lines.push(createMarkdownTable(records));
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Create markdown table from records
 */
function createMarkdownTable(records: DataRecord[]): string {
  if (records.length === 0) {
    return "";
  }

  // Get field names from first record
  const fields = Object.keys(records[0]).filter((f) => records[0][f] !== null && records[0][f] !== undefined);

  // Limit to ~10 columns for readability
  const displayFields = fields.slice(0, 10);

  // Create header
  const headerLine = `| ${displayFields.join(" | ")} |`;
  const separatorLine = `| ${displayFields.map(() => "---").join(" | ")} |`;

  const lines = [headerLine, separatorLine];

  // Create rows
  for (const record of records.slice(0, 100)) {
    // Limit to 100 rows per table
    const values = displayFields.map((field) => {
      const value = record[field];
      if (value === null || value === undefined) {
        return "-";
      }
      const str = String(value);
      return str.length > 30 ? str.substring(0, 27) + "..." : str;
    });
    lines.push(`| ${values.join(" | ")} |`);
  }

  if (records.length > 100) {
    lines.push(`| ... ${records.length - 100} more rows ... |`);
  }

  return lines.join("\n");
}
