/**
 * Base data model generator
 * Generates product catalog dataset
 * Can be converted to all target formats
 */

import { Metadata, BaseDataSet, ProductRecord } from "../types";
import { ProductRecordRandomizer } from "./productRecordRandomizer";

export class ProductDataGenerator {  
  private readonly data:ProductRecordRandomizer;

  constructor(seed: number = 12345) {
    this.data = new ProductRecordRandomizer(seed);
  }

  public generate(recordCount: number): BaseDataSet {
    const records: ProductRecord[] = [];
    let recordIndex = 0;
    let totalValues = 0;

    while (recordIndex < recordCount) {
      const product = this.data.getRandomProduct(recordIndex);
      totalValues+=19;

      if (product.avgRating) {
        totalValues+=1;
      }

      if (product.shelfLife) {
        totalValues+=1;
      }
      
      if (product.discontinuedDate) {
        totalValues+=1;
      }

      records.push(product);
      recordIndex++;
    }

    const metadata:Metadata = {
      fieldCount: Object.keys(records[0] || {}).length,
      recordCount: records.length,
      totalValues: totalValues,
      generatedAt: new Date().toISOString(),
      description: `Product catalog with ${records.length} items`,
    };

    return { metadata, records };
  }
}

export function generateProductDataGenerator(recordCount: number): BaseDataSet {
  const generator = new ProductDataGenerator();
  return generator.generate(recordCount);
}
