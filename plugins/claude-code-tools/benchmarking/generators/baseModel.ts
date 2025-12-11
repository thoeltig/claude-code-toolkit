/**
 * Base data model generator
 * Generates ~60k character product catalog dataset
 * Can be converted to all target formats
 */

import { BaseDataSet, DataRecord, DataDensity } from "../types";

interface ProductRecord extends DataRecord {
  productId: string;
  productName: string;
  category: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  reorderPoint: number;
  lastRestocked: string;
  supplierName: string;
  supplierLocation: string;
  description: string;
  sku: string;
  manufacturerCode: string;
  warehouseLocation: string;
  shelfLife?: number;
  weight: number;
  dimensions: string;
  hazardous: boolean;
  fragile: boolean;
  discontinuedDate?: string;
  avgRating?: number;
  unitsShipped: number;
}

export class BaseModelGenerator {
  private readonly categories: string[] = [
    "Electronics",
    "Office Supplies",
    "Industrial Equipment",
    "Tools",
    "Materials",
    "Chemicals",
    "Furniture",
    "Textiles",
    "Packaging",
    "Accessories",
  ];

  private readonly suppliers: string[] = [
    "Global Supply Co",
    "Premier Parts Ltd",
    "Industrial Solutions Inc",
    "Tech Components Group",
    "Material Distributors AB",
    "Factory Direct Inc",
    "Reliable Vendors LLC",
    "Trade Partners Ltd",
  ];

  private readonly locations: string[] = [
    "New York, USA",
    "Shanghai, China",
    "Singapore",
    "Rotterdam, Netherlands",
    "Hamburg, Germany",
    "Hong Kong",
    "Los Angeles, USA",
    "Dubai, UAE",
  ];

  private rand: () => number;

  constructor(seed: number = 12345) {
    this.rand = this.seededRandom(seed);
  }

  private seededRandom(seed: number): () => number {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }

  private getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(this.rand() * arr.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(this.rand() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number, decimals: number = 2): number {
    return Math.round((this.rand() * (max - min) + min) * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private generateDate(daysAgo: number = 365): string {
    const date = new Date();
    date.setDate(date.getDate() - this.randomInt(0, daysAgo));
    return date.toISOString().split("T")[0];
  }

  private generateSKU(index: number): string {
    const category = this.getRandomItem(this.categories).substring(0, 3).toUpperCase();
    return `${category}-${String(index).padStart(6, "0")}`;
  }

  private generateDimensions(): string {
    const w = this.randomInt(5, 200);
    const h = this.randomInt(5, 200);
    const d = this.randomInt(5, 200);
    return `${w}x${h}x${d}cm`;
  }

  public generate(targetCharCount: number = 60000, density: DataDensity = 100): BaseDataSet {
    const records: ProductRecord[] = [];
    let totalChars = 0;
    let recordIndex = 0;

    // Estimate chars per record (~500 chars average for full record)
    const estimatedRecordSize = 500;
    const estimatedRecordCount = Math.ceil(targetCharCount / estimatedRecordSize);

    while (totalChars < targetCharCount && recordIndex < estimatedRecordCount * 1.5) {
      const record: ProductRecord = {
        productId: `PROD-${String(recordIndex + 1).padStart(6, "0")}`,
        productName: this.generateProductName(),
        category: this.getRandomItem(this.categories),
        price: this.randomFloat(10, 5000, 2),
        costPrice: this.randomFloat(5, 2500, 2),
        stockQuantity: this.randomInt(0, 10000),
        reorderPoint: this.randomInt(10, 500),
        lastRestocked: this.generateDate(90),
        supplierName: this.getRandomItem(this.suppliers),
        supplierLocation: this.getRandomItem(this.locations),
        description: this.generateDescription(),
        sku: this.generateSKU(recordIndex),
        manufacturerCode: `MFR-${this.randomInt(100000, 999999)}`,
        warehouseLocation: `${String.fromCharCode(65 + this.randomInt(0, 9))}-${this.randomInt(1, 99)}-${this.randomInt(1, 50)}`,
        weight: this.randomFloat(0.1, 500, 2),
        dimensions: this.generateDimensions(),
        hazardous: this.rand() > 0.8,
        fragile: this.rand() > 0.7,
        unitsShipped: this.randomInt(0, 100000),
      };

      // Add optional fields based on probability
      if (this.rand() > 0.3) {
        record.avgRating = this.randomFloat(1, 5, 1);
      }
      if (this.rand() > 0.6) {
        record.shelfLife = this.randomInt(30, 3650);
      }
      if (this.rand() > 0.9) {
        record.discontinuedDate = this.generateDate(180);
      }

      records.push(record);
      totalChars += JSON.stringify(record).length;
      recordIndex++;
    }

    const metadata = {
      characterCount: totalChars,
      density,
      fieldCount: Object.keys(records[0] || {}).length,
      recordCount: records.length,
      generatedAt: new Date().toISOString(),
      description: `Product catalog with ${records.length} items, ${totalChars} characters, ${density}% data density`,
    };

    return { metadata, records };
  }

  private generateProductName(): string {
    const prefixes = ["Premium", "Professional", "Industrial", "Basic", "Heavy-Duty", "Compact", "Deluxe", "Standard"];
    const types = [
      "Wrench",
      "Drill",
      "Pump",
      "Motor",
      "Compressor",
      "Generator",
      "Controller",
      "Sensor",
      "Valve",
      "Switch",
      "Connector",
      "Cable",
    ];
    const suffix = this.randomInt(100, 9999);

    return `${this.getRandomItem(prefixes)} ${this.getRandomItem(types)} ${suffix}`;
  }

  private generateDescription(): string {
    const descriptions = [
      "High-quality product with excellent durability and performance characteristics. Suitable for professional and industrial applications.",
      "Engineered for reliability with precision manufacturing. Features advanced design for optimal functionality.",
      "Designed for efficiency and long-term reliability. Built with premium materials and strict quality control.",
      "Professional-grade equipment meeting international standards. Extensively tested for performance and safety.",
      "Robust and versatile solution for demanding applications. Features enhanced capabilities and extended lifespan.",
    ];
    return this.getRandomItem(descriptions);
  }
}

export function generateBaseData(targetCharCount: number = 60000, density: DataDensity = 100): BaseDataSet {
  const generator = new BaseModelGenerator();
  return generator.generate(targetCharCount, density);
}
