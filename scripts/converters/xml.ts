/**
 * XAML format converter
 * Converts flat and nested datasets to XAML format
 */

import { FlatArrayDataSet, NestedDataSet } from "../types";

export function convertToXml(data: FlatArrayDataSet | NestedDataSet): string {
  const lines: string[] = ['<?xml version="1.0" encoding="utf-8"?>'];
  lines.push("<products>");

  for (const record of data.records) {
    lines.push(recordToXml(record, 1));
  }

  lines.push("</products>");
  return lines.join("\n");
}

/**
 * Convert a record to XAML with proper indentation
 */
function recordToXml(record: any, indent: number): string {
  const lines: string[] = [];
  const pad = "  ".repeat(indent);

  lines.push(`${pad}<product>`);

  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) {
      lines.push(`${pad}  <${key}/>`);
    } else if (isObject(value)) {
      // Nested object
      lines.push(`${pad}  <${key}>`);
      lines.push(...objectToXml(value, indent + 2));
      lines.push(`${pad}  </${key}>`);
    } else {
      const escaped = escapeXml(String(value));
      lines.push(`${pad}  <${key}>${escaped}</${key}>`);
    }
  }

  lines.push(`${pad}</product>`);
  return lines.join("\n");
}

/**
 * Convert a nested object to XAML
 */
function objectToXml(obj: any, indent: number): string[] {
  const lines: string[] = [];
  const pad = "  ".repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      lines.push(`${pad}<${key}/>`);
    } else if (isObject(value)) {
      // Deeply nested object
      lines.push(`${pad}<${key}>`);
      lines.push(...objectToXml(value, indent + 1));
      lines.push(`${pad}</${key}>`);
    } else {
      const escaped = escapeXml(String(value));
      lines.push(`${pad}<${key}>${escaped}</${key}>`);
    }
  }

  return lines;
}

/**
 * Check if value is an object (not array, not null)
 */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
