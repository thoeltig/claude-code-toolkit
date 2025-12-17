/**
 * Metrics Extraction Module
 * Extracts read and reasoning metrics from agent transcripts
 * Combines both into a single metrics.json file
 */

import * as fs from "fs";
import * as path from "path";
import { UserMetrics } from "./types";

interface AgentIdEntry {
  format: string;
  variant: string;
  recordCount: number;
  agentId: string;
  timestamp: string;
}

interface ReadOnlyAgentIdEntry extends AgentIdEntry {
  testRun?: never;
}

interface FullTestAgentIdEntry extends AgentIdEntry {
  testRun: number;
}

interface AgentIdsFile {
  testConfiguration: {
    formats: string[];
    variants: string[];
    model: string;
    thinking: string;
    timestamp: string;
  };
  readOnlyTests: ReadOnlyAgentIdEntry[];
  fullTests: FullTestAgentIdEntry[];
}

interface ReadMetricsFile {
  file: string;
  path: string;
  agentId: string;
  format: string;
  variant: string;
  recordCount: number;
  readTokens: number;
  readDurationMs: number;
}

interface ReasoningMetricsFile {
  format: string;
  variant: string;
  recordCount: number;
  testRuns: number;
  durationMs: number;
  reasoningTokens: number;
  outputTokens: number;
}

interface CombinedMetrics {
  read: {
    files: ReadMetricsFile[];
    summary: {
      totalFiles: number;
      totalReadTokens: number;
      totalReadDurationMs: number;
      averageReadTokens: number;
      averageDurationMs: number;
    };
  };
  reasoning: {
    files: ReasoningMetricsFile[];
    summary: {
      totalTestCases: number;
      totalDurationMs: number;
      totalReasoningTokens: number;
      totalOutputTokens: number;
      averageDurationMs: number;
      averageReasoningTokens: number;
      averageOutputTokens: number;
    };
  };
}

class MetricsExtraction {
  private agentIdsFile: string;
  private projectsDir: string;
  private outputFile: string;

  constructor(agentIdsFile: string, outputFile: string, projectsDir?: string) {
    this.agentIdsFile = agentIdsFile;
    this.outputFile = outputFile;
    this.projectsDir = projectsDir || path.join(process.env.HOME || process.env.USERPROFILE || "~", ".claude", "projects");
  }

  public extract(): UserMetrics[] {
    console.log("Loading agent IDs from file...");
    const agentIds = this.loadAgentIds();

    console.log("Finding transcript files...");
    const readTranscripts = this.findTranscriptFiles(agentIds.readOnlyTests.map(t => t.agentId));
    const fullTranscripts = this.findTranscriptFiles(agentIds.fullTests.map(t => t.agentId));

    console.log("Extracting read metrics...");
    const readMetrics = this.extractReadMetrics(readTranscripts, agentIds.readOnlyTests);

    console.log("Extracting reasoning metrics...");
    const reasoningMetrics = this.extractReasoningMetrics(fullTranscripts, agentIds.fullTests);

    console.log("Combining metrics...");
    const combined = this.combineMetrics(readMetrics, reasoningMetrics);

    console.log(`Writing results to ${this.outputFile}...`);
    this.writeOutput(combined);

    console.log("✓ Metrics extraction complete");

    return this.mergeCombinedMetrics(combined);
  }

  private loadAgentIds(): AgentIdsFile {
    try {
      const content = fs.readFileSync(this.agentIdsFile, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      throw new Error(`Failed to load agent IDs from ${this.agentIdsFile}: ${err}`);
    }
  }

  private findTranscriptFiles(agentIds: string[]): Map<string, string> {
    const found = new Map<string, string>();

    for (const agentId of agentIds) {
      const filename = `agent-${agentId}.jsonl`;
      const match = this.findFileRecursive(this.projectsDir, filename);

      if (match) {
        found.set(agentId, match);
      } else {
        console.warn(`Warning: No transcript found for agent ID: ${agentId}`);
      }
    }

    return found;
  }

  private findFileRecursive(dir: string, filename: string): string | null {
    if (!fs.existsSync(dir)) {
      return null;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isFile() && entry.name === filename) {
          return fullPath;
        }

        if (entry.isDirectory()) {
          const result = this.findFileRecursive(fullPath, filename);
          if (result) {
            return result;
          }
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }

    return null;
  }

  private extractReadMetrics(transcripts: Map<string, string>, agentIdEntries: ReadOnlyAgentIdEntry[]): ReadMetricsFile[] {
    const results: ReadMetricsFile[] = [];

    for (const entry of agentIdEntries) {
      const transcript = transcripts.get(entry.agentId);
      if (!transcript) {
        console.warn(`No transcript found for read-only agent: ${entry.agentId}`);
        continue;
      }

      const metricsFromTranscript = this.extractFileTokensFromTranscript(transcript, entry.agentId);

      for (const metric of metricsFromTranscript) {
        results.push({
          file: metric.file,
          path: metric.path,
          agentId: metric.agentId,
          format: entry.format,
          variant: entry.variant,
          recordCount: entry.recordCount,
          readTokens: metric.tokens,
          readDurationMs: metric.time_ms || 0,
        });
      }
    }

    return results;
  }

  private extractFileTokensFromTranscript(jsonlPath: string, agentId: string): Array<{
    file: string;
    path: string;
    tokens: number;
    time_ms: number | null;
    agentId: string;
  }> {
    const results: Array<{
      file: string;
      path: string;
      tokens: number;
      time_ms: number | null;
      agentId: string;
    }> = [];

    try {
      const lines = fs.readFileSync(jsonlPath, "utf-8").split("\n");

      // First pass: find all tool_use Read operations with their timestamps
      const toolUses: Map<string, { file_path: string; tool_use_timestamp: string }> = new Map();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.type === "assistant") {
            const msg = data.message || {};
            const content = msg.content || [];

            if (Array.isArray(content)) {
              for (const item of content) {
                if (item && item.name === "Read") {
                  const file_path = item.input?.file_path || "";
                  if (file_path) {
                    const tool_use_id = item.id || "";
                    toolUses.set(tool_use_id, {
                      file_path,
                      tool_use_timestamp: data.timestamp || "",
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }

      // Second pass: find toolUseResult entries and match with tool_uses
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);
          const tool_use_result = data.toolUseResult || {};

          if (tool_use_result && tool_use_result.file) {
            const file_info = tool_use_result.file;
            const file_path = file_info.filePath || "";

            const msg = data.message || {};
            if (msg && msg.content) {
              const content = msg.content;
              if (Array.isArray(content)) {
                for (const item of content) {
                  if (item && item.type === "tool_result") {
                    const tool_use_id = item.tool_use_id || "";

                    if (toolUses.has(tool_use_id) && file_path) {
                      const result_timestamp = data.timestamp || "";
                      const { file_path: stored_path, tool_use_timestamp } = toolUses.get(tool_use_id)!;

                      // Get next message for token counts
                      if (i + 1 < lines.length) {
                        try {
                          const next_data = JSON.parse(lines[i + 1]);
                          const next_msg = next_data.message || {};

                          if (next_msg && next_msg.usage) {
                            const usage = next_msg.usage;
                            const cache_creation = usage.cache_creation_input_tokens || 0;

                            // Calculate time difference
                            let time_ms: number | null = null;
                            if (tool_use_timestamp && result_timestamp) {
                              try {
                                const tool_use_dt = new Date(tool_use_timestamp);
                                const result_dt = new Date(result_timestamp);
                                time_ms = result_dt.getTime() - tool_use_dt.getTime();
                              } catch (e) {
                                // Skip time calculation if parsing fails
                              }
                            }

                            const file_name = path.basename(file_path);
                            results.push({
                              file: file_name,
                              path: file_path,
                              tokens: cache_creation,
                              time_ms,
                              agentId,
                            });
                          }
                        } catch (e) {
                          // Skip if next line is invalid
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    } catch (err) {
      console.warn(`Error reading transcript ${jsonlPath}: ${err}`);
    }

    return results;
  }

  private extractReasoningMetrics(transcripts: Map<string, string>, agentIdEntries: FullTestAgentIdEntry[]): Map<string, ReasoningMetricsFile[]> {
    const resultsMap = new Map<string, ReasoningMetricsFile[]>();

    for (const entry of agentIdEntries) {
      const transcript = transcripts.get(entry.agentId);
      if (!transcript) {
        console.warn(`No transcript found for full-test agent: ${entry.agentId}`);
        continue;
      }

      const metrics = this.extractFullTestMetrics(transcript);

      if (metrics) {
        const key = `${entry.format}_${entry.variant}_${entry.recordCount}`;

        if (!resultsMap.has(key)) {
          resultsMap.set(key, []);
        }

        resultsMap.get(key)!.push({
          format: entry.format,
          variant: entry.variant,
          recordCount: entry.recordCount,
          testRuns: 0, // Will be set during aggregation
          durationMs: metrics.duration_ms || 0,
          reasoningTokens: metrics.input_tokens,
          outputTokens: metrics.output_tokens,
        });
      }
    }

    return resultsMap;
  }

  private extractFullTestMetrics(jsonlPath: string): {
    duration_ms: number | null;
    input_tokens: number;
    output_tokens: number;
  } | null {
    try {
      const lines = fs.readFileSync(jsonlPath, "utf-8").split("\n");

      // Find the first Write tool_use to know when to stop tracking
      let first_write_timestamp: string | null = null;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          const msg = data.message || {};

          if (msg && msg.content) {
            const content = msg.content;
            if (Array.isArray(content)) {
              for (const item of content) {
                if (item && item.type === "tool_use" && item.name === "Write") {
                  first_write_timestamp = data.timestamp;
                  break;
                }
              }
            }
          }

          if (first_write_timestamp) break;
        } catch (e) {
          // Skip invalid JSON lines
        }
      }

      // Second pass: accumulate metrics only until first Write tool call
      let first_timestamp: string | null = null;
      let last_timestamp: string | null = null;
      let total_input_tokens = 0;
      let total_output_tokens = 0;

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);
          const timestamp = data.timestamp;

          // Stop processing once we hit the first Write tool call
          if (first_write_timestamp && timestamp === first_write_timestamp) {
            last_timestamp = timestamp;
            break;
          }

          if (timestamp) {
            if (!first_timestamp) {
              first_timestamp = timestamp;
            }
            last_timestamp = timestamp;
          }

          // Extract usage information from assistant messages (before Write)
          const msg = data.message || {};
          if (msg && msg.usage) {
            const usage = msg.usage;
            total_input_tokens += usage.input_tokens || 0;
            total_output_tokens += usage.output_tokens || 0;
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }

      // Calculate total duration
      let duration_ms: number | null = null;
      if (first_timestamp && last_timestamp) {
        try {
          const start_dt = new Date(first_timestamp);
          const end_dt = new Date(last_timestamp);
          duration_ms = end_dt.getTime() - start_dt.getTime();
        } catch (e) {
          // Skip time calculation if parsing fails
        }
      }

      if (first_timestamp) {
        return {
          duration_ms,
          input_tokens: total_input_tokens,
          output_tokens: total_output_tokens,
        };
      }
    } catch (err) {
      console.warn(`Error reading transcript ${jsonlPath}: ${err}`);
    }

    return null;
  }

  private combineMetrics(readMetrics: ReadMetricsFile[], reasoningMetricsMap: Map<string, ReasoningMetricsFile[]>): CombinedMetrics {
    // Aggregate reasoning metrics by grouping test runs
    const reasoningFiles: ReasoningMetricsFile[] = [];

    for (const [key, metrics] of reasoningMetricsMap) {
      if (metrics.length > 0) {
        const avg_duration = metrics.reduce((sum, m) => sum + m.durationMs, 0) / metrics.length;
        const avg_reasoning = metrics.reduce((sum, m) => sum + m.reasoningTokens, 0) / metrics.length;
        const avg_output = metrics.reduce((sum, m) => sum + m.outputTokens, 0) / metrics.length;

        reasoningFiles.push({
          format: metrics[0].format,
          variant: metrics[0].variant,
          recordCount: metrics[0].recordCount,
          testRuns: metrics.length,
          durationMs: parseFloat(avg_duration.toFixed(3)),
          reasoningTokens: parseFloat(avg_reasoning.toFixed(3)),
          outputTokens: parseFloat(avg_output.toFixed(3)),
        });
      }
    }

    // Calculate summaries
    const total_read_tokens = readMetrics.reduce((sum, m) => sum + m.readTokens, 0);
    const total_read_duration = readMetrics.reduce((sum, m) => sum + m.readDurationMs, 0);

    const total_duration = reasoningFiles.reduce((sum, m) => sum + m.durationMs, 0);
    const total_reasoning = reasoningFiles.reduce((sum, m) => sum + m.reasoningTokens, 0);
    const total_output = reasoningFiles.reduce((sum, m) => sum + m.outputTokens, 0);

    return {
      read: {
        files: readMetrics,
        summary: {
          totalFiles: readMetrics.length,
          totalReadTokens: total_read_tokens,
          totalReadDurationMs: parseFloat(total_read_duration.toFixed(1)),
          averageReadTokens: readMetrics.length > 0 ? parseFloat((total_read_tokens / readMetrics.length).toFixed(0)) : 0,
          averageDurationMs: readMetrics.length > 0 ? parseFloat((total_read_duration / readMetrics.length).toFixed(1)) : 0,
        },
      },
      reasoning: {
        files: reasoningFiles,
        summary: {
          totalTestCases: reasoningFiles.length,
          totalDurationMs: parseFloat(total_duration.toFixed(3)),
          totalReasoningTokens: parseFloat(total_reasoning.toFixed(3)),
          totalOutputTokens: parseFloat(total_output.toFixed(3)),
          averageDurationMs: reasoningFiles.length > 0 ? parseFloat((total_duration / reasoningFiles.length).toFixed(3)) : 0,
          averageReasoningTokens: reasoningFiles.length > 0 ? parseFloat((total_reasoning / reasoningFiles.length).toFixed(3)) : 0,
          averageOutputTokens: reasoningFiles.length > 0 ? parseFloat((total_output / reasoningFiles.length).toFixed(3)) : 0,
        },
      },
    };
  }

  private writeOutput(metrics: CombinedMetrics): void {
    const dir = path.dirname(this.outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.outputFile, JSON.stringify(metrics));
  }

  private mergeCombinedMetrics(combinedMetrics: CombinedMetrics): UserMetrics[] {
    const merged: UserMetrics[] = [];

    // Group read metrics by format+variant+recordCount
    const readMap = new Map<string, ReadMetricsFile>();
    for (const read of combinedMetrics.read.files) {
      const key = `${read.format}_${read.variant}_${read.recordCount}`;
      readMap.set(key, read);
    }

    // Merge with reasoning metrics
    for (const reasoning of combinedMetrics.reasoning.files) {
      const key = `${reasoning.format}_${reasoning.variant}_${reasoning.recordCount}`;
      const readData = readMap.get(key);

      if (!readData) {
        throw new Error(`No read data found for ${key}. Ensure both read and reasoning metrics cover the same test cases.`);
      }

      merged.push({
        testCase: `${reasoning.format}_${reasoning.recordCount}_${reasoning.variant}`,
        format: reasoning.format,
        variant: reasoning.variant,
        recordCount: reasoning.recordCount,
        hasOptionalData: reasoning.variant !== "mandatory",
        readDuration: readData.readDurationMs,
        readTokens: readData.readTokens,
        testDuration: reasoning.durationMs,
        reasoningTokens: reasoning.reasoningTokens,
      });
    }

    return merged;
  }  
}

export default MetricsExtraction;
