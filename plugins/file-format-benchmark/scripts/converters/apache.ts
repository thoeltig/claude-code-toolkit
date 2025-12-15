/**
 * Apache log format converter
 * Converts base dataset to Apache Combined Log Format
 */

import { BaseDataSet, DataRecord } from "../types";

export function convertToApacheLogs(data: BaseDataSet): string {
  const lines: string[] = [];

  for (const record of data.records) {
    const logLine = generateApacheLogLine(record);
    lines.push(logLine);
  }

  return lines.join("\n");
}

/**
 * Generate single Apache Combined Log Format line from record
 * Format: ip - user [timestamp] "method path protocol" status bytes "referer" "useragent"
 */
function generateApacheLogLine(record: DataRecord): string {
  const ip = record.supplierLocation ? hashToIp(String(record.supplierLocation)) : "192.168.1.1";
  const user = record.productName ? String(record.productName).substring(0, 10) : "-";
  const timestamp = formatApacheTimestamp(String(record.lastRestocked || new Date().toISOString()));
  const method = getHttpMethod(String(record.category || "GET"));
  const path = `/api/products/${record.productId}`;
  const protocol = "HTTP/1.1";
  const status = getHttpStatus(Number(record.stockQuantity) || undefined);
  const bytes = Math.round((Number(record.weight) || 0) * 1024);
  const referer = `https://example.com/category/${record.category}`;
  const userAgent = "Mozilla/5.0 (Benchmarking Framework)";

  return `${ip} - ${user} [${timestamp}] "${method} ${path} ${protocol}" ${status} ${bytes} "${referer}" "${userAgent}"`;
}

/**
 * Convert IP address string to hash-based deterministic IP
 */
function hashToIp(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash = hash & hash; // Keep 32-bit
  }

  const octets = [
    Math.abs(hash % 256),
    Math.abs((Math.floor(hash / 256) % 256)),
    Math.abs((Math.floor(hash / 65536) % 256)),
    Math.abs((Math.floor(hash / 16777216) % 256)),
  ];

  return octets.join(".");
}

/**
 * Format timestamp in Apache Combined Log Format
 * Example: 09/Sep/2024:12:34:56 +0000
 */
function formatApacheTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year}:${hours}:${minutes}:${seconds} +0000`;
}

/**
 * Determine HTTP method based on category
 */
function getHttpMethod(category: string): string {
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash += category.charCodeAt(i);
  }
  return methods[hash % methods.length];
}

/**
 * Determine HTTP status based on stock quantity
 */
function getHttpStatus(quantity: number | undefined): number {
  const qty = quantity || 0;
  if (qty > 1000) return 200;
  if (qty > 100) return 200;
  if (qty > 10) return 202;
  if (qty > 0) return 206;
  return 404;
}
