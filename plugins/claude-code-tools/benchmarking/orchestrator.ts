/**
 * Benchmarking orchestrator
 * Main entry point for generating test data, questionnaires, and coordinating test execution
 */

import * as fs from "fs";
import * as path from "path";
import { BaseModelGenerator, generateBaseData } from "./generators/baseModel";
import { generateDensityVariants } from "./generators/density";
import { convertToFormat } from "./converters/index";
import { generateQuestionnaire } from "./generators/questions";
import { validateAnswers } from "./validators/index";
import {
  Format,
  DataDensity,
  GeneratorOptions,
  GenerationResult,
  BaseDataSet,
  AnswerTemplate,
  ValidationReport,
} from "./types";

const TARGET_CHAR_COUNT = 60000;
const FORMATS: Format[] = ["csv", "json", "markdown", "yaml", "apache"];
const DENSITIES: DataDensity[] = [100, 50];

export class BenchmarkingOrchestrator {
  private outputDir: string;

  constructor(outputDir: string = "benchmarking") {
    this.outputDir = outputDir;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = ["data", "questionnaires", "answers", "results"];
    for (const dir of dirs) {
      const fullPath = path.join(this.outputDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  /**
   * Generate all test data and questionnaires
   */
  public generateAllTestData(): Map<string, GenerationResult> {
    const results = new Map<string, GenerationResult>();

    console.log(`Generating test data targeting ~${TARGET_CHAR_COUNT} characters per file...\n`);

    for (const format of FORMATS) {
      for (const density of DENSITIES) {
        console.log(`Generating ${format.toUpperCase()} @ ${density}% density...`);

        // Generate base data
        const baseData = generateBaseData(TARGET_CHAR_COUNT, density);

        // Generate variants
        let fullData = baseData;
        let sparseData = baseData;

        if (density === 50) {
          const variants = generateDensityVariants(baseData);
          fullData = baseData; // Use original for 100%
          sparseData = variants.sparse; // Use sparse for 50%
        }

        // For 50% density, use the sparse version
        const dataToUse = density === 50 ? sparseData : fullData;

        // Convert to format
        const fileContent = convertToFormat(dataToUse, format);
        const fileExt = this.getFileExtension(format);
        const dataFileName = `${format}_${density}.${fileExt}`;
        const dataFilePath = path.join(this.outputDir, "data", dataFileName);

        fs.writeFileSync(dataFilePath, fileContent);

        // Generate questionnaire
        const questionnaire = generateQuestionnaire(dataToUse, format, density, dataFileName);
        const questionnaireFileName = `${format}_${density}.json`;
        const questionnairePath = path.join(this.outputDir, "questionnaires", questionnaireFileName);

        fs.writeFileSync(questionnairePath, JSON.stringify(questionnaire, null, 2));

        // Generate empty answer template
        const answerTemplate: AnswerTemplate = {
          metadata: {
            format,
            density,
            dataFile: dataFileName,
            questionnaireFile: questionnaireFileName,
          },
          answers: questionnaire.questions.map((q) => ({
            questionId: q.id,
            answer: "",
          })),
        };

        const answerTemplateFileName = `${format}_${density}_template.json`;
        const answerTemplatePath = path.join(this.outputDir, "answers", answerTemplateFileName);

        fs.writeFileSync(answerTemplatePath, JSON.stringify(answerTemplate, null, 2));

        // Track result
        results.set(`${format}_${density}`, {
          format,
          density,
          dataFile: dataFileName,
          questionnaireFile: questionnaireFileName,
          metadata: dataToUse.metadata,
          questionCount: questionnaire.questions.length,
        });

        console.log(
          `  ✓ Data: ${dataFileName} (${dataToUse.metadata.characterCount} chars)`
        );
        console.log(
          `  ✓ Questionnaire: ${questionnaireFileName} (${questionnaire.questions.length} questions)`
        );
        console.log(`  ✓ Answer template: ${answerTemplateFileName}\n`);
      }
    }

    // Write metadata
    this.writeMetadata(results);

    return results;
  }

  /**
   * Validate answers from a test execution
   */
  public validateTestResults(
    answerFilePath: string,
    questionnaireFilePath: string,
    scenario: "original" | "minified" | "minified_json"
  ): ValidationReport {
    if (!fs.existsSync(answerFilePath)) {
      throw new Error(`Answer file not found: ${answerFilePath}`);
    }
    if (!fs.existsSync(questionnaireFilePath)) {
      throw new Error(`Questionnaire file not found: ${questionnaireFilePath}`);
    }

    const answerData = JSON.parse(fs.readFileSync(answerFilePath, "utf-8")) as AnswerTemplate;
    const questionnaireData = JSON.parse(fs.readFileSync(questionnaireFilePath, "utf-8"));

    const report = validateAnswers(answerData, questionnaireData.questions, scenario);

    // Write validation report
    const reportFileName = `${answerData.metadata.format}_${answerData.metadata.density}_${scenario}_validation.json`;
    const reportPath = path.join(this.outputDir, "results", reportFileName);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  private writeMetadata(results: Map<string, GenerationResult>): void {
    const metadata = {
      generatedAt: new Date().toISOString(),
      targetCharCount: TARGET_CHAR_COUNT,
      formats: FORMATS,
      densities: DENSITIES,
      totalDatasets: results.size,
      datasets: Array.from(results.values()),
    };

    const metadataPath = path.join(this.outputDir, "data", "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`Metadata written to ${metadataPath}`);
  }

  private getFileExtension(format: Format): string {
    const extensions: Record<Format, string> = {
      csv: "csv",
      json: "json",
      markdown: "md",
      yaml: "yaml",
      apache: "log",
    };
    return extensions[format];
  }
}

// CLI entry point
if (require.main === module) {
  const outputDir = process.argv[2] || "benchmarking";
  const orchestrator = new BenchmarkingOrchestrator(outputDir);

  console.log(`\n${"=".repeat(60)}`);
  console.log("BENCHMARKING FRAMEWORK - TEST DATA GENERATION");
  console.log(`${"=".repeat(60)}\n`);

  const results = orchestrator.generateAllTestData();

  console.log(`${"=".repeat(60)}`);
  console.log(`Generated ${results.size} dataset(s) with questionnaires`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`${"=".repeat(60)}\n`);
}

export default BenchmarkingOrchestrator;
