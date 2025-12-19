/**
 * Benchmarking Analytics Script
 * Calculates token efficiency and accuracy metrics from test results
 */

import * as fs from "fs";
import * as path from "path";
import MetricsExtraction from "./analytics/metrics-extraction";
import { MergedValidationReport, QuestionCategory, UserMetrics } from "./types";
import ReportValidator from "./validators/reportValidator";
import { DIRECTORY_ANSWERS_VALIDATION, FILE_ANALYTICS_RESULT, FILE_METADATA, FILE_METRICS, QUESTIONS_DISTRIBUTION, QUESTIONS_WEIGHT_DISTRIBUTION } from "./consts";

interface TestMetrics {
  testCase: string;
  format: string;
  variant: string;
  hasOptionalData: boolean;
  recordCount: number;
  totalValues: number;
  characterCount: number;

  // Read-Only extraction script result
  readTokens: number;
  readDurationInMilliseconds: number;
  readTokensPerSecond: number;
  
  // Full test extraction script result
  avgReasoningTokens: number;
  avgReasoningDurationInMilliseconds: number;
  avgReasoningTokensPerSecond: number;

  // Validation script result
  totalQuestions: number;
  questionDistribution: Map<QuestionCategory, number>;
  questionWeightDistribution: Map<QuestionCategory, number>;
  avgNoAnswers: number;
  avgIncorrectAnswers: number;
  avgCorrectAnswers: number;
  correctnessRatio: number;
  avgAccuracyPercent: number;
  avgWeightedAccuracyPercent: number;

  // Calculated metrics
  charsPerToken: number;
  tokensPerValue: number;
  tokensPerRecord: number;
  avgReasoningTokensPerAnswer: number;

  // Result
  totalTokensUsed: number;
  efficientlyUsedTokens: number;
  // Efficiency score = (Accuracy percentage ÷ total tokens) × 1000. Higher is better.
  efficiencyScore: number;
}

interface AnalyticsOutput {
  timestamp: string;
  testConfigurations: {
    metadataFile: string;
    agentIdsFile: string;
    metricsFile: string;
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
  private outputDir: string;
  private validationDir: string;
  private metadataFile: string;
  private outputFile: string;
  private metricsFile: string;
  private agentIdsFile: string;

  constructor(agentIdsFile: string, outputDir: string) {
    this.agentIdsFile = agentIdsFile;
    this.outputDir = outputDir;
    this.validationDir = path.join(outputDir, DIRECTORY_ANSWERS_VALIDATION);
    this.metadataFile = path.join(this.outputDir, FILE_METADATA);
    this.outputFile = path.join(outputDir, FILE_ANALYTICS_RESULT);
    this.metricsFile = path.join(outputDir, FILE_METRICS);
  }

  public analyze(): void {
    console.log("Extracting metrics from agent transcripts...");
    const userMetrics = this.extractMetrics();
    
    console.log("Validating results...");
    const validationResults = this.validateResults();

    console.log("Loading metadata...");
    const metadata = this.loadMetadata();

    console.log("Calculating metrics...");
    const testMetrics = this.calculateMetrics(userMetrics, metadata, validationResults);

    console.log("Generating insights...");
    const analytics = this.generateAnalytics(testMetrics);

    console.log(`Writing results to ${this.outputFile}...`);
    this.writeOutput(analytics);

    console.log("✓ Analytics complete");
    console.log(`\nResults saved to: ${this.outputFile}`);
  }

  private extractMetrics(): UserMetrics[] {
    if (!fs.existsSync(this.agentIdsFile)) {
      console.warn(`AgentId file not found: ${this.agentIdsFile}`);
      return [];
    }

    try {
      const extraction = new MetricsExtraction(this.agentIdsFile, this.metricsFile);
      return extraction.extract();
    } catch (err) {
      throw new Error(`Metrics extraction failed: ${err}`);
    }
  }

  private loadMetadata(): any {
    const content = fs.readFileSync(this.metadataFile, "utf-8");
    return JSON.parse(content);
  }

  private validateResults(): Map<string, MergedValidationReport> {    
    const results = new Map<string, MergedValidationReport>();

    if (!fs.existsSync(this.validationDir)) {
      console.warn(`Validation directory not found: ${this.validationDir}`);
      return results;
    }

    try {
      const validator = new ReportValidator(this.outputDir);
      var reports = validator.validate();
      reports.forEach(x => {
        const key = `${x.format}_${x.recordCount}`;
        results.set(key, x);
      });
    } catch (err) {
      throw new Error(`Validation failed: ${err}`);
    }

    return results;
  }

  private calculateMetrics(
    userMetrics: UserMetrics[],
    metadata: any,
    validationResults: Map<string, MergedValidationReport>
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

        readTokens: userMetric.readTokens,
        readDurationInMilliseconds: userMetric.readDurationInMilliseconds,
        readTokensPerSecond: parseFloat((userMetric.readTokens / userMetric.readDurationInMilliseconds / 1000).toFixed(3)),

        avgReasoningTokens: userMetric.reasoningTokens,
        avgReasoningDurationInMilliseconds: userMetric.reasoningDurationInMilliseconds,
        avgReasoningTokensPerSecond: parseFloat((userMetric.reasoningTokens / userMetric.reasoningDurationInMilliseconds / 1000).toFixed(3)),

        totalQuestions: validation.totalQuestions,
        questionDistribution: new Map<QuestionCategory, number>(
          [["field_retrieval", QUESTIONS_DISTRIBUTION["field_retrieval"]],
          ["aggregation", QUESTIONS_DISTRIBUTION["aggregation"]],
          ["filtering", QUESTIONS_DISTRIBUTION["filtering"]],
          ["structure_awareness", QUESTIONS_DISTRIBUTION["structure_awareness"]],
          ["multiple_steps", QUESTIONS_DISTRIBUTION["multiple_steps"]]]
        ),
        questionWeightDistribution: new Map<QuestionCategory, number>(
          [["field_retrieval", QUESTIONS_WEIGHT_DISTRIBUTION["field_retrieval"]],
          ["aggregation", QUESTIONS_WEIGHT_DISTRIBUTION["aggregation"]],
          ["filtering", QUESTIONS_WEIGHT_DISTRIBUTION["filtering"]],
          ["structure_awareness", QUESTIONS_WEIGHT_DISTRIBUTION["structure_awareness"]],
          ["multiple_steps", QUESTIONS_WEIGHT_DISTRIBUTION["multiple_steps"]]]
        ),
        avgNoAnswers: validation.totalQuestions - validation.accuracy.correct - validation.accuracy.incorrect,
        avgIncorrectAnswers: validation.accuracy.incorrect,
        avgCorrectAnswers: validation.accuracy.correct,
        avgAccuracyPercent: validation.accuracy.accuracyPercent,
        avgWeightedAccuracyPercent: validation.accuracy.weightedAccuracyPercent,

        charsPerToken: parseFloat((datasetInfo.characterCount / userMetric.readTokens).toFixed(3)),
        tokensPerValue: parseFloat((userMetric.readTokens / datasetInfo.totalValues).toFixed(3)),
        tokensPerRecord: parseFloat((userMetric.readTokens / datasetInfo.recordCount).toFixed(3)),
        avgReasoningTokensPerAnswer: parseFloat((userMetric.reasoningTokens / validation.totalQuestions).toFixed(3)),
        totalTokensUsed: userMetric.readTokens + userMetric.reasoningTokens,
        correctnessRatio: validation.accuracy.correct / validation.totalQuestions,
        efficientlyUsedTokens: parseFloat(((userMetric.readTokens + userMetric.reasoningTokens) * (validation.accuracy.correct / validation.totalQuestions)).toFixed(3)),
        efficiencyScore: parseFloat((validation.accuracy.accuracyPercent / (userMetric.readTokens + userMetric.reasoningTokens) * 1000).toFixed(3)),
      });
    }

    return metrics;
  }

  private generateAnalytics(metrics: TestMetrics[]): AnalyticsOutput {
    if (metrics.length === 0) {
      throw new Error("No metrics to analyze");
    }

    const model = "unknown";
    const thinking = "unknown";

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
        metadataFile: this.metadataFile,
        agentIdsFile: this.agentIdsFile,
        metricsFile: this.metricsFile,
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
  let agentIdsFile: string | undefined;
  let outputDir: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--agent-ids":
        agentIdsFile = args[++i];
        break;
      case "--output":
        outputDir = args[++i];
        break;
    }
  }

  if (!agentIdsFile || !outputDir) {
    console.error("Usage: ts-node analytics.ts --agent-ids <file> --output <dir>");
    process.exit(1);
  }

  try {
    const analytics = new BenchmarkAnalytics(agentIdsFile, outputDir);
    analytics.analyze();
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }
}

export default BenchmarkAnalytics;
