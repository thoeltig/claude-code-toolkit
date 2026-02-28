#!/usr/bin/env node
/**
 * TypeScript Table Generation for Benchmark Analytics
 * Generates comprehensive markdown tables from analytics_results.json and validation results
 *
 * Usage: node dist/tables/generateTables.js \
 *   --json-path PATH \
 *   --results-path PATH
 */

import { loadAnalyticsResults, aggregateMetrics, loadValidationResults } from './tableLoaders';
import {
  generateComprehensiveTable,
  generateReadTokensTable,
  generateTotalTokensTable,
  generateAccuracyTable,
  generateEfficiencyTable,
  generateCostOfInaccuracyTable,
  generateTokensPerCharTable,
  generateRankingsTable,
  generateMandatoryOptionalComparisonTable,
  generateCostAnalysisTable,
  generateRawVsWeightedDeltaTable,
  generateInfoValueTable,
  generateSummaryStatisticsTable,
  generateCategoryAccuracyByFormatTable,
  generateCategoryMandatoryOptionalDeltaTable,
  generateCategoryDifficultyRankingTable,
} from './tableGenerators';

// ============================================================================
// CLI PARSING
// ============================================================================

function parseArgs(args: string[]): { jsonPath: string; resultsPath: string } {
  let jsonPath = '../benchmark_format_all_variant_all_haiku_off/analytics_results.json';
  let resultsPath = '../benchmark_format_all_variant_all_haiku_off/results';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json-path' && args[i + 1]) {
      jsonPath = args[++i];
    } else if (args[i] === '--results-path' && args[i + 1]) {
      resultsPath = args[++i];
    }
  }

  return { jsonPath, resultsPath };
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  try {
    const { jsonPath, resultsPath } = parseArgs(process.argv.slice(2));

    // Load and aggregate analytics data
    console.log('Loading analytics results...');
    const analyticsData = loadAnalyticsResults(jsonPath);
    const aggregated = aggregateMetrics(analyticsData.metrics);

    // Load validation results
    console.log('Loading validation results...');
    const validations = loadValidationResults(resultsPath);

    // Derive unique values
    const uniqueFormats = [...new Set(aggregated.map(a => a.format))].sort();
    const recordCounts = [...new Set(aggregated.map(a => a.recordCount))].sort((a, b) => b - a);

    console.log(`Loaded ${aggregated.length} aggregated metrics`);
    console.log(`Loaded ${validations.length} validation summaries`);
    console.log(`Found ${uniqueFormats.length} formats: ${uniqueFormats.join(', ')}`);
    console.log(`Found ${recordCounts.length} record counts: ${recordCounts.join(', ')}`);
    console.log('\n');

    // Generate all tables
    generateComprehensiveTable(aggregated);
    generateReadTokensTable(aggregated, recordCounts, uniqueFormats);
    generateTotalTokensTable(aggregated, recordCounts, uniqueFormats);
    generateAccuracyTable(aggregated, recordCounts, uniqueFormats);
    generateEfficiencyTable(aggregated, recordCounts, uniqueFormats);
    generateCostOfInaccuracyTable(aggregated, recordCounts, uniqueFormats);
    generateTokensPerCharTable(aggregated, recordCounts, uniqueFormats);
    generateRankingsTable(aggregated, recordCounts);
    generateMandatoryOptionalComparisonTable(aggregated, recordCounts, uniqueFormats);
    generateCostAnalysisTable(aggregated, recordCounts, uniqueFormats);
    generateRawVsWeightedDeltaTable(aggregated, recordCounts, uniqueFormats);
    generateInfoValueTable(aggregated, recordCounts, uniqueFormats);
    generateSummaryStatisticsTable(aggregated, recordCounts);

    // Generate new per-topic accuracy tables
    generateCategoryAccuracyByFormatTable(validations, recordCounts, uniqueFormats);
    generateCategoryMandatoryOptionalDeltaTable(validations, recordCounts, uniqueFormats);
    generateCategoryDifficultyRankingTable(validations, recordCounts);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
