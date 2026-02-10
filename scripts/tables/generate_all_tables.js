#!/usr/bin/env node
/**
 * Unified Table Generation for Benchmark Analytics
 * Generates comprehensive markdown tables from analytics_results.json
 *
 * Usage: node generate_all_tables.js [--json-path PATH] [--sort-by METRIC] [--variant VARIANT]
 *
 * Metrics: read-tokens, tokens-per-char, reasoning-tokens, total-tokens, raw-accuracy,
 *          weighted-accuracy, accuracy-delta, info-value-per-token, variant-impact,
 *          cost-of-inaccuracy, efficiency, weighted-efficiency, efficiency-delta
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
let jsonPath = '../benchmark_format_all_variant_all_haiku_off/analytics_results.json';
let sortBy = 'total-tokens';
let variantFilter = null; // null = show all, 'mandatory' or 'optional'

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--json-path' && args[i + 1]) jsonPath = args[++i];
  if (args[i] === '--sort-by' && args[i + 1]) sortBy = args[++i];
  if (args[i] === '--variant' && args[i + 1]) variantFilter = args[++i];
}

try {
  const data = require(jsonPath);
  if (!data.metrics) throw new Error('Invalid analytics JSON: missing metrics array');

  const metrics = data.metrics;

  // Group by format, variant, AND record count to preserve detail
  const byFormatVariantRecord = {};
  metrics.forEach(m => {
    const variant = m.hasOptionalData ? 'optional' : 'mandatory';
    const key = `${m.format}||${variant}||${m.recordCount}`; // Preserve record count
    if (!byFormatVariantRecord[key]) byFormatVariantRecord[key] = [];
    byFormatVariantRecord[key].push(m);
  });

  // Aggregate metrics per format+variant+recordCount combo
  const aggregated = [];
  Object.entries(byFormatVariantRecord).forEach(([key, tests]) => {
    const [format, variant, recordCountStr] = key.split('||');
    const recordCount = parseInt(recordCountStr);

    // Average across multiple test runs for same format+variant+recordCount
    const avgTest = {
      readTokens: 0,
      avgEstimatedReasoningTokens: 0,
      totalTokensUsed: 0,
      charsPerToken: 0,
      avgAccuracyPercent: 0,
      avgWeightedAccuracyPercent: 0,
      informationValuePerToken: 0,
      costOfInaccuracy: 0,
      efficiencyScore: 0,
      weightedEfficiencyScore: 0
    };

    tests.forEach(t => {
      avgTest.readTokens += t.readTokens;
      avgTest.avgEstimatedReasoningTokens += t.avgEstimatedReasoningTokens;
      avgTest.totalTokensUsed += t.totalTokensUsed;
      avgTest.charsPerToken += t.charsPerToken;
      avgTest.avgAccuracyPercent += t.avgAccuracyPercent;
      avgTest.avgWeightedAccuracyPercent += t.avgWeightedAccuracyPercent;
      avgTest.informationValuePerToken += t.informationValuePerToken;
      avgTest.costOfInaccuracy += t.costOfInaccuracy;
      avgTest.efficiencyScore += t.efficiencyScore;
      avgTest.weightedEfficiencyScore += t.weightedEfficiencyScore;
    });

    const count = tests.length;
    Object.keys(avgTest).forEach(key => {
      avgTest[key] = avgTest[key] / count;
    });

    aggregated.push({
      format,
      variant,
      recordCount,
      ...avgTest
    });
  });

  // Calculate deltas
  aggregated.forEach(item => {
    const mandatory = aggregated.find(a => a.format === item.format && a.variant === 'mandatory');
    const optional = aggregated.find(a => a.format === item.format && a.variant === 'optional');

    if (mandatory && optional) {
      item.accuracyDelta = optional.avgAccuracyPercent - mandatory.avgAccuracyPercent;
      item.weightedAccuracyDelta = optional.avgWeightedAccuracyPercent - mandatory.avgWeightedAccuracyPercent;
      item.efficiencyDelta = optional.efficiencyScore - mandatory.efficiencyScore;
      item.weightedEfficiencyDelta = optional.weightedEfficiencyScore - mandatory.weightedEfficiencyScore;
      item.variantImpact = ((optional.informationValuePerToken / mandatory.informationValuePerToken - 1) * 100);
    }
  });

  // Get unique formats (preserving full names like json_compact)
  const uniqueFormats = [...new Set(aggregated.map(a => a.format))].sort();

  // Filter by variant if specified
  let filtered = variantFilter
    ? aggregated.filter(a => a.variant === variantFilter)
    : aggregated;

  // Sort by specified metric
  const sortMap = {
    'read-tokens': (a, b) => a.readTokens - b.readTokens,
    'reasoning-tokens': (a, b) => a.avgEstimatedReasoningTokens - b.avgEstimatedReasoningTokens,
    'total-tokens': (a, b) => a.totalTokensUsed - b.totalTokensUsed,
    'tokens-per-char': (a, b) => a.charsPerToken - b.charsPerToken,
    'raw-accuracy': (a, b) => b.avgAccuracyPercent - a.avgAccuracyPercent,
    'weighted-accuracy': (a, b) => b.avgWeightedAccuracyPercent - a.avgWeightedAccuracyPercent,
    'accuracy-delta': (a, b) => b.accuracyDelta - a.accuracyDelta,
    'info-value': (a, b) => b.informationValuePerToken - a.informationValuePerToken,
    'variant-impact': (a, b) => b.variantImpact - a.variantImpact,
    'cost-inaccuracy': (a, b) => a.costOfInaccuracy - b.costOfInaccuracy,
    'efficiency': (a, b) => b.efficiencyScore - a.efficiencyScore,
    'weighted-efficiency': (a, b) => b.weightedEfficiencyScore - a.weightedEfficiencyScore,
    'efficiency-delta': (a, b) => b.weightedEfficiencyDelta - a.weightedEfficiencyDelta
  };

  if (sortMap[sortBy]) {
    filtered.sort(sortMap[sortBy]);
  }

  console.log('\n=== COMPREHENSIVE BENCHMARK METRICS TABLE ===\n');
  console.log(`Sort: ${sortBy} | Variant: ${variantFilter || 'all'}\n`);

  // Generate comprehensive table
  console.log('| Format | Records | Variant | Read Tokens | Reasoning | Total | Tokens/Char | Raw Acc | Wtd Acc | Info/Token | Cost Inaccuracy | Efficiency | Wtd Efficiency |');
  console.log('|--------|---------|---------|-------------|-----------|-------|-------------|---------|---------|------------|-----------------|------------|-----------------|');

  filtered.forEach(item => {
    const fmt = item.format.toUpperCase();
    const rec = item.recordCount;
    const var_ = item.variant.substring(0, 3);
    console.log(
      `| ${fmt} | ${rec} | ${var_} | ${Math.round(item.readTokens)} | ${Math.round(item.avgEstimatedReasoningTokens)} | ${Math.round(item.totalTokensUsed)} | ${item.charsPerToken.toFixed(2)} | ${item.avgAccuracyPercent.toFixed(1)}% | ${item.avgWeightedAccuracyPercent.toFixed(1)}% | ${item.informationValuePerToken.toFixed(3)} | ${Math.round(item.costOfInaccuracy)} | ${item.efficiencyScore.toFixed(1)} | ${item.weightedEfficiencyScore.toFixed(1)} |`
    );
  });

  // Get record counts for detailed breakdown
  const recordCounts = [...new Set(aggregated.map(a => a.recordCount))].sort((a, b) => b - a);

  // Detailed tables by metric
  console.log('\n\n=== READ TOKENS ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Variants:**\n| Format | Mandatory | Optional |`);
    console.log('|--------|-----------|----------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        console.log(`| ${fmt.toUpperCase()} | ${Math.round(mand.readTokens)} | ${Math.round(opt.readTokens)} |`);
      }
    });
    console.log();
  });

  console.log('\n\n=== TOTAL TOKENS (Read + Reasoning) ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Variants:**\n| Format | Mandatory | Optional |`);
    console.log('|--------|-----------|----------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        console.log(`| ${fmt.toUpperCase()} | ${Math.round(mand.totalTokensUsed)} | ${Math.round(opt.totalTokensUsed)} |`);
      }
    });
    console.log();
  });

  console.log('\n\n=== ACCURACY (Raw vs Weighted) ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Variants:**\n| Format | Raw Mand | Raw Opt | Wtd Mand | Wtd Opt | Delta (Raw) | Delta (Wtd) |`);
    console.log('|--------|----------|--------|----------|--------|-------------|-------------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        const rawDelta = (opt.avgAccuracyPercent - mand.avgAccuracyPercent).toFixed(1);
        const wtdDelta = (opt.avgWeightedAccuracyPercent - mand.avgWeightedAccuracyPercent).toFixed(1);
        console.log(`| ${fmt.toUpperCase()} | ${mand.avgAccuracyPercent.toFixed(1)}% | ${opt.avgAccuracyPercent.toFixed(1)}% | ${mand.avgWeightedAccuracyPercent.toFixed(1)}% | ${opt.avgWeightedAccuracyPercent.toFixed(1)}% | ${rawDelta} | ${wtdDelta} |`);
      }
    });
    console.log();
  });

  console.log('\n\n=== EFFICIENCY METRICS ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Variants:**\n| Format | Info/Token Mand | Info/Token Opt | Variant Impact | Efficiency Mand | Efficiency Opt | Wtd Eff Mand | Wtd Eff Opt |`);
    console.log('|--------|-----------------|----------------|-----------------|-----------------|----------------|--------------|-------------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        const impact = ((opt.informationValuePerToken / mand.informationValuePerToken - 1) * 100).toFixed(1);
        console.log(`| ${fmt.toUpperCase()} | ${mand.informationValuePerToken.toFixed(3)} | ${opt.informationValuePerToken.toFixed(3)} | ${impact}% | ${mand.efficiencyScore.toFixed(1)} | ${opt.efficiencyScore.toFixed(1)} | ${mand.weightedEfficiencyScore.toFixed(1)} | ${opt.weightedEfficiencyScore.toFixed(1)} |`);
      }
    });
    console.log();
  });

  console.log('\n\n=== COST OF INACCURACY (tokens wasted) ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Variants:**\n| Format | Mandatory | Optional |`);
    console.log('|--------|-----------|----------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        console.log(`| ${fmt.toUpperCase()} | ${Math.round(mand.costOfInaccuracy)} | ${Math.round(opt.costOfInaccuracy)} |`);
      }
    });
    console.log();
  });

  console.log('\n\n=== TOKENS PER CHARACTER ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Variants:**\n| Format | Mandatory | Optional |`);
    console.log('|--------|-----------|----------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        console.log(`| ${fmt.toUpperCase()} | ${mand.charsPerToken.toFixed(3)} | ${opt.charsPerToken.toFixed(3)} |`);
      }
    });
    console.log();
  });

  // === RANKING TABLES ===
  console.log('\n\n=== RANKINGS BY METRIC ===\n');

  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Dataset:**\n`);

    // Most token efficient
    const mandatoryTests = aggregated.filter(a => a.variant === 'mandatory' && a.recordCount === recCount).sort((a, b) => a.totalTokensUsed - b.totalTokensUsed);
    console.log('Most Token Efficient (lowest total tokens):\n| Rank | Format | Tokens | Weighted Accuracy | Tokens/Accuracy |');
    console.log('|------|--------|--------|-------------------|-----------------|');
    mandatoryTests.slice(0, 7).forEach((item, idx) => {
      const tokensPerAcc = (item.totalTokensUsed / item.avgWeightedAccuracyPercent).toFixed(1);
      console.log(`| ${idx + 1} | ${item.format.toUpperCase()} | ${Math.round(item.totalTokensUsed)} | ${item.avgWeightedAccuracyPercent.toFixed(1)}% | ${tokensPerAcc} |`);
    });

    // Most accurate
    const byAccuracy = aggregated.filter(a => a.variant === 'mandatory' && a.recordCount === recCount).sort((a, b) => b.avgWeightedAccuracyPercent - a.avgWeightedAccuracyPercent);
    console.log('\nHighest Weighted Accuracy:\n| Rank | Format | Weighted Accuracy | Total Tokens | Tokens/Accuracy |');
    console.log('|------|--------|-------------------|--------------|-----------------|');
    byAccuracy.slice(0, 7).forEach((item, idx) => {
      const tokensPerAcc = (item.totalTokensUsed / item.avgWeightedAccuracyPercent).toFixed(1);
      console.log(`| ${idx + 1} | ${item.format.toUpperCase()} | ${item.avgWeightedAccuracyPercent.toFixed(1)}% | ${Math.round(item.totalTokensUsed)} | ${tokensPerAcc} |`);
    });

    // Best efficiency score
    const byWtdEff = aggregated.filter(a => a.variant === 'mandatory' && a.recordCount === recCount).sort((a, b) => b.weightedEfficiencyScore - a.weightedEfficiencyScore);
    console.log('\nBest Weighted Efficiency Score:\n| Rank | Format | Efficiency Score | Weighted Accuracy | Total Tokens |');
    console.log('|------|--------|------------------|-------------------|--------------|');
    byWtdEff.slice(0, 7).forEach((item, idx) => {
      console.log(`| ${idx + 1} | ${item.format.toUpperCase()} | ${item.weightedEfficiencyScore.toFixed(1)} | ${item.avgWeightedAccuracyPercent.toFixed(1)}% | ${Math.round(item.totalTokensUsed)} |`);
    });
    console.log();
  });

  // === DETAILED COMPARISON TABLES ===
  console.log('\n\n=== MANDATORY VS OPTIONAL COMPARISON ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Dataset:**\n| Format | Tokens Mand | Tokens Opt | Token Diff | Token % Change | Acc Mand | Acc Opt | Acc Diff | Eff Mand | Eff Opt | Eff Diff | Eff % Change |`);
    console.log('|--------|------------|-----------|-----------|----------------|----------|---------|----------|----------|---------|----------|--------------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        const tokenDiff = opt.totalTokensUsed - mand.totalTokensUsed;
        const tokenPctChange = ((opt.totalTokensUsed / mand.totalTokensUsed - 1) * 100).toFixed(1);
        const accDiff = (opt.avgWeightedAccuracyPercent - mand.avgWeightedAccuracyPercent).toFixed(1);
        const effDiff = (opt.weightedEfficiencyScore - mand.weightedEfficiencyScore).toFixed(1);
        const effPctChange = ((opt.weightedEfficiencyScore / mand.weightedEfficiencyScore - 1) * 100).toFixed(1);
        console.log(`| ${fmt.toUpperCase()} | ${Math.round(mand.totalTokensUsed)} | ${Math.round(opt.totalTokensUsed)} | ${Math.round(tokenDiff)} | ${tokenPctChange > 0 ? '+' : ''}${tokenPctChange}% | ${mand.avgWeightedAccuracyPercent.toFixed(1)}% | ${opt.avgWeightedAccuracyPercent.toFixed(1)}% | ${accDiff} | ${mand.weightedEfficiencyScore.toFixed(1)} | ${opt.weightedEfficiencyScore.toFixed(1)} | ${effDiff} | ${effPctChange > 0 ? '+' : ''}${effPctChange}% |`);
      }
    });
    console.log();
  });

  // === COST ANALYSIS ===
  console.log('\n\n=== COST ANALYSIS: TOKENS PER ACCURACY POINT ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Dataset:**\n| Format | Mandatory (Tokens/%) | Optional (Tokens/%) | Difference | % Change |`);
    console.log('|--------|---------------------|---------------------|-----------|----------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        const mandCost = (mand.totalTokensUsed / mand.avgWeightedAccuracyPercent).toFixed(1);
        const optCost = (opt.totalTokensUsed / opt.avgWeightedAccuracyPercent).toFixed(1);
        const diff = (optCost - mandCost).toFixed(1);
        const pctChange = ((optCost / mandCost - 1) * 100).toFixed(1);
        console.log(`| ${fmt.toUpperCase()} | ${mandCost} | ${optCost} | ${diff > 0 ? '+' : ''}${diff} | ${pctChange > 0 ? '+' : ''}${pctChange}% |`);
      }
    });
    console.log();
  });

  // === RAW VS WEIGHTED ACCURACY COMPARISON ===
  console.log('\n\n=== RAW VS WEIGHTED ACCURACY DELTA ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Dataset:**\n| Format | Raw Mand | Weighted Mand | Delta Mand | Raw Opt | Weighted Opt | Delta Opt | Avg Delta |`);
    console.log('|--------|----------|--------------|-----------|---------|-------------|-----------|-----------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        const deltaMand = (mand.avgWeightedAccuracyPercent - mand.avgAccuracyPercent).toFixed(1);
        const deltaOpt = (opt.avgWeightedAccuracyPercent - opt.avgAccuracyPercent).toFixed(1);
        const avgDelta = ((parseFloat(deltaMand) + parseFloat(deltaOpt)) / 2).toFixed(1);
        console.log(`| ${fmt.toUpperCase()} | ${mand.avgAccuracyPercent.toFixed(1)}% | ${mand.avgWeightedAccuracyPercent.toFixed(1)}% | +${deltaMand} | ${opt.avgAccuracyPercent.toFixed(1)}% | ${opt.avgWeightedAccuracyPercent.toFixed(1)}% | +${deltaOpt} | +${avgDelta} |`);
      }
    });
    console.log();
  });

  // === INFORMATION VALUE COMPARISON ===
  console.log('\n\n=== INFORMATION VALUE & VARIANT IMPACT ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Dataset:**\n| Format | Info/Token Mand | Info/Token Opt | Absolute Change | % Change (Variant Impact) |`);
    console.log('|--------|-----------------|----------------|-----------------|-----------------------|');
    uniqueFormats.forEach(fmt => {
      const mand = aggregated.find(a => a.format === fmt && a.variant === 'mandatory' && a.recordCount === recCount);
      const opt = aggregated.find(a => a.format === fmt && a.variant === 'optional' && a.recordCount === recCount);
      if (mand && opt) {
        const absDiff = (opt.informationValuePerToken - mand.informationValuePerToken).toFixed(3);
        const pctChange = ((opt.informationValuePerToken / mand.informationValuePerToken - 1) * 100).toFixed(1);
        const status = pctChange > 0 ? '✓' : '✗';
        console.log(`| ${fmt.toUpperCase()} | ${mand.informationValuePerToken.toFixed(3)} | ${opt.informationValuePerToken.toFixed(3)} | ${absDiff > 0 ? '+' : ''}${absDiff} | ${status} ${pctChange > 0 ? '+' : ''}${pctChange}% |`);
      }
    });
    console.log();
  });

  // === SUMMARY STATISTICS ===
  console.log('\n\n=== SUMMARY STATISTICS ===\n');
  recordCounts.forEach(recCount => {
    console.log(`**${recCount}-Record Dataset (Mandatory Data):**\n`);
    const mandTests = aggregated.filter(a => a.variant === 'mandatory' && a.recordCount === recCount);
    const avgTokens = (mandTests.reduce((sum, a) => sum + a.totalTokensUsed, 0) / mandTests.length).toFixed(0);
    const avgAccuracy = (mandTests.reduce((sum, a) => sum + a.avgWeightedAccuracyPercent, 0) / mandTests.length).toFixed(1);
    const minTokens = Math.min(...mandTests.map(a => a.totalTokensUsed));
    const maxTokens = Math.max(...mandTests.map(a => a.totalTokensUsed));
    const minAccuracy = Math.min(...mandTests.map(a => a.avgWeightedAccuracyPercent));
    const maxAccuracy = Math.max(...mandTests.map(a => a.avgWeightedAccuracyPercent));

    console.log(`| Metric | Value |`);
    console.log(`|--------|-------|`);
    console.log(`| Average Total Tokens | ${avgTokens} |`);
    console.log(`| Min Tokens | ${Math.round(minTokens)} (${aggregated.find(a => a.variant === 'mandatory' && a.recordCount === recCount && a.totalTokensUsed === minTokens).format.toUpperCase()}) |`);
    console.log(`| Max Tokens | ${Math.round(maxTokens)} (${aggregated.find(a => a.variant === 'mandatory' && a.recordCount === recCount && a.totalTokensUsed === maxTokens).format.toUpperCase()}) |`);
    console.log(`| Average Weighted Accuracy | ${avgAccuracy}% |`);
    console.log(`| Lowest Accuracy | ${minAccuracy.toFixed(1)}% (${aggregated.find(a => a.variant === 'mandatory' && a.recordCount === recCount && a.avgWeightedAccuracyPercent === minAccuracy).format.toUpperCase()}) |`);
    console.log(`| Highest Accuracy | ${maxAccuracy.toFixed(1)}% (${aggregated.find(a => a.variant === 'mandatory' && a.recordCount === recCount && a.avgWeightedAccuracyPercent === maxAccuracy).format.toUpperCase()}) |`);
    console.log();
  });

} catch (err) {
  console.error(`Error: ${err.message}`);
  console.error(`Make sure JSON file exists at: ${path.resolve(jsonPath)}`);
  process.exit(1);
}
