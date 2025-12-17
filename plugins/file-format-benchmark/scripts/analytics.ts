/**
 * Benchmarking Analytics Script
 * Calculates token efficiency and accuracy metrics from test results
 */

import * as fs from "fs";
import * as path from "path";

interface UserMetrics {
  testCase: string;
  format: string;
  variant: string;
  recordCount: number;
  hasOptionalData: boolean;
  readDuration: number;
  readTokens: number;
  testDuration: number;
  reasoningTokens: number;
}

interface ReadMetricsFile {
  file: string;
  path: string;
  agentId: string;
  fileType: string;
  format: string;
  variant: string;
  recordCount: number;
  readTokens: number;
  readDurationMs: number;
}

interface ReasoningMetricsFile {
  agentId: string;
  format: string;
  variant: string;
  recordCount: number;
  durationMs: number;
  reasoningTokens: number;
  outputTokens: number;
}

interface ValidationResult {
  format: string;
  recordCount: number;
  totalQuestions: number;
  accuracy: {
    correct: number;
    incorrect: number;
    requiresReview: number;
    accuracyPercent: number;
  };
}

interface TestMetrics {
  testCase: string;
  format: string;
  variant: string;
  hasOptionalData: boolean;
  recordCount: number;
  totalValues: number;
  characterCount: number;

  // Read-Only extraction script result
  readDuration: number;
  readTokens: number;
  
  // Full test extraction script result
  avgTestDuration: number;
  avgReasoningTokens: number;

  // Validation script result
  totalQuestions: number;
  avgNoAnswers: number;
  avgIncorrectAnswers: number;
  avgCorrectAnswers: number;
  avgAccuracyPercent: number;

  // Calculated metrics
  charsPerToken: number;
  tokensPerValue: number;
  tokensPerRecord: number;
  avgReasoningTokensPerAnswer: number;

  // Result
  totalTokens: number;
  correctnessRatio: number;
  efficientlyUsedTokens: number;
  // Efficiency score = (Accuracy percentage ÷ total tokens) × 1000. Higher is better.
  efficiencyScore: number;
}

interface AnalyticsOutput {
  timestamp: string;
  testConfigurations: {
    readMetricsFile: string;
    reasoningMetricsFile: string;
    model: string;
    thinking: string;
    formats: string[];
    variants: string[];
    recordCounts: number[];
  };
  metrics: TestMetrics[];
  rankings: {
    mostTokenEfficient: { format: string; hasOptionalData: boolean; recordCount: number; charsPerToken: number };
    mostAccurate: { format: string; hasOptionalData: boolean; recordCount: number; accuracyPercent: number };
    bestOverall: { format: string; hasOptionalData: boolean; recordCount: number; efficiencyScore: number };
    byRecordCount: Record<number, { avgCharsPerToken: number; avgAccuracy: number }>;
  };
  insights: string[];
}

class BenchmarkAnalytics {
  private metadataFile: string;
  private validationDir: string;
  private outputFile: string;
  private readMetricsFile: string;
  private reasoningMetricsFile: string;

  constructor(readMetricsFile: string, reasoningMetricsFile: string, metadataFile: string, validationDir: string, outputFile: string) {
    this.readMetricsFile = readMetricsFile;
    this.reasoningMetricsFile = reasoningMetricsFile;
    this.metadataFile = metadataFile;
    this.validationDir = validationDir;
    this.outputFile = outputFile;
  }

  public analyze(): void {
    console.log("Loading read metrics...");
    const readMetrics = this.loadReadMetrics();

    console.log("Loading reasoning metrics...");
    const reasoningMetrics = this.loadReasoningMetrics();

    console.log("Merging metrics...");
    const userMetrics = this.mergeMetrics(readMetrics, reasoningMetrics);

    console.log("Loading metadata...");
    const metadata = this.loadMetadata();

    console.log("Loading validation results...");
    const validationResults = this.loadValidationResults();

    console.log("Calculating metrics...");
    const testMetrics = this.calculateMetrics(userMetrics, metadata, validationResults);

    console.log("Generating insights...");
    const analytics = this.generateAnalytics(testMetrics);

    console.log(`Writing results to ${this.outputFile}...`);
    this.writeOutput(analytics);

    console.log("✓ Analytics complete");
    console.log(`\nResults saved to: ${this.outputFile}`);
  }


  private loadMetadata(): any {
    const content = fs.readFileSync(this.metadataFile, "utf-8");
    return JSON.parse(content);
  }

  private loadValidationResults(): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    if (!fs.existsSync(this.validationDir)) {
      console.warn(`Validation directory not found: ${this.validationDir}`);
      return results;
    }

    const files = fs.readdirSync(this.validationDir);
    for (const file of files) {
      if (file.endsWith("_validation.json")) {
        const filePath = path.join(this.validationDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const result = JSON.parse(content);

        const key = `${result.format}_${result.recordCount}`;
        results.set(key, result);
      }
    }

    return results;
  }

  private loadReadMetrics(): ReadMetricsFile[] {
    const content = fs.readFileSync(this.readMetricsFile, "utf-8");
    try {
      const data = JSON.parse(content);
      return data.files || data || [];
    } catch (err) {
      throw new Error(`Failed to parse read metrics from ${this.readMetricsFile}: ${err}`);
    }
  }

  private loadReasoningMetrics(): ReasoningMetricsFile[] {
    const content = fs.readFileSync(this.reasoningMetricsFile, "utf-8");
    try {
      const data = JSON.parse(content);
      return data.files || data || [];
    } catch (err) {
      throw new Error(`Failed to parse reasoning metrics from ${this.reasoningMetricsFile}: ${err}`);
    }
  }

  private mergeMetrics(readMetrics: ReadMetricsFile[], reasoningMetrics: ReasoningMetricsFile[]): UserMetrics[] {
    const merged: UserMetrics[] = [];

    // Group read metrics by format+variant+recordCount
    const readMap = new Map<string, ReadMetricsFile>();
    for (const read of readMetrics) {
      if (read.fileType === "data") {
        const key = `${read.format}_${read.variant}_${read.recordCount}`;
        readMap.set(key, read);
      }
    }

    // Merge with reasoning metrics
    for (const reasoning of reasoningMetrics) {
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

  private calculateMetrics(
    userMetrics: UserMetrics[],
    metadata: any,
    validationResults: Map<string, ValidationResult>
  ): TestMetrics[] {
    const metrics: TestMetrics[] = [];

    // Build lookup map from metadata
    const datasetMap = new Map<string, any>();
    const filesArray = metadata.files || metadata.filesPerRecordCount || [];

    for (const file of filesArray) {
      if (Array.isArray(file.dataAndOutput)) {
        for (const dataAndOutput of file.dataAndOutput) {
          const format = dataAndOutput.format;
          const key = `${format}_${file.recordCount}`;
          datasetMap.set(key, {
            format,
            recordCount: file.recordCount,
            totalValues: file.totalValues,
            characterCount: dataAndOutput.metadata.characterCount,
            questionCount: file.questionCount,
          });
        }
      }
    }

    // Process each test case
    for (const userMetric of userMetrics) {
      // Parse testCase to extract format and density
      const match = userMetric.testCase.match(/^([a-z_]+)_(\d+)_/);
      if (!match) {
        console.warn(`Could not parse test case: ${userMetric.testCase}`);
        continue;
      }

      const format = match[1];
      const recordCount = parseInt(match[2]);
      const datasetKey = `${format}_${recordCount}`;
      const validationKey = `${format}_${recordCount}`;

      const datasetInfo = datasetMap.get(datasetKey);
      if (!datasetInfo) {
        console.warn(`Dataset info not found for: ${datasetKey}`);
        continue;
      }

      const validation = validationResults.get(validationKey);
      if (!validation) {
        console.warn(`Validation info not found for: ${validationKey}`);
        continue;
      }

      metrics.push({
        testCase: userMetric.testCase,
        format: userMetric.format,
        variant: userMetric.variant,
        hasOptionalData: userMetric.hasOptionalData,
        recordCount: userMetric.recordCount,
        totalValues: datasetInfo.totalValues,
        characterCount: datasetInfo.characterCount,
        
        readDuration: userMetric.readDuration,
        readTokens: userMetric.readTokens,

        avgTestDuration: userMetric.testDuration,
        avgReasoningTokens: userMetric.reasoningTokens,

        totalQuestions: validation.totalQuestions,
        avgNoAnswers: validation.totalQuestions - validation.accuracy.correct - validation.accuracy.incorrect,
        avgIncorrectAnswers: validation.accuracy.incorrect,
        avgCorrectAnswers: validation.accuracy.correct,
        avgAccuracyPercent: validation.accuracy.accuracyPercent,

        charsPerToken: parseFloat((datasetInfo.characterCount / userMetric.readTokens).toFixed(3)),
        tokensPerValue: parseFloat((userMetric.readTokens / datasetInfo.totalValues).toFixed(3)),
        tokensPerRecord: parseFloat((userMetric.readTokens / datasetInfo.recordCount).toFixed(3)),
        avgReasoningTokensPerAnswer: parseFloat((userMetric.reasoningTokens / validation.totalQuestions).toFixed(3)),
        totalTokens: userMetric.readTokens + userMetric.reasoningTokens,
        correctnessRatio: validation.accuracy.correct / validation.totalQuestions,
        efficientlyUsedTokens: parseFloat(((userMetric.readTokens + userMetric.reasoningTokens)*(validation.accuracy.correct / validation.totalQuestions)).toFixed(3)),
        efficiencyScore: parseFloat((validation.accuracy.accuracyPercent / (userMetric.readTokens + userMetric.reasoningTokens)*1000).toFixed(3))
      });
    }

    return metrics;
  }

  private generateAnalytics(metrics: TestMetrics[]): AnalyticsOutput {
    if (metrics.length === 0) {
      throw new Error("No metrics to analyze");
    }

    // Extract model and thinking from metrics filename
    const filename = path.basename(this.readMetricsFile);
    const metricsMatch = filename.match(/metrics_([a-z]+)_([a-z]+)/);
    const model = metricsMatch ? metricsMatch[1] : "unknown";
    const thinking = metricsMatch ? metricsMatch[2] : "unknown";

    // Get unique formats and densities
    const formats = [...new Set(metrics.map((m) => m.format))];
    const variants = [...new Set(metrics.map((m) => m.variant))];
    const recordCounts = [...new Set(metrics.map((m) => m.recordCount))].sort((a, b) => b - a);

    // Find rankings
    const mostTokenEfficient = metrics.reduce((best, current) =>
      current.charsPerToken > best.charsPerToken ? current : best
    );

    const mostAccurate = metrics.reduce((best, current) =>
      current.avgAccuracyPercent > best.avgAccuracyPercent ? current : best
    );

    const bestOverall = metrics.reduce((best, current) =>
      current.efficiencyScore > best.efficiencyScore ? current : best
    );

    // Calculate format-level statistics
    const byRecordCount: Record<number, { avgCharsPerToken: number; avgAccuracy: number }> = {};
    for (const recordCount of recordCounts) {
      const formatMetrics = metrics.filter((m) => m.recordCount === recordCount);
      const avgCharsPerToken = Math.round(formatMetrics.reduce((sum, m) => sum + m.charsPerToken, 0) / formatMetrics.length*1000)/1000;
      const avgAccuracy = Math.round(formatMetrics.reduce((sum, m) => sum + m.avgAccuracyPercent, 0) / formatMetrics.length*1000)/1000;
      byRecordCount[recordCount] = { avgCharsPerToken, avgAccuracy };
    }

    // Generate insights
    const insights = this.generateInsights(metrics);

    return {
      timestamp: new Date().toISOString(),
      testConfigurations: {
        readMetricsFile: this.readMetricsFile,
        reasoningMetricsFile: this.reasoningMetricsFile,
        model,
        thinking,
        formats,
        variants, 
        recordCounts,
      },
      metrics,
      rankings: {
        mostTokenEfficient: {
          format: mostTokenEfficient.format,
          hasOptionalData: mostTokenEfficient.hasOptionalData,
          recordCount: mostTokenEfficient.recordCount,
          charsPerToken: mostTokenEfficient.charsPerToken,
        },
        mostAccurate: {
          format: mostAccurate.format,
          hasOptionalData: mostAccurate.hasOptionalData,
          recordCount: mostAccurate.recordCount,
          accuracyPercent: mostAccurate.avgAccuracyPercent,
        },
        bestOverall: {
          format: bestOverall.format,
          hasOptionalData: bestOverall.hasOptionalData,
          recordCount: bestOverall.recordCount,
          efficiencyScore: bestOverall.efficiencyScore
        },
        byRecordCount,
      },
      insights,
    };
  }

  private generateInsights(metrics: TestMetrics[]): string[] {
    const insights: string[] = [];

    const bestCharsPerTokenEntries = metrics.sort((a, b) => b.charsPerToken - a.charsPerToken);
    let tokenEfficiencyOutput = '';
    for (let i = 0; i < bestCharsPerTokenEntries.length && i < 4; i++) {
      const element = bestCharsPerTokenEntries[i];
      tokenEfficiencyOutput += ` ${element.format}_${element.variant}_${element.recordCount} with ${element.charsPerToken.toFixed(3)} char/token,`;
    }
    insights.push('Format token-efficiency:'+tokenEfficiencyOutput);

    const bestAccuracyEntries = metrics.sort((a, b) => b.avgAccuracyPercent - a.avgAccuracyPercent);
    let accuracyOutput = '';
    for (let i = 0; i < bestAccuracyEntries.length && i < 4; i++) {
      const element = bestAccuracyEntries[i];
      accuracyOutput += ` ${element.format}_${element.variant}_${element.recordCount} with ${element.avgAccuracyPercent.toFixed(2)}%,`;
    }
    insights.push('Average accuracy:'+accuracyOutput);

    const bestReasoningTokenEntries = metrics.sort((a, b) => b.avgReasoningTokensPerAnswer - a.avgReasoningTokensPerAnswer);
    let reasoningTokenOutput = '';
    for (let i = 0; i < bestReasoningTokenEntries.length && i < 4; i++) {
      const element = bestReasoningTokenEntries[i];
      reasoningTokenOutput += ` ${element.format}_${element.variant}_${element.recordCount} with ~${element.avgReasoningTokensPerAnswer.toFixed(2)} token/question,`;
    }
    insights.push('Tokens per question:'+reasoningTokenOutput);

    // Record count impact
    const recordCounts = [...new Set(metrics.map((m) => m.recordCount))].sort((a, b) => b - a);
    if (recordCounts.length > 1) {
      const maxRecordCounts = recordCounts[0];
      const minRecordCounts = recordCounts[recordCounts.length - 1];

      const maxRecordCountsMetrics = metrics.filter((m) => m.recordCount === maxRecordCounts);
      const minRecordCountsMetrics = metrics.filter((m) => m.recordCount === minRecordCounts);

      const maxAvgTokens = maxRecordCountsMetrics.reduce((sum, m) => sum + m.readTokens, 0) / maxRecordCountsMetrics.length;
      const minAvgTokens = minRecordCountsMetrics.reduce((sum, m) => sum + m.readTokens, 0) / minRecordCountsMetrics.length;

      const tokenReduction = ((maxAvgTokens - minAvgTokens) / maxAvgTokens * 100).toFixed(2);
      insights.push(`Record count difference: ${minRecordCounts} record count reduces tokens by ~${tokenReduction}% vs ${maxRecordCounts} record count`);
    }

    return insights;
  }

  private writeOutput(analytics: AnalyticsOutput): void {
    const dir = path.dirname(this.outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const output = { ...analytics, metrics: analytics.metrics };
    fs.writeFileSync(this.outputFile, JSON.stringify(output));
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  let readMetricsFile: string | undefined;
  let reasoningMetricsFile: string | undefined;
  let metadataFile: string | undefined;
  let validationDir: string | undefined;
  let outputFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--read-metrics":
        readMetricsFile = args[++i];
        break;
      case "--reasoning-metrics":
        reasoningMetricsFile = args[++i];
        break;
      case "--metadata":
        metadataFile = args[++i];
        break;
      case "--validation-dir":
        validationDir = args[++i];
        break;
      case "--output":
        outputFile = args[++i];
        break;
    }
  }

  if (!readMetricsFile || !reasoningMetricsFile || !metadataFile || !validationDir || !outputFile) {
    console.error("Usage: ts-node analytics.ts --read-metrics <file> --reasoning-metrics <file> --metadata <file> --validation-dir <dir> --output <file>");
    process.exit(1);
  }

  try {
    const analytics = new BenchmarkAnalytics(readMetricsFile, reasoningMetricsFile, metadataFile, validationDir, outputFile);
    analytics.analyze();
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }
}

export default BenchmarkAnalytics;
