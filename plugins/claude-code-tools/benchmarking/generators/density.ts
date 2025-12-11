/**
 * Data density variant generator
 * Takes 100% data and creates 50% variant by nulling optional fields
 */

import { BaseDataSet, DataDensity, DataRecord } from "../types";

/**
 * Optional fields that can be nulled to reduce data density
 * These vary by format (CSV shows as empty, JSON omits, etc.)
 */
const OPTIONAL_FIELDS: Set<string> = new Set([
  "avgRating",
  "shelfLife",
  "discontinuedDate",
  "description",
  "supplierLocation",
  "manufacturerCode",
  "warehouseLocation",
  "dimensions",
]);

export class DensityVariantGenerator {
  /**
   * Create a 50% density variant by nulling/omitting optional fields
   * Uses deterministic selection (same fields always removed for reproducibility)
   */
  public static create50PercentVariant(fullData: BaseDataSet, seed: number = 12345): BaseDataSet {
    const variantRecords: DataRecord[] = fullData.records.map((record, index) => {
      const variant: DataRecord = { ...record };

      // Deterministically select ~50% of optional fields to remove
      let fieldsRemoved = 0;
      const rand = this.seededRandom(seed + index);

      for (const field of OPTIONAL_FIELDS) {
        if (field in record && rand() > 0.5) {
          delete variant[field];
          fieldsRemoved++;
        }
      }

      return variant;
    });

    // Calculate new character count
    const newCharCount = variantRecords.reduce((sum, record) => sum + JSON.stringify(record).length, 0);

    return {
      metadata: {
        ...fullData.metadata,
        density: 50 as DataDensity,
        characterCount: newCharCount,
        description: `Product catalog with ${variantRecords.length} items, ${newCharCount} characters, 50% data density`,
      },
      records: variantRecords,
    };
  }

  private static seededRandom(seed: number): () => number {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }
}

/**
 * Generate both 100% and 50% variants from a base dataset
 */
export function generateDensityVariants(baseData: BaseDataSet): {
  full: BaseDataSet;
  sparse: BaseDataSet;
} {
  const sparse = DensityVariantGenerator.create50PercentVariant(baseData);
  return {
    full: baseData,
    sparse,
  };
}
