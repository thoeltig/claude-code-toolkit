/**
 * Benchmarking Analytics Script
 * Calculates token efficiency and accuracy metrics from test results
 */

import * as fs from "fs";
import * as path from "path";

interface UserMetrics {
  testCase: string;
  readDuration: number;
  readTokens: number;
  fullDuration: number;
  fullTokens: number;
}

interface ValidationResult {
  format: string;
  density: number;
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
  density: number;
  recordCount: number;
  characterCount: number;
  totalValues: number;
  totalQuestions: number;

  // User-provided
  readDuration: number;
  readTokens: number;
  fullDuration: number;
  fullTokens: number;

  // Validation data
  correctAnswers: number;
  accuracyPercent: number;

  // Calculated metrics
  charsPerToken: number;
  tokensPerValue: number;
  reasoningTokens: number;
  tokensPerQuestion: number;
  correctnessRatio: number;
  efficiency: number;
}

interface AnalyticsOutput {
  timestamp: string;
  testConfigurations: {
    metricsFile: string;
    model: string;
    thinking: string;
    formats: string[];
    densities: number[];
  };
  metrics: TestMetrics[];
  rankings: {
    mostTokenEfficient: { format: string; density: number; charsPerToken: number };
    mostAccurate: { format: string; density: number; accuracyPercent: number };
    bestOverall: { format: string; density: number; efficiency: number };
    byFormat: Record<string, { avgCharsPerToken: number; avgAccuracy: number }>;
  };
  insights: string[];
}

class BenchmarkAnalytics {
  private metricsFile: string;
  private metadataFile: string;
  private validationDir: string;
  private outputFile: string;

  constructor(metricsFile: string, metadataFile: string, validationDir: string, outputFile: string) {
    this.metricsFile = metricsFile;
    this.metadataFile = metadataFile;
    this.validationDir = validationDir;
    this.outputFile = outputFile;
  }

  public analyze(): void {
    console.log("Loading metrics...");
    const userMetrics = this.loadUserMetrics();

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

  private loadUserMetrics(): UserMetrics[] {
    const content = fs.readFileSync(this.metricsFile, "utf-8");
    try {
      return JSON.parse(content);
    } catch (err) {
      throw new Error(`Failed to parse metrics JSON: ${err}`);
    }
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

  private calculateMetrics(
    userMetrics: UserMetrics[],
    metadata: any,
    validationResults: Map<string, ValidationResult>
  ): TestMetrics[] {
    const metrics: TestMetrics[] = [];

    // Build lookup map from metadata
    const datasetMap = new Map<string, any>();
    if (metadata.files) {
      for (const file of metadata.files) {
        for (const [format, dataAndOutput] of file.dataAndOutput) {
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
      const density = parseInt(match[2]);
      const datasetKey = `${format}_${density}`;

      const datasetInfo = datasetMap.get(datasetKey);
      if (!datasetInfo) {
        console.warn(`Dataset info not found for: ${datasetKey}`);
        continue;
      }

      const validationKey = `${format}_${density}`;
      const validation = validationResults.get(validationKey);

      const reasoningTokens = userMetric.fullTokens - userMetric.readTokens;
      const charsPerToken = datasetInfo.characterCount / userMetric.readTokens;
      const tokensPerValue = userMetric.readTokens / datasetInfo.totalValues;
      const tokensPerQuestion = reasoningTokens / datasetInfo.questionCount;

      const correctAnswers = validation?.accuracy?.correct ?? 0;
      const correctnessRatio = validation ? correctAnswers / validation.totalQuestions : 0;
      const accuracy = validation?.accuracy?.accuracyPercent ?? 0;

      const efficiency = reasoningTokens > 0
        ? (correctnessRatio / reasoningTokens) * 1000
        : 0;

      metrics.push({
        testCase: userMetric.testCase,
        format,
        density,
        recordCount: density, // Assuming density is record count
        characterCount: datasetInfo.characterCount,
        totalValues: datasetInfo.totalValues,
        totalQuestions: datasetInfo.questionCount,

        readDuration: userMetric.readDuration,
        readTokens: userMetric.readTokens,
        fullDuration: userMetric.fullDuration,
        fullTokens: userMetric.fullTokens,

        correctAnswers,
        accuracyPercent: accuracy,

        charsPerToken,
        tokensPerValue,
        reasoningTokens,
        tokensPerQuestion,
        correctnessRatio,
        efficiency,
      });
    }

    return metrics;
  }

  private generateAnalytics(metrics: TestMetrics[]): AnalyticsOutput {
    if (metrics.length === 0) {
      throw new Error("No metrics to analyze");
    }

    // Extract model and thinking from metrics filename
    const filename = path.basename(this.metricsFile);
    const metricsMatch = filename.match(/metrics_([a-z]+)_([a-z]+)/);
    const model = metricsMatch ? metricsMatch[1] : "unknown";
    const thinking = metricsMatch ? metricsMatch[2] : "unknown";

    // Get unique formats and densities
    const formats = [...new Set(metrics.map((m) => m.format))];
    const densities = [...new Set(metrics.map((m) => m.density))].sort((a, b) => b - a);

    // Find rankings
    const mostTokenEfficient = metrics.reduce((best, current) =>
      current.charsPerToken > best.charsPerToken ? current : best
    );

    const mostAccurate = metrics.reduce((best, current) =>
      current.accuracyPercent > best.accuracyPercent ? current : best
    );

    const bestOverall = metrics.reduce((best, current) =>
      current.efficiency > best.efficiency ? current : best
    );

    // Calculate format-level statistics
    const byFormat: Record<string, { avgCharsPerToken: number; avgAccuracy: number }> = {};
    for (const format of formats) {
      const formatMetrics = metrics.filter((m) => m.format === format);
      const avgCharsPerToken = formatMetrics.reduce((sum, m) => sum + m.charsPerToken, 0) / formatMetrics.length;
      const avgAccuracy = formatMetrics.reduce((sum, m) => sum + m.accuracyPercent, 0) / formatMetrics.length;
      byFormat[format] = { avgCharsPerToken, avgAccuracy };
    }

    // Generate insights
    const insights = this.generateInsights(metrics, byFormat);

    return {
      timestamp: new Date().toISOString(),
      testConfigurations: {
        metricsFile: this.metricsFile,
        model,
        thinking,
        formats,
        densities,
      },
      metrics,
      rankings: {
        mostTokenEfficient: {
          format: mostTokenEfficient.format,
          density: mostTokenEfficient.density,
          charsPerToken: parseFloat(mostTokenEfficient.charsPerToken.toFixed(2)),
        },
        mostAccurate: {
          format: mostAccurate.format,
          density: mostAccurate.density,
          accuracyPercent: mostAccurate.accuracyPercent,
        },
        bestOverall: {
          format: bestOverall.format,
          density: bestOverall.density,
          efficiency: parseFloat(bestOverall.efficiency.toFixed(3)),
        },
        byFormat,
      },
      insights,
    };
  }

  private generateInsights(metrics: TestMetrics[], byFormat: Record<string, any>): string[] {
    const insights: string[] = [];

    // Token efficiency insights
    let bestFormatEntry: [string, any] | null = null;
    for (const [format, stats] of Object.entries(byFormat)) {
      if (!bestFormatEntry || stats.avgCharsPerToken > bestFormatEntry[1].avgCharsPerToken) {
        bestFormatEntry = [format, stats];
      }
    }
    if (bestFormatEntry) {
      insights.push(
        `Format efficiency: ${bestFormatEntry[0]} most token-efficient (${bestFormatEntry[1].avgCharsPerToken.toFixed(1)} chars/token)`
      );
    }

    // Accuracy insights
    let bestAccuracyEntry: [string, any] | null = null;
    for (const [format, stats] of Object.entries(byFormat)) {
      if (!bestAccuracyEntry || stats.avgAccuracy > bestAccuracyEntry[1].avgAccuracy) {
        bestAccuracyEntry = [format, stats];
      }
    }
    if (bestAccuracyEntry) {
      insights.push(
        `Accuracy: ${bestAccuracyEntry[0]} highest average accuracy (${bestAccuracyEntry[1].avgAccuracy.toFixed(1)}%)`
      );
    }

    // Density impact
    const densities = [...new Set(metrics.map((m) => m.density))].sort((a, b) => b - a);
    if (densities.length > 1) {
      const maxDensity = densities[0];
      const minDensity = densities[densities.length - 1];

      const maxDensityMetrics = metrics.filter((m) => m.density === maxDensity);
      const minDensityMetrics = metrics.filter((m) => m.density === minDensity);

      const maxAvgTokens = maxDensityMetrics.reduce((sum, m) => sum + m.readTokens, 0) / maxDensityMetrics.length;
      const minAvgTokens = minDensityMetrics.reduce((sum, m) => sum + m.readTokens, 0) / minDensityMetrics.length;

      const tokenReduction = ((maxAvgTokens - minAvgTokens) / maxAvgTokens * 100).toFixed(1);
      insights.push(
        `Density impact: ${minDensity}% density reduces tokens by ~${tokenReduction}% vs ${maxDensity}%`
      );
    }

    // Average reasoning cost
    const avgReasoningTokens = metrics.reduce((sum, m) => sum + m.reasoningTokens, 0) / metrics.length;
    const avgQuestions = metrics.reduce((sum, m) => sum + m.totalQuestions, 0) / metrics.length;
    const avgTokensPerQ = (avgReasoningTokens / avgQuestions).toFixed(1);
    insights.push(`Answer reasoning: ~${avgTokensPerQ} tokens per question`);

    // Trade-off analysis
    const highAccuracy = metrics.filter((m) => m.accuracyPercent >= 90);
    const tokenEfficientHighAccuracy = highAccuracy.filter((m) => m.charsPerToken > 25);
    if (tokenEfficientHighAccuracy.length > 0) {
      insights.push(
        `Sweet spot: ${tokenEfficientHighAccuracy.length} format-density combinations achieve 90%+ accuracy with high token efficiency`
      );
    }

    return insights;
  }

  private writeOutput(analytics: AnalyticsOutput): void {
    const dir = path.dirname(this.outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Round numeric values for cleaner output
    const roundedMetrics = analytics.metrics.map((m) => ({
      ...m,
      charsPerToken: parseFloat(m.charsPerToken.toFixed(2)),
      tokensPerValue: parseFloat(m.tokensPerValue.toFixed(2)),
      tokensPerQuestion: parseFloat(m.tokensPerQuestion.toFixed(2)),
      correctnessRatio: parseFloat(m.correctnessRatio.toFixed(3)),
      efficiency: parseFloat(m.efficiency.toFixed(3)),
    }));

    const output = { ...analytics, metrics: roundedMetrics };
    fs.writeFileSync(this.outputFile, JSON.stringify(output));
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  let metricsFile: string | undefined;
  let metadataFile: string | undefined;
  let validationDir: string | undefined;
  let outputFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--metrics":
        metricsFile = args[++i];
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

  if (!metricsFile || !metadataFile || !validationDir || !outputFile) {
    console.error("Usage: ts-node analytics.ts --metrics <file> --metadata <file> --validation-dir <dir> --output <file>");
    process.exit(1);
  }

  try {
    const analytics = new BenchmarkAnalytics(metricsFile, metadataFile, validationDir, outputFile);
    analytics.analyze();
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }
}

export default BenchmarkAnalytics;
