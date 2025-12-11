#!/usr/bin/env node

/**
 * Test data generation script (JavaScript version)
 * Generates all test data, questionnaires, and answer templates
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// BASE MODEL GENERATOR
// ============================================================================

class BaseModelGenerator {
  constructor(seed = 12345) {
    this.seed = seed;
    this.rand = this.seededRandom(seed);
  }

  seededRandom(seed) {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }

  getRandomItem(arr) {
    return arr[Math.floor(this.rand() * arr.length)];
  }

  randomInt(min, max) {
    return Math.floor(this.rand() * (max - min + 1)) + min;
  }

  randomFloat(min, max, decimals = 2) {
    return Math.round((this.rand() * (max - min) + min) * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  generateDate(daysAgo = 365) {
    const date = new Date();
    date.setDate(date.getDate() - this.randomInt(0, daysAgo));
    return date.toISOString().split('T')[0];
  }

  generateSKU(index) {
    const categories = ['ELEC', 'OFFI', 'INDU', 'TOOL', 'MATE'];
    const category = categories[index % categories.length];
    return `${category}-${String(index).padStart(6, '0')}`;
  }

  generateDimensions() {
    const w = this.randomInt(5, 200);
    const h = this.randomInt(5, 200);
    const d = this.randomInt(5, 200);
    return `${w}x${h}x${d}cm`;
  }

  generateProductName() {
    const prefixes = ['Premium', 'Professional', 'Industrial', 'Basic', 'Heavy-Duty', 'Compact'];
    const types = ['Wrench', 'Drill', 'Pump', 'Motor', 'Compressor', 'Generator'];
    const suffix = this.randomInt(100, 9999);
    return `${this.getRandomItem(prefixes)} ${this.getRandomItem(types)} ${suffix}`;
  }

  generateDescription() {
    const descriptions = [
      'High-quality product with excellent durability.',
      'Engineered for reliability with precision manufacturing.',
      'Professional-grade equipment meeting international standards.',
      'Robust and versatile solution for demanding applications.',
      'Built with premium materials and strict quality control.',
    ];
    return this.getRandomItem(descriptions);
  }

  generate(targetCharCount = 60000) {
    const categories = ['Electronics', 'Office Supplies', 'Industrial Equipment', 'Tools', 'Materials'];
    const suppliers = ['Global Supply Co', 'Premier Parts Ltd', 'Industrial Solutions Inc', 'Tech Components'];
    const locations = ['New York, USA', 'Shanghai, China', 'Singapore', 'Rotterdam, Netherlands'];

    const records = [];
    let totalChars = 0;
    let recordIndex = 0;
    const estimatedRecordSize = 500;
    const estimatedRecordCount = Math.ceil(targetCharCount / estimatedRecordSize);

    while (totalChars < targetCharCount && recordIndex < estimatedRecordCount * 1.5) {
      const record = {
        productId: `PROD-${String(recordIndex + 1).padStart(6, '0')}`,
        productName: this.generateProductName(),
        category: this.getRandomItem(categories),
        price: this.randomFloat(10, 5000, 2),
        costPrice: this.randomFloat(5, 2500, 2),
        stockQuantity: this.randomInt(0, 10000),
        reorderPoint: this.randomInt(10, 500),
        lastRestocked: this.generateDate(90),
        supplierName: this.getRandomItem(suppliers),
        supplierLocation: this.getRandomItem(locations),
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

      if (this.rand() > 0.3) record.avgRating = this.randomFloat(1, 5, 1);
      if (this.rand() > 0.6) record.shelfLife = this.randomInt(30, 3650);
      if (this.rand() > 0.9) record.discontinuedDate = this.generateDate(180);

      records.push(record);
      totalChars += JSON.stringify(record).length;
      recordIndex++;
    }

    return {
      metadata: {
        characterCount: totalChars,
        density: 100,
        fieldCount: Object.keys(records[0]).length,
        recordCount: records.length,
        generatedAt: new Date().toISOString(),
        description: `Product catalog with ${records.length} items, ${totalChars} chars`,
      },
      records,
    };
  }
}

// ============================================================================
// DENSITY VARIANTS
// ============================================================================

function create50PercentVariant(fullData) {
  const optionalFields = new Set([
    'avgRating', 'shelfLife', 'discontinuedDate', 'description',
    'supplierLocation', 'manufacturerCode', 'warehouseLocation', 'dimensions'
  ]);

  const rand = (seed) => {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  };

  const variantRecords = fullData.records.map((record, index) => {
    const variant = { ...record };
    const randFunc = rand(12345 + index);

    for (const field of optionalFields) {
      if (field in record && randFunc() > 0.5) {
        delete variant[field];
      }
    }

    return variant;
  });

  const newCharCount = variantRecords.reduce((sum, r) => sum + JSON.stringify(r).length, 0);

  return {
    metadata: {
      ...fullData.metadata,
      density: 50,
      characterCount: newCharCount,
      description: `Product catalog with ${variantRecords.length} items, ${newCharCount} chars, 50% density`,
    },
    records: variantRecords,
  };
}

// ============================================================================
// FORMAT CONVERTERS
// ============================================================================

function convertToCsv(data) {
  const allFields = new Set();
  data.records.forEach(r => Object.keys(r).forEach(k => allFields.add(k)));
  const headers = Array.from(allFields).sort();

  const lines = [headers.map(h => h).join(',')];

  for (const record of data.records) {
    const row = headers.map(field => {
      const value = record[field];
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

function convertToJsonCompact(data) {
  return JSON.stringify({ records: data.records });
}

function convertToJsonPretty(data) {
  return JSON.stringify({ records: data.records }, null, 2);
}

function convertToMarkdown(data) {
  const lines = [
    '# Product Catalog',
    '',
    `Total Products: ${data.records.length}`,
    `Last Updated: ${data.metadata.generatedAt}`,
    `Data Density: ${data.metadata.density}%`,
    ''
  ];

  const byCategory = new Map();
  for (const record of data.records) {
    const cat = String(record.category || 'Uncategorized');
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(record);
  }

  for (const [category, records] of byCategory) {
    lines.push(`## ${category}`);
    lines.push('');

    if (records.length > 0) {
      const fields = Object.keys(records[0]).filter(f => records[0][f] !== null && records[0][f] !== undefined).slice(0, 10);
      lines.push(`| ${fields.join(' | ')} |`);
      lines.push(`| ${fields.map(() => '---').join(' | ')} |`);

      for (const record of records.slice(0, 100)) {
        const values = fields.map(field => {
          const value = record[field];
          if (value === null || value === undefined) return '-';
          const str = String(value);
          return str.length > 30 ? str.substring(0, 27) + '...' : str;
        });
        lines.push(`| ${values.join(' | ')} |`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

function convertToYaml(data) {
  const lines = [
    'metadata:',
    `  characterCount: ${data.metadata.characterCount}`,
    `  density: ${data.metadata.density}`,
    `  fieldCount: ${data.metadata.fieldCount}`,
    `  recordCount: ${data.metadata.recordCount}`,
    `  generatedAt: "${data.metadata.generatedAt}"`,
    '',
    'products:'
  ];

  for (const record of data.records) {
    lines.push('  - product:');
    for (const [key, value] of Object.entries(record)) {
      let yamlValue;
      if (value === null || value === undefined) yamlValue = 'null';
      else if (typeof value === 'string') {
        if (value.includes(':') || value.includes('\n') || value.includes('"')) {
          yamlValue = `"${value.replace(/"/g, '\\"')}"`;
        } else {
          yamlValue = value;
        }
      } else if (typeof value === 'boolean') {
        yamlValue = value ? 'true' : 'false';
      } else {
        yamlValue = String(value);
      }
      lines.push(`      ${key}: ${yamlValue}`);
    }
  }

  return lines.join('\n');
}

function convertToApacheLogs(data) {
  const hashToIp = (input) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash = hash & hash;
    }
    const octets = [
      Math.abs(hash % 256),
      Math.abs(Math.floor(hash / 256) % 256),
      Math.abs(Math.floor(hash / 65536) % 256),
      Math.abs(Math.floor(hash / 16777216) % 256),
    ];
    return octets.join('.');
  };

  const formatApacheTimestamp = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}:${hours}:${minutes}:${seconds} +0000`;
  };

  const lines = data.records.map(record => {
    const ip = record.supplierLocation ? hashToIp(String(record.supplierLocation)) : '192.168.1.1';
    const user = record.productName ? String(record.productName).substring(0, 10) : '-';
    const timestamp = formatApacheTimestamp(String(record.lastRestocked || new Date().toISOString()));
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    let hash = 0;
    for (let i = 0; i < String(record.category).length; i++) hash += String(record.category).charCodeAt(i);
    const method = methods[hash % methods.length];
    const path = `/api/products/${record.productId}`;
    const protocol = 'HTTP/1.1';
    const status = (record.stockQuantity > 1000) ? 200 : (record.stockQuantity > 0) ? 206 : 404;
    const bytes = Math.round((record.weight || 0) * 1024);
    const referer = `https://example.com/category/${record.category}`;
    const userAgent = 'Mozilla/5.0 (Benchmarking)';

    return `${ip} - ${user} [${timestamp}] "${method} ${path} ${protocol}" ${status} ${bytes} "${referer}" "${userAgent}"`;
  });

  return lines.join('\n');
}

// ============================================================================
// QUESTIONNAIRE GENERATOR
// ============================================================================

function generateQuestionnaire(data, format, density) {
  const records = data.records;
  const questions = [];
  let id = 1;

  // Field retrieval (30 questions - 30%)
  for (let i = 0; i < Math.min(30, records.length); i++) {
    const record = records[i];
    const fields = Object.keys(record).filter(f => record[f] !== null && record[f] !== undefined);
    const field = fields[Math.floor(Math.random() * fields.length)];
    const value = record[field];

    if (value !== null && value !== undefined) {
      questions.push({
        id: id++,
        category: 'field_retrieval',
        difficulty: 'easy',
        question: `What is the ${field} of product ${record.productId}?`,
        expectedAnswer: { value: String(value), validationMethod: 'exact' },
        dataReferences: [field, 'productId'],
      });
    }
  }

  // Aggregation (15 questions - 30%)
  const totalStock = records.reduce((sum, r) => sum + Number(r.stockQuantity || 0), 0);
  questions.push({
    id: id++,
    category: 'aggregation',
    difficulty: 'medium',
    question: 'What is the total stock quantity across all products?',
    expectedAnswer: { value: totalStock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['stockQuantity'],
  });

  const avgPrice = records.reduce((sum, r) => sum + Number(r.price || 0), 0) / records.length;
  questions.push({
    id: id++,
    category: 'aggregation',
    difficulty: 'medium',
    question: 'What is the average product price?',
    expectedAnswer: { value: Math.round(avgPrice * 100) / 100, validationMethod: 'numeric', tolerance: 0.01 },
    dataReferences: ['price'],
  });

  const maxPrice = Math.max(...records.map(r => Number(r.price || 0)));
  questions.push({
    id: id++,
    category: 'aggregation',
    difficulty: 'medium',
    question: 'What is the highest product price?',
    expectedAnswer: { value: maxPrice, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price'],
  });

  const totalWeight = records.reduce((sum, r) => sum + Number(r.weight || 0), 0);
  questions.push({
    id: id++,
    category: 'aggregation',
    difficulty: 'medium',
    question: 'What is the total weight of all products combined?',
    expectedAnswer: { value: Math.round(totalWeight * 100) / 100, validationMethod: 'numeric', tolerance: 0.01 },
    dataReferences: ['weight'],
  });

  const avgStock = records.reduce((sum, r) => sum + Number(r.stockQuantity || 0), 0) / records.length;
  questions.push({
    id: id++,
    category: 'aggregation',
    difficulty: 'medium',
    question: 'What is the average stock quantity per product?',
    expectedAnswer: { value: Math.round(avgStock * 100) / 100, validationMethod: 'numeric', tolerance: 0.01 },
    dataReferences: ['stockQuantity'],
  });

  // Add more aggregation questions (25 more = 30 total)
  for (let i = 0; i < 25; i++) {
    const questions_data = [
      { q: 'How many total units have been shipped?', field: 'unitsShipped', agg: 'sum' },
      { q: 'What is the average cost price?', field: 'costPrice', agg: 'avg' },
      { q: 'What is the total cost of all products?', field: 'costPrice', agg: 'sum' },
    ];

    const qd = questions_data[i % questions_data.length];
    const val = qd.agg === 'sum'
      ? records.reduce((sum, r) => sum + Number(r[qd.field] || 0), 0)
      : records.reduce((sum, r) => sum + Number(r[qd.field] || 0), 0) / records.length;

    questions.push({
      id: id++,
      category: 'aggregation',
      difficulty: 'medium',
      question: qd.q,
      expectedAnswer: { value: qd.agg === 'sum' ? val : Math.round(val * 100) / 100, validationMethod: 'numeric', tolerance: 0.01 },
      dataReferences: [qd.field],
    });
  }

  // Filtering (10 questions - 20%)
  const outOfStock = records.filter(r => Number(r.stockQuantity || 0) === 0).length;
  questions.push({
    id: id++,
    category: 'filtering',
    difficulty: 'medium',
    question: 'How many products are currently out of stock?',
    expectedAnswer: { value: outOfStock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['stockQuantity'],
  });

  const hazardous = records.filter(r => r.hazardous === true).length;
  questions.push({
    id: id++,
    category: 'filtering',
    difficulty: 'medium',
    question: 'How many products are marked as hazardous?',
    expectedAnswer: { value: hazardous, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['hazardous'],
  });

  const fragile = records.filter(r => r.fragile === true).length;
  questions.push({
    id: id++,
    category: 'filtering',
    difficulty: 'medium',
    question: 'How many products are marked as fragile?',
    expectedAnswer: { value: fragile, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['fragile'],
  });

  // Add more filtering questions (17 more = 20 total)
  for (let i = 0; i < 17; i++) {
    const filter_data = [
      { q: 'How many products have stock above 5000?', check: r => Number(r.stockQuantity || 0) > 5000 },
      { q: 'How many products have price below $1000?', check: r => Number(r.price || 0) < 1000 },
      { q: 'How many products are in the Electronics category?', check: r => String(r.category) === 'Electronics' },
    ];

    const fd = filter_data[i % filter_data.length];
    const count = records.filter(fd.check).length;

    questions.push({
      id: id++,
      category: 'filtering',
      difficulty: 'medium',
      question: fd.q,
      expectedAnswer: { value: count, validationMethod: 'numeric', tolerance: 0 },
      dataReferences: [],
    });
  }

  // Structure awareness (16 questions - 16%)
  const categories = Array.from(new Set(records.map(r => String(r.category || 'Unknown')))).sort();
  questions.push({
    id: id++,
    category: 'structure_awareness',
    difficulty: 'medium',
    question: 'List all unique product categories in the dataset',
    expectedAnswer: { value: categories, validationMethod: 'array_set' },
    dataReferences: ['category'],
  });

  const suppliers = Array.from(new Set(records.map(r => String(r.supplierName || 'Unknown')))).sort();
  questions.push({
    id: id++,
    category: 'structure_awareness',
    difficulty: 'medium',
    question: 'How many unique suppliers are in the dataset?',
    expectedAnswer: { value: suppliers.length, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['supplierName'],
  });

  const catCount = categories.length;
  questions.push({
    id: id++,
    category: 'structure_awareness',
    difficulty: 'medium',
    question: 'How many distinct product categories exist?',
    expectedAnswer: { value: catCount, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['category'],
  });

  // Add more structure questions (13 more = 16 total)
  for (let i = 0; i < 13; i++) {
    const struct_data = [
      { q: 'List all unique warehouse locations', field: 'warehouseLocation' },
      { q: 'How many distinct manufacturer codes are there?', field: 'manufacturerCode' },
    ];

    const sd = struct_data[i % struct_data.length];
    const values = Array.from(new Set(records.map(r => String(r[sd.field] || 'Unknown')))).sort();

    questions.push({
      id: id++,
      category: 'structure_awareness',
      difficulty: 'medium',
      question: sd.q.includes('How many') ? sd.q : sd.q,
      expectedAnswer: {
        value: sd.q.includes('How many') ? values.length : values,
        validationMethod: sd.q.includes('How many') ? 'numeric' : 'array_set'
      },
      dataReferences: [sd.field],
    });
  }

  // Deduction (4 questions - 4%)
  const supplierCounts = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    supplierCounts.set(supplier, (supplierCounts.get(supplier) || 0) + 1);
  });
  const topSupplier = Array.from(supplierCounts.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  questions.push({
    id: id++,
    category: 'deduction',
    difficulty: 'hard',
    question: `Which supplier supplies the most products?`,
    expectedAnswer: {
      value: `${topSupplier} with ${supplierCounts.get(topSupplier)} products`,
      validationMethod: 'fuzzy_deduction',
      keywords: [topSupplier, String(supplierCounts.get(topSupplier))],
    },
    dataReferences: ['supplierName'],
    requiresManualReview: true,
  });

  const catStockMap = new Map();
  records.forEach(r => {
    const cat = String(r.category || 'Unknown');
    catStockMap.set(cat, (catStockMap.get(cat) || 0) + Number(r.stockQuantity || 0));
  });
  const maxStockCat = Array.from(catStockMap.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  questions.push({
    id: id++,
    category: 'deduction',
    difficulty: 'hard',
    question: `Which category has the highest total stock quantity?`,
    expectedAnswer: {
      value: `${maxStockCat} with ${maxStockCat[1]} total units`,
      validationMethod: 'fuzzy_deduction',
      keywords: [maxStockCat[0], String(maxStockCat[1])],
    },
    dataReferences: ['category', 'stockQuantity'],
    requiresManualReview: true,
  });

  const costBySupplier = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    costBySupplier.set(supplier, (costBySupplier.get(supplier) || 0) + Number(r.costPrice || 0));
  });
  const maxCostSupplier = Array.from(costBySupplier.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  questions.push({
    id: id++,
    category: 'deduction',
    difficulty: 'hard',
    question: `Which supplier has the highest total cost value?`,
    expectedAnswer: {
      value: `${maxCostSupplier[0]} with ${Math.round(maxCostSupplier[1] * 100) / 100} total cost`,
      validationMethod: 'fuzzy_deduction',
      keywords: [maxCostSupplier[0]],
    },
    dataReferences: ['supplierName', 'costPrice'],
    requiresManualReview: true,
  });

  const avgPriceByCategory = new Map();
  const priceSumByCategory = new Map();
  const countByCategory = new Map();
  records.forEach(r => {
    const cat = String(r.category || 'Unknown');
    priceSumByCategory.set(cat, (priceSumByCategory.get(cat) || 0) + Number(r.price || 0));
    countByCategory.set(cat, (countByCategory.get(cat) || 0) + 1);
  });
  for (const [cat, sum] of priceSumByCategory.entries()) {
    avgPriceByCategory.set(cat, sum / countByCategory.get(cat));
  }
  const maxAvgPriceCat = Array.from(avgPriceByCategory.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  questions.push({
    id: id++,
    category: 'deduction',
    difficulty: 'hard',
    question: `Which category has the highest average product price?`,
    expectedAnswer: {
      value: `${maxAvgPriceCat[0]} with average price ${Math.round(maxAvgPriceCat[1] * 100) / 100}`,
      validationMethod: 'fuzzy_deduction',
      keywords: [maxAvgPriceCat[0]],
    },
    dataReferences: ['category', 'price'],
    requiresManualReview: true,
  });

  // ============================================================================
  // HARD QUESTIONS (20) - Multi-step reasoning, edge cases, complex deduction
  // ============================================================================

  // Multi-step Reasoning (5 questions)
  const productsAboveAvgPrice = records.filter(r => Number(r.price || 0) > avgPrice);
  const highPriceOutOfStock = productsAboveAvgPrice.filter(r => Number(r.stockQuantity || 0) === 0).length;
  questions.push({
    id: id++,
    category: 'multi_step_reasoning',
    difficulty: 'hard',
    question: `How many products are both above average price AND currently out of stock?`,
    expectedAnswer: { value: highPriceOutOfStock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price', 'stockQuantity'],
  });

  const electronicsCategory = records.filter(r => String(r.category) === 'Electronics');
  const electronicsAboveAvgStock = electronicsCategory.filter(r => Number(r.stockQuantity || 0) > avgStock).length;
  questions.push({
    id: id++,
    category: 'multi_step_reasoning',
    difficulty: 'hard',
    question: `In the Electronics category, how many products have above-average stock levels?`,
    expectedAnswer: { value: electronicsAboveAvgStock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['category', 'stockQuantity'],
  });

  const profitableProducts = records.filter(r => Number(r.price || 0) > Number(r.costPrice || 0));
  const profitableAndFragile = profitableProducts.filter(r => r.fragile === true).length;
  questions.push({
    id: id++,
    category: 'multi_step_reasoning',
    difficulty: 'hard',
    question: `How many products have a profit margin (price > cost) AND are marked fragile?`,
    expectedAnswer: { value: profitableAndFragile, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price', 'costPrice', 'fragile'],
  });

  const totalMargin = records.reduce((sum, r) => sum + Math.max(0, Number(r.price || 0) - Number(r.costPrice || 0)), 0);
  const avgMargin = totalMargin / records.length;
  const highMarginProducts = records.filter(r => (Number(r.price || 0) - Number(r.costPrice || 0)) > avgMargin).length;
  questions.push({
    id: id++,
    category: 'multi_step_reasoning',
    difficulty: 'hard',
    question: `How many products have above-average profit margins?`,
    expectedAnswer: { value: highMarginProducts, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price', 'costPrice'],
  });

  const supplierWithMostFragile = new Map();
  records.forEach(r => {
    if (r.fragile === true) {
      const supplier = String(r.supplierName || 'Unknown');
      supplierWithMostFragile.set(supplier, (supplierWithMostFragile.get(supplier) || 0) + 1);
    }
  });
  const topFragileSupplier = supplierWithMostFragile.size > 0
    ? Array.from(supplierWithMostFragile.entries()).reduce((a, b) => b[1] > a[1] ? b : a)
    : ['None', 0];
  questions.push({
    id: id++,
    category: 'multi_step_reasoning',
    difficulty: 'hard',
    question: `Which supplier provides the most fragile products?`,
    expectedAnswer: {
      value: `${topFragileSupplier[0]} with ${topFragileSupplier[1]} fragile products`,
      validationMethod: 'fuzzy_deduction',
      keywords: [topFragileSupplier[0], String(topFragileSupplier[1])],
    },
    dataReferences: ['supplierName', 'fragile'],
    requiresManualReview: true,
  });

  // Edge Cases & Corner Cases (5 questions)
  const zeroStockProducts = records.filter(r => Number(r.stockQuantity || 0) === 0);
  questions.push({
    id: id++,
    category: 'edge_case',
    difficulty: 'hard',
    question: `If we removed all out-of-stock products, what would be the new average stock quantity?`,
    expectedAnswer: {
      value: zeroStockProducts.length > 0
        ? Math.round((records.filter(r => Number(r.stockQuantity || 0) > 0).reduce((sum, r) => sum + Number(r.stockQuantity || 0), 0) / (records.length - zeroStockProducts.length)) * 100) / 100
        : avgStock,
      validationMethod: 'numeric',
      tolerance: 0.1
    },
    dataReferences: ['stockQuantity'],
  });

  const discontinuedProducts = records.filter(r => r.discontinuedDate !== undefined && r.discontinuedDate !== null);
  questions.push({
    id: id++,
    category: 'edge_case',
    difficulty: 'hard',
    question: `What percentage of products have been discontinued?`,
    expectedAnswer: {
      value: Math.round((discontinuedProducts.length / records.length) * 10000) / 100,
      validationMethod: 'numeric',
      tolerance: 0.1
    },
    dataReferences: ['discontinuedDate'],
  });

  const uniqueCategories = Array.from(new Set(records.map(r => String(r.category || 'Unknown'))));
  const categoryCounts = new Map();
  uniqueCategories.forEach(cat => {
    categoryCounts.set(cat, records.filter(r => String(r.category) === cat).length);
  });
  const minCategorySize = Math.min(...Array.from(categoryCounts.values()));
  const smallestCategories = Array.from(categoryCounts.entries()).filter(([_, count]) => count === minCategorySize).map(([cat]) => cat);
  questions.push({
    id: id++,
    category: 'edge_case',
    difficulty: 'hard',
    question: `Which category has the fewest products?`,
    expectedAnswer: {
      value: smallestCategories.length === 1 ? smallestCategories[0] : smallestCategories.join(','),
      validationMethod: 'fuzzy_deduction',
      keywords: smallestCategories,
    },
    dataReferences: ['category'],
    requiresManualReview: true,
  });

  const noRatingProducts = records.filter(r => r.avgRating === undefined || r.avgRating === null).length;
  questions.push({
    id: id++,
    category: 'edge_case',
    difficulty: 'hard',
    question: `How many products lack rating information?`,
    expectedAnswer: { value: noRatingProducts, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['avgRating'],
  });

  const hazardousAndFragile = records.filter(r => r.hazardous === true && r.fragile === true).length;
  questions.push({
    id: id++,
    category: 'edge_case',
    difficulty: 'hard',
    question: `How many products are both hazardous AND fragile (highest risk)?`,
    expectedAnswer: { value: hazardousAndFragile, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['hazardous', 'fragile'],
  });

  // Complex Deduction (5 questions)
  const priceByCategory = new Map();
  records.forEach(r => {
    const cat = String(r.category || 'Unknown');
    if (!priceByCategory.has(cat)) priceByCategory.set(cat, []);
    priceByCategory.get(cat).push(Number(r.price || 0));
  });

  const priceVariation = new Map();
  for (const [cat, prices] of priceByCategory.entries()) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    priceVariation.set(cat, Math.sqrt(variance));
  }
  const mostConsistentCategory = Array.from(priceVariation.entries()).reduce((a, b) => b[1] < a[1] ? b : a)[0];
  questions.push({
    id: id++,
    category: 'complex_deduction',
    difficulty: 'hard',
    question: `Which category has the most consistent pricing (lowest price variance)?`,
    expectedAnswer: {
      value: mostConsistentCategory,
      validationMethod: 'fuzzy_deduction',
      keywords: [mostConsistentCategory],
    },
    dataReferences: ['category', 'price'],
    requiresManualReview: true,
  });

  const weightPerUnit = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    if (!weightPerUnit.has(supplier)) {
      weightPerUnit.set(supplier, { totalWeight: 0, totalUnits: 0 });
    }
    const data = weightPerUnit.get(supplier);
    data.totalWeight += Number(r.weight || 0);
    data.totalUnits += Number(r.unitsShipped || 0);
  });

  const bestEfficiencySupplier = Array.from(weightPerUnit.entries())
    .filter(([_, data]) => data.totalUnits > 0)
    .map(([supplier, data]) => [supplier, data.totalWeight / data.totalUnits])
    .reduce((a, b) => b[1] < a[1] ? b : a, ['None', Infinity])[0];

  questions.push({
    id: id++,
    category: 'complex_deduction',
    difficulty: 'hard',
    question: `Which supplier offers the best weight-to-shipment ratio (lightest per unit shipped)?`,
    expectedAnswer: {
      value: bestEfficiencySupplier,
      validationMethod: 'fuzzy_deduction',
      keywords: [bestEfficiencySupplier],
    },
    dataReferences: ['supplierName', 'weight', 'unitsShipped'],
    requiresManualReview: true,
  });

  const costEfficiency = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    if (!costEfficiency.has(supplier)) costEfficiency.set(supplier, 0);
    costEfficiency.set(supplier, costEfficiency.get(supplier) + Number(r.costPrice || 0));
  });
  const cheapestSupplier = Array.from(costEfficiency.entries()).reduce((a, b) => b[1] < a[1] ? b : a)[0];
  questions.push({
    id: id++,
    category: 'complex_deduction',
    difficulty: 'hard',
    question: `Which supplier has the lowest total cost value across all products?`,
    expectedAnswer: {
      value: cheapestSupplier,
      validationMethod: 'fuzzy_deduction',
      keywords: [cheapestSupplier],
    },
    dataReferences: ['supplierName', 'costPrice'],
    requiresManualReview: true,
  });

  const overpriced = records.filter(r => {
    const margin = Number(r.price || 0) - Number(r.costPrice || 0);
    return margin > avgMargin * 1.5;
  }).length;
  questions.push({
    id: id++,
    category: 'complex_deduction',
    difficulty: 'hard',
    question: `How many products are significantly overpriced (>150% of average margin)?`,
    expectedAnswer: { value: overpriced, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price', 'costPrice'],
  });

  const categoryDiversity = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    const cat = String(r.category || 'Unknown');
    if (!categoryDiversity.has(supplier)) categoryDiversity.set(supplier, new Set());
    categoryDiversity.get(supplier).add(cat);
  });
  const mostSpecializedSupplier = Array.from(categoryDiversity.entries()).reduce((a, b) => b[1].size < a[1].size ? b : a)[0];
  questions.push({
    id: id++,
    category: 'complex_deduction',
    difficulty: 'hard',
    question: `Which supplier has the narrowest product range (fewest categories)?`,
    expectedAnswer: {
      value: mostSpecializedSupplier,
      validationMethod: 'fuzzy_deduction',
      keywords: [mostSpecializedSupplier],
    },
    dataReferences: ['supplierName', 'category'],
    requiresManualReview: true,
  });

  // Hypothetical Reasoning (5 questions)
  const totalCostValue = records.reduce((sum, r) => sum + Number(r.costPrice || 0), 0);
  const discontinuedCost = discontinuedProducts.reduce((sum, r) => sum + Number(r.costPrice || 0), 0);
  questions.push({
    id: id++,
    category: 'hypothetical',
    difficulty: 'hard',
    question: `If we removed all discontinued products, what would be the new total cost value?`,
    expectedAnswer: {
      value: Math.round((totalCostValue - discontinuedCost) * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['discontinuedDate', 'costPrice'],
  });
  questions.push({
    id: id++,
    category: 'hypothetical',
    difficulty: 'hard',
    question: `If product prices increased by 10%, what would be the new average price?`,
    expectedAnswer: {
      value: Math.round(avgPrice * 1.1 * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['price'],
  });

  const hazardousProducts = records.filter(r => r.hazardous === true);
  const hazardousWeight = hazardousProducts.reduce((sum, r) => sum + Number(r.weight || 0), 0);
  questions.push({
    id: id++,
    category: 'hypothetical',
    difficulty: 'hard',
    question: `If we tripled the weight of all hazardous products, what would be the new total weight?`,
    expectedAnswer: {
      value: Math.round((totalWeight - hazardousWeight + hazardousWeight * 3) * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['hazardous', 'weight'],
  });

  const currentStockValue = records.reduce((sum, r) => sum + (Number(r.stockQuantity || 0) * Number(r.costPrice || 0)), 0);
  questions.push({
    id: id++,
    category: 'hypothetical',
    difficulty: 'hard',
    question: `What is the total inventory value (stock quantity × cost price)?`,
    expectedAnswer: {
      value: Math.round(currentStockValue * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['stockQuantity', 'costPrice'],
  });

  const reorderNeeded = records.filter(r => Number(r.stockQuantity || 0) < Number(r.reorderPoint || 0)).length;
  questions.push({
    id: id++,
    category: 'hypothetical',
    difficulty: 'hard',
    question: `How many products are below their reorder point?`,
    expectedAnswer: { value: reorderNeeded, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['stockQuantity', 'reorderPoint'],
  });

  // ============================================================================
  // ADVANCED ANALYTICAL QUESTIONS (15) - Correlation, efficiency, ranking, risk
  // ============================================================================

  // Correlation & Relationship Analysis (3 questions)
  const ratedProducts = records.filter(r => r.avgRating !== undefined && r.avgRating !== null);
  const avgRatingOfHighPriceProducts = ratedProducts
    .filter(r => Number(r.price || 0) > avgPrice)
    .reduce((sum, r) => sum + Number(r.avgRating || 0), 0) / Math.max(1, ratedProducts.filter(r => Number(r.price || 0) > avgPrice).length);
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `What is the average rating of products above the average price?`,
    expectedAnswer: {
      value: Math.round(avgRatingOfHighPriceProducts * 10) / 10,
      validationMethod: 'numeric',
      tolerance: 0.1
    },
    dataReferences: ['price', 'avgRating'],
  });

  const profitByCategory = new Map();
  records.forEach(r => {
    const cat = String(r.category || 'Unknown');
    const profit = Number(r.price || 0) - Number(r.costPrice || 0);
    if (!profitByCategory.has(cat)) profitByCategory.set(cat, []);
    profitByCategory.get(cat).push(profit);
  });
  const categoryProfitMargin = new Map();
  for (const [cat, profits] of profitByCategory.entries()) {
    const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
    const totalRevenue = records.filter(r => String(r.category) === cat).reduce((sum, r) => sum + Number(r.price || 0), 0);
    categoryProfitMargin.set(cat, totalRevenue > 0 ? (avgProfit / (totalRevenue / records.filter(r => String(r.category) === cat).length)) * 100 : 0);
  }
  const bestProfitMarginCat = Array.from(categoryProfitMargin.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `Which category has the highest profit margin ratio (profit/price)?`,
    expectedAnswer: {
      value: bestProfitMarginCat,
      validationMethod: 'fuzzy_deduction',
      keywords: [bestProfitMarginCat],
    },
    dataReferences: ['category', 'price', 'costPrice'],
    requiresManualReview: true,
  });

  const stockTurnover = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    const shipped = Number(r.unitsShipped || 0);
    const stock = Number(r.stockQuantity || 0);
    const turnover = stock > 0 ? shipped / stock : 0;
    if (!stockTurnover.has(supplier)) stockTurnover.set(supplier, []);
    stockTurnover.get(supplier).push(turnover);
  });
  const suppliersWithHighTurnover = Array.from(stockTurnover.entries())
    .map(([supplier, turnovers]) => [supplier, turnovers.reduce((a, b) => a + b, 0) / turnovers.length])
    .filter(([_, avg]) => avg > 100);
  const turnoverCount = suppliersWithHighTurnover.length;
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `How many suppliers have average stock turnover above 100?`,
    expectedAnswer: { value: turnoverCount, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['supplierName', 'unitsShipped', 'stockQuantity'],
  });

  // Risk & Opportunity Analysis (4 questions)
  const overStockProducts = records.filter(r => Number(r.stockQuantity || 0) > Number(r.reorderPoint || 0) * 5).length;
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `How many products are significantly overstocked (>5x reorder point)?`,
    expectedAnswer: { value: overStockProducts, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['stockQuantity', 'reorderPoint'],
  });

  const riskProducts = records.filter(r =>
    r.hazardous === true || r.fragile === true || Number(r.stockQuantity || 0) === 0 ||
    (Number(r.price || 0) - Number(r.costPrice || 0)) < 0
  ).length;
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `How many products have at least one risk factor (hazardous, fragile, out of stock, or loss-making)?`,
    expectedAnswer: { value: riskProducts, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['hazardous', 'fragile', 'stockQuantity', 'price', 'costPrice'],
  });

  const highValueLowStockProducts = records.filter(r =>
    Number(r.price || 0) > avgPrice * 1.5 && Number(r.stockQuantity || 0) < avgStock * 0.5
  ).length;
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `How many high-value products (>150% avg price) have critically low stock (<50% avg)?`,
    expectedAnswer: { value: highValueLowStockProducts, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price', 'stockQuantity'],
  });

  const lastRestockedDates = records.filter(r => r.lastRestocked).map(r => String(r.lastRestocked)).sort();
  const oldestRestock = lastRestockedDates.length > 0 ? lastRestockedDates[0] : 'Unknown';
  const productsWithOldRestock = records.filter(r => String(r.lastRestocked || '') === oldestRestock).length;
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `How many products have the oldest restock date?`,
    expectedAnswer: { value: productsWithOldRestock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['lastRestocked'],
  });

  // Ranking & Pareto Analysis (4 questions)
  const productsByMargin = records
    .map(r => ({
      product: String(r.productId),
      margin: Number(r.price || 0) - Number(r.costPrice || 0),
      stock: Number(r.stockQuantity || 0)
    }))
    .sort((a, b) => b.margin - a.margin);
  const top20Percent = Math.ceil(records.length * 0.2);
  const top20ProfitMargin = productsByMargin.slice(0, top20Percent).reduce((sum, p) => sum + p.margin, 0);
  const totalProfitMargin = productsByMargin.reduce((sum, p) => sum + p.margin, 0);
  const pareto20Percent = totalProfitMargin > 0 ? (top20ProfitMargin / totalProfitMargin) * 100 : 0;
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `What percentage of total profit margin comes from the top 20% of products?`,
    expectedAnswer: {
      value: Math.round(pareto20Percent * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.1
    },
    dataReferences: ['price', 'costPrice'],
  });

  const supplierReliability = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    const hasStock = Number(r.stockQuantity || 0) > 0;
    if (!supplierReliability.has(supplier)) supplierReliability.set(supplier, { total: 0, inStock: 0 });
    const data = supplierReliability.get(supplier);
    data.total++;
    if (hasStock) data.inStock++;
  });
  const mostReliableSupplier = Array.from(supplierReliability.entries())
    .map(([supplier, data]) => [supplier, data.inStock / data.total])
    .reduce((a, b) => b[1] > a[1] ? b : a)[0];
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `Which supplier has the highest in-stock reliability (% of products in stock)?`,
    expectedAnswer: {
      value: mostReliableSupplier,
      validationMethod: 'fuzzy_deduction',
      keywords: [mostReliableSupplier],
    },
    dataReferences: ['supplierName', 'stockQuantity'],
    requiresManualReview: true,
  });

  const suppliersRankedByCount = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    suppliersRankedByCount.set(supplier, (suppliersRankedByCount.get(supplier) || 0) + 1);
  });
  const suppliersRanked = Array.from(suppliersRankedByCount.entries()).sort((a, b) => b[1] - a[1]);
  const thirdPlaceSupplier = suppliersRanked.length >= 3 ? suppliersRanked[2][0] : 'N/A';
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `Which supplier ranks third by number of products supplied?`,
    expectedAnswer: {
      value: thirdPlaceSupplier,
      validationMethod: 'fuzzy_deduction',
      keywords: [thirdPlaceSupplier],
    },
    dataReferences: ['supplierName'],
    requiresManualReview: true,
  });

  // Efficiency & Performance Metrics (4 questions)
  const costPerUnitShipped = new Map();
  records.forEach(r => {
    const supplier = String(r.supplierName || 'Unknown');
    const cost = Number(r.costPrice || 0);
    const units = Math.max(1, Number(r.unitsShipped || 0));
    const cpus = cost / units;
    if (!costPerUnitShipped.has(supplier)) costPerUnitShipped.set(supplier, []);
    costPerUnitShipped.get(supplier).push(cpus);
  });
  const bestCostPerUnit = Array.from(costPerUnitShipped.entries())
    .map(([supplier, costs]) => [supplier, costs.reduce((a, b) => a + b, 0) / costs.length])
    .reduce((a, b) => b[1] < a[1] ? b : a)[0];
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `Which supplier has the lowest cost per unit shipped?`,
    expectedAnswer: {
      value: bestCostPerUnit,
      validationMethod: 'fuzzy_deduction',
      keywords: [bestCostPerUnit],
    },
    dataReferences: ['supplierName', 'costPrice', 'unitsShipped'],
    requiresManualReview: true,
  });

  const revenuePotential = records.reduce((sum, r) => sum + (Number(r.stockQuantity || 0) * Number(r.price || 0)), 0);
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `What is the total revenue potential if all current stock were sold at current prices?`,
    expectedAnswer: {
      value: Math.round(revenuePotential * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['stockQuantity', 'price'],
  });

  const wasteValue = discontinuedProducts.reduce((sum, r) => sum + (Number(r.stockQuantity || 0) * Number(r.costPrice || 0)), 0);
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `What is the cost value of inventory in discontinued products?`,
    expectedAnswer: {
      value: Math.round(wasteValue * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['discontinuedDate', 'stockQuantity', 'costPrice'],
  });

  const profitPotentialDelta = revenuePotential - (records.reduce((sum, r) => sum + (Number(r.stockQuantity || 0) * Number(r.costPrice || 0)), 0));
  questions.push({
    id: id++,
    category: 'advanced_analysis',
    difficulty: 'very_hard',
    question: `What is the total profit potential margin (revenue - cost) of all current inventory?`,
    expectedAnswer: {
      value: Math.round(profitPotentialDelta * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['stockQuantity', 'price', 'costPrice'],
  });

  // ============================================================================
  // ULTRA HARD QUESTIONS (50) - Statistical, Temporal, Adversarial, Correlation
  // ============================================================================

  // STATISTICAL CALCULATIONS (12 questions)

  // Price variance by category
  const categoryPrices = new Map();
  records.forEach(r => {
    const cat = String(r.category || 'Unknown');
    if (!categoryPrices.has(cat)) categoryPrices.set(cat, []);
    categoryPrices.get(cat).push(Number(r.price || 0));
  });

  const categoryVariances = new Map();
  for (const [cat, prices] of categoryPrices.entries()) {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    categoryVariances.set(cat, { variance, stdDev: Math.sqrt(variance) });
  }
  const mostVolatileCategory = Array.from(categoryVariances.entries()).reduce((a, b) => b[1].variance > a[1].variance ? b : a)[0];

  questions.push({
    id: id++,
    category: 'statistical_analysis',
    difficulty: 'ultra_hard',
    question: `Which product category has the highest price volatility (variance)?`,
    expectedAnswer: {
      value: mostVolatileCategory,
      validationMethod: 'fuzzy_deduction',
      keywords: [mostVolatileCategory],
    },
    dataReferences: ['category', 'price'],
    requiresManualReview: true,
  });

  // Calculate 90th percentile price
  const allPrices = records.map(r => Number(r.price || 0)).sort((a, b) => a - b);
  const p90Price = allPrices[Math.floor(allPrices.length * 0.9)];
  const above90Percentile = records.filter(r => Number(r.price || 0) >= p90Price).length;

  questions.push({
    id: id++,
    category: 'statistical_analysis',
    difficulty: 'ultra_hard',
    question: `How many products are above the 90th percentile in price?`,
    expectedAnswer: { value: above90Percentile, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price'],
  });

  // Stock turnover rate (shipped / stock)
  const turnoverRates = records
    .filter(r => Number(r.stockQuantity || 0) > 0)
    .map(r => Number(r.unitsShipped || 0) / Number(r.stockQuantity || 0));
  const avgTurnoverRate = turnoverRates.reduce((a, b) => a + b, 0) / Math.max(1, turnoverRates.length);
  const aboveAvgTurnover = records.filter(r => {
    const stock = Number(r.stockQuantity || 0);
    return stock > 0 && (Number(r.unitsShipped || 0) / stock) > avgTurnoverRate;
  }).length;

  questions.push({
    id: id++,
    category: 'statistical_analysis',
    difficulty: 'ultra_hard',
    question: `How many products have above-average stock turnover rates?`,
    expectedAnswer: { value: aboveAvgTurnover, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['unitsShipped', 'stockQuantity'],
  });

  // Median cost price
  const allCosts = records.map(r => Number(r.costPrice || 0)).sort((a, b) => a - b);
  const medianCost = allCosts.length % 2 === 0
    ? (allCosts[allCosts.length / 2 - 1] + allCosts[allCosts.length / 2]) / 2
    : allCosts[Math.floor(allCosts.length / 2)];

  questions.push({
    id: id++,
    category: 'statistical_analysis',
    difficulty: 'ultra_hard',
    question: `What is the median cost price across all products?`,
    expectedAnswer: {
      value: Math.round(medianCost * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['costPrice'],
  });

  // Coefficient of variation (std dev / mean) for price
  const avgPriceGlobal = records.reduce((sum, r) => sum + Number(r.price || 0), 0) / records.length;
  const priceMeanDeviation = records.reduce((sum, r) => sum + Math.pow(Number(r.price || 0) - avgPriceGlobal, 2), 0) / records.length;
  const priceStdDev = Math.sqrt(priceMeanDeviation);
  const coeffVariation = (priceStdDev / avgPriceGlobal) * 100;

  questions.push({
    id: id++,
    category: 'statistical_analysis',
    difficulty: 'ultra_hard',
    question: `What is the coefficient of variation (std dev / mean) for product prices as a percentage?`,
    expectedAnswer: {
      value: Math.round(coeffVariation * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.1
    },
    dataReferences: ['price'],
  });

  // 75th percentile stock quantity
  const allStocks = records.map(r => Number(r.stockQuantity || 0)).sort((a, b) => a - b);
  const p75Stock = allStocks[Math.floor(allStocks.length * 0.75)];
  const aboveQ3Stock = records.filter(r => Number(r.stockQuantity || 0) >= p75Stock).length;

  questions.push({
    id: id++,
    category: 'statistical_analysis',
    difficulty: 'ultra_hard',
    question: `How many products are in the top quartile (75th+ percentile) for stock quantity?`,
    expectedAnswer: { value: aboveQ3Stock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['stockQuantity'],
  });

  // Skewness indicator (number of products with price > mean)
  const productsBelowMeanPrice = records.filter(r => Number(r.price || 0) < avgPriceGlobal).length;
  const skewnessRatio = (productsBelowMeanPrice / records.length) * 100;

  questions.push({
    id: id++,
    category: 'statistical_analysis',
    difficulty: 'ultra_hard',
    question: `What percentage of products have below-average pricing?`,
    expectedAnswer: {
      value: Math.round(skewnessRatio * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.1
    },
    dataReferences: ['price'],
  });

  // Cost-price correlation (products where cost > 50% of price)
  const lowMarginProducts = records.filter(r => {
    const price = Number(r.price || 0);
    const cost = Number(r.costPrice || 0);
    return price > 0 && (cost / price) > 0.5;
  }).length;

  questions.push({
    id: id++,
    category: 'statistical_analysis',
    difficulty: 'ultra_hard',
    question: `How many products have a cost that exceeds 50% of selling price (thin margins)?`,
    expectedAnswer: { value: lowMarginProducts, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price', 'costPrice'],
  });

  // TEMPORAL REASONING (10 questions)

  // Days since last restock (from current date)
  const now = new Date();
  const recentlyRestocked = records.filter(r => {
    const restockDate = new Date(String(r.lastRestocked || '2000-01-01'));
    const daysSince = (now - restockDate) / (1000 * 60 * 60 * 24);
    return daysSince < 30;
  }).length;

  questions.push({
    id: id++,
    category: 'temporal_reasoning',
    difficulty: 'ultra_hard',
    question: `How many products have been restocked within the last 30 days?`,
    expectedAnswer: { value: recentlyRestocked, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['lastRestocked'],
  });

  // Oldest products (3+ months without restock)
  const staleProducts = records.filter(r => {
    const restockDate = new Date(String(r.lastRestocked || '2000-01-01'));
    const daysSince = (now - restockDate) / (1000 * 60 * 60 * 24);
    return daysSince > 90;
  }).length;

  questions.push({
    id: id++,
    category: 'temporal_reasoning',
    difficulty: 'ultra_hard',
    question: `How many products have not been restocked in over 90 days?`,
    expectedAnswer: { value: staleProducts, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['lastRestocked'],
  });

  // Restock frequency patterns
  const restockDates = records
    .map(r => new Date(String(r.lastRestocked || '2000-01-01')))
    .sort((a, b) => a - b);
  const avgRestockAge = restockDates.reduce((sum, d) => sum + (now - d), 0) / Math.max(1, restockDates.length) / (1000 * 60 * 60 * 24);

  questions.push({
    id: id++,
    category: 'temporal_reasoning',
    difficulty: 'ultra_hard',
    question: `What is the average age (days) of last restock across all products?`,
    expectedAnswer: {
      value: Math.round(avgRestockAge * 10) / 10,
      validationMethod: 'numeric',
      tolerance: 1
    },
    dataReferences: ['lastRestocked'],
  });

  // CORRELATION & CAUSATION (12 questions)

  // Price-quality correlation
  const ratedHighPrice = ratedProducts.filter(r => Number(r.price || 0) > avgPrice && Number(r.avgRating || 0) >= 4).length;
  const ratedLowPrice = ratedProducts.filter(r => Number(r.price || 0) <= avgPrice && Number(r.avgRating || 0) < 4).length;
  const correlationScore = ((ratedHighPrice + ratedLowPrice) / ratedProducts.length) * 100;

  questions.push({
    id: id++,
    category: 'correlation_analysis',
    difficulty: 'ultra_hard',
    question: `What percentage of rated products show positive price-quality correlation (high price + high rating)?`,
    expectedAnswer: {
      value: Math.round(correlationScore * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.1
    },
    dataReferences: ['price', 'avgRating'],
  });

  // Stock level vs reorder point correlation
  const belowReorderButInStock = records.filter(r => {
    const stock = Number(r.stockQuantity || 0);
    const reorder = Number(r.reorderPoint || 0);
    return stock > 0 && stock < reorder;
  }).length;

  questions.push({
    id: id++,
    category: 'correlation_analysis',
    difficulty: 'ultra_hard',
    question: `How many products are at risk (between 0 and reorder point)?`,
    expectedAnswer: { value: belowReorderButInStock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['stockQuantity', 'reorderPoint'],
  });

  // Category performance (profit-per-unit)
  const categoryProfit = new Map();
  records.forEach(r => {
    const cat = String(r.category || 'Unknown');
    const profit = Number(r.price || 0) - Number(r.costPrice || 0);
    if (!categoryProfit.has(cat)) categoryProfit.set(cat, []);
    categoryProfit.get(cat).push(profit);
  });
  const categoryAvgProfit = new Map();
  for (const [cat, profits] of categoryProfit.entries()) {
    categoryAvgProfit.set(cat, profits.reduce((a, b) => a + b, 0) / profits.length);
  }
  const bestProfitCategory = Array.from(categoryAvgProfit.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  questions.push({
    id: id++,
    category: 'correlation_analysis',
    difficulty: 'ultra_hard',
    question: `Which category yields the highest average profit per unit?`,
    expectedAnswer: {
      value: bestProfitCategory,
      validationMethod: 'fuzzy_deduction',
      keywords: [bestProfitCategory],
    },
    dataReferences: ['category', 'price', 'costPrice'],
    requiresManualReview: true,
  });

  // ADVERSARIAL & IMPOSSIBLE CONDITIONS (10 questions)

  // Products with contradictory flags (hazardous but not properly tracked)
  const hazardousOutOfStock = records.filter(r => r.hazardous === true && Number(r.stockQuantity || 0) === 0).length;

  questions.push({
    id: id++,
    category: 'adversarial',
    difficulty: 'ultra_hard',
    question: `How many hazardous products are currently out of stock (potential safety concern)?`,
    expectedAnswer: { value: hazardousOutOfStock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['hazardous', 'stockQuantity'],
  });

  // Expensive fragile items (high loss risk)
  const expensiveFragile = records.filter(r => r.fragile === true && Number(r.price || 0) > avgPrice * 1.5).length;

  questions.push({
    id: id++,
    category: 'adversarial',
    difficulty: 'ultra_hard',
    question: `How many high-value fragile items (>150% avg price) are at shipping risk?`,
    expectedAnswer: { value: expensiveFragile, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['fragile', 'price'],
  });

  // Discontinued products still in stock (dead inventory)
  const discontinuedInStock = discontinuedProducts.filter(r => Number(r.stockQuantity || 0) > 0).length;
  const deadInventoryValue = discontinuedProducts
    .filter(r => Number(r.stockQuantity || 0) > 0)
    .reduce((sum, r) => sum + (Number(r.stockQuantity || 0) * Number(r.costPrice || 0)), 0);

  questions.push({
    id: id++,
    category: 'adversarial',
    difficulty: 'ultra_hard',
    question: `How many discontinued products still have stock (dead inventory)?`,
    expectedAnswer: { value: discontinuedInStock, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['discontinuedDate', 'stockQuantity'],
  });

  questions.push({
    id: id++,
    category: 'adversarial',
    difficulty: 'ultra_hard',
    question: `What is the total cost value of dead inventory (discontinued but in stock)?`,
    expectedAnswer: {
      value: Math.round(deadInventoryValue * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['discontinuedDate', 'stockQuantity', 'costPrice'],
  });

  // Unprofitable products
  const unprofitable = records.filter(r => Number(r.price || 0) <= Number(r.costPrice || 0)).length;

  questions.push({
    id: id++,
    category: 'adversarial',
    difficulty: 'ultra_hard',
    question: `How many products are priced at or below cost (zero or negative profit)?`,
    expectedAnswer: { value: unprofitable, validationMethod: 'numeric', tolerance: 0 },
    dataReferences: ['price', 'costPrice'],
  });

  // COMPLEX MULTI-STEP AGGREGATIONS (6 questions)

  // Weighted average (value-weighted price)
  const totalValue = records.reduce((sum, r) => sum + (Number(r.stockQuantity || 0) * Number(r.price || 0)), 0);
  const totalUnits = records.reduce((sum, r) => sum + Number(r.stockQuantity || 0), 0);
  const valueWeightedAvgPrice = totalUnits > 0 ? totalValue / totalUnits : 0;

  questions.push({
    id: id++,
    category: 'complex_aggregation',
    difficulty: 'ultra_hard',
    question: `What is the value-weighted average price (total stock value / total units)?`,
    expectedAnswer: {
      value: Math.round(valueWeightedAvgPrice * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.01
    },
    dataReferences: ['stockQuantity', 'price'],
  });

  // Complex supplier ranking (products × margin × reliability)
  const supplierScore = new Map();
  for (const [supplier, data] of supplierReliability.entries()) {
    const supplierProducts = records.filter(r => String(r.supplierName) === supplier);
    const avgMarginForSupplier = supplierProducts.length > 0
      ? supplierProducts.reduce((sum, r) => sum + (Number(r.price || 0) - Number(r.costPrice || 0)), 0) / supplierProducts.length
      : 0;
    const reliability = data.inStock / data.total;
    const score = supplierProducts.length * avgMarginForSupplier * reliability;
    supplierScore.set(supplier, score);
  }
  const topSupplierByComplex = Array.from(supplierScore.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  questions.push({
    id: id++,
    category: 'complex_aggregation',
    difficulty: 'ultra_hard',
    question: `Which supplier ranks highest when combining product count, avg profit margin, and reliability?`,
    expectedAnswer: {
      value: topSupplierByComplex,
      validationMethod: 'fuzzy_deduction',
      keywords: [topSupplierByComplex],
    },
    dataReferences: ['supplierName', 'price', 'costPrice', 'stockQuantity'],
    requiresManualReview: true,
  });

  // Inventory efficiency (revenue potential vs cost)
  const totalRevenuePotential = records.reduce((sum, r) => sum + (Number(r.stockQuantity || 0) * Number(r.price || 0)), 0);
  const totalCostInventory = records.reduce((sum, r) => sum + (Number(r.stockQuantity || 0) * Number(r.costPrice || 0)), 0);
  const inventoryROI = totalCostInventory > 0 ? ((totalRevenuePotential - totalCostInventory) / totalCostInventory) * 100 : 0;

  questions.push({
    id: id++,
    category: 'complex_aggregation',
    difficulty: 'ultra_hard',
    question: `What is the inventory ROI (potential profit / inventory cost) as a percentage?`,
    expectedAnswer: {
      value: Math.round(inventoryROI * 100) / 100,
      validationMethod: 'numeric',
      tolerance: 0.1
    },
    dataReferences: ['stockQuantity', 'price', 'costPrice'],
  });

  // Create two versions: clean questionnaire and answer key
  const cleanedQuestions = questions.map(q => ({
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    question: q.question,
  }));

  const answerKey = questions.map(q => ({
    id: q.id,
    category: q.category,
    expectedAnswer: q.expectedAnswer,
    requiresManualReview: q.requiresManualReview || false,
  }));

  return {
    metadata: {
      format,
      density,
      totalQuestions: cleanedQuestions.length,
      generatedAt: new Date().toISOString(),
      dataFile: `${format}_${density}.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'yaml'}`,
    },
    questions: cleanedQuestions,
    answerKey: answerKey,
  };
}

// ============================================================================
// MAIN ORCHESTRATION
// ============================================================================

function generateAll(outputDir = 'benchmarking') {
  const formats = ['csv', 'json', 'markdown', 'yaml', 'apache'];
  const densities = [100, 50];

  // Per-format target character counts (scaled for efficiency testing)
  const formatTargets = {
    csv: 81000,        // Optimized: 65KB → 42KB (aiming for ~85KB minified JSON)
    json: 80500,       // Adjusted: 80KB → 81KB (aiming for ~69.5KB pretty, ~90KB compact)
    json_pretty: 54000,
    markdown: 65000,   // Increased: 60KB → 65KB (+5KB)
    yaml: 75000,       // Increased: 70KB → 75KB (+5KB)
    apache: 75000      // Increased: 70KB → 75KB (+5KB)
  };

  // Ensure directories exist
  for (const dir of ['data', 'questionnaires', 'answers', 'results', 'subagent_output']) {
    const fullPath = path.join(outputDir, dir);
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('BENCHMARKING FRAMEWORK - TEST DATA GENERATION');
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Generating test data with per-format targets...\n`);

  const datasets = [];

  for (const format of formats) {
    for (const density of densities) {
      const targetCharCount = formatTargets[format];
      console.log(`Generating ${format.toUpperCase()} @ ${density}% density (target: ${(targetCharCount/1000).toFixed(0)}KB)...`);

      // Generate base data
      const generator = new BaseModelGenerator();
      let baseData = generator.generate(targetCharCount);

      // Apply density variant
      const dataToUse = density === 50 ? create50PercentVariant(baseData) : baseData;

      // Convert to format
      let fileContent;
      const fileExt = {
        csv: 'csv', json: 'json', markdown: 'md', yaml: 'yaml', apache: 'log'
      }[format];

      // Special handling for JSON: create both pretty and compact variants
      if (format === 'json') {
        // Compact variant
        const compactContent = convertToJsonCompact(dataToUse);
        const compactFileName = `json_${density}_compact.json`;
        const compactFilePath = path.join(outputDir, 'data', compactFileName);
        fs.writeFileSync(compactFilePath, compactContent);
        console.log(`  ✓ Data (compact): ${compactFileName} (${compactContent.length} chars)`);

        // Pretty variant (generate from smaller dataset to fit token limit)
        const prettyGenerator = new BaseModelGenerator();
        let prettyBaseData = prettyGenerator.generate(formatTargets.json_pretty);
        const prettyDataToUse = density === 50 ? create50PercentVariant(prettyBaseData) : prettyBaseData;
        const prettyContent = convertToJsonPretty(prettyDataToUse);
        const prettyFileName = `json_${density}_pretty.json`;
        const prettyFilePath = path.join(outputDir, 'data', prettyFileName);
        fs.writeFileSync(prettyFilePath, prettyContent);
        console.log(`  ✓ Data (pretty): ${prettyFileName} (${prettyContent.length} chars)`);

        // Generate questionnaire once for both variants (they're the same data)
        const questionnaire = generateQuestionnaire(dataToUse, format, density);
        const questionnaireFileName = `${format}_${density}.json`;
        const questionnairePath = path.join(outputDir, 'questionnaires', questionnaireFileName);

        // Write clean questionnaire (questions only)
        const cleanQuestionnaire = {
          metadata: questionnaire.metadata,
          questions: questionnaire.questions,
        };
        fs.writeFileSync(questionnairePath, JSON.stringify(cleanQuestionnaire)); // Minified JSON

        // Write answer key separately
        const answerKeyFileName = `${format}_${density}_answer_key.json`;
        const answerKeyPath = path.join(outputDir, 'questionnaires', answerKeyFileName);
        const answerKeyFile = {
          metadata: questionnaire.metadata,
          answerKey: questionnaire.answerKey,
        };
        fs.writeFileSync(answerKeyPath, JSON.stringify(answerKeyFile)); // Minified JSON

        console.log(`  ✓ Questionnaire: ${questionnaireFileName} (${questionnaire.questions.length} questions)`);
        console.log(`  ✓ Answer Key: ${answerKeyFileName}`);

        // Generate answer templates for both variants
        const answerTemplate = {
          metadata: {
            format,
            density,
            dataFile: compactFileName,
            questionnaireFile: questionnaireFileName,
          },
          answers: questionnaire.questions.map(q => ({ questionId: q.id, answer: '' })),
        };

        const compactAnswerFileName = `json_${density}_compact_template.json`;
        const compactAnswerPath = path.join(outputDir, 'answers', compactAnswerFileName);
        fs.writeFileSync(compactAnswerPath, JSON.stringify(answerTemplate)); // Minified JSON

        const prettyAnswerFileName = `json_${density}_pretty_template.json`;
        const prettyAnswerPath = path.join(outputDir, 'answers', prettyAnswerFileName);
        fs.writeFileSync(prettyAnswerPath, JSON.stringify(answerTemplate)); // Minified JSON

        console.log(`  ✓ Questionnaire: ${questionnaireFileName} (${questionnaire.questions.length} questions)`);
        console.log(`  ✓ Answer templates: ${compactAnswerFileName}, ${prettyAnswerFileName}\n`);

        datasets.push({
          format: 'json_compact',
          density,
          dataFile: compactFileName,
          questionnaireFile: questionnaireFileName,
          metadata: { ...dataToUse.metadata, variant: 'compact' },
          questionCount: questionnaire.questions.length,
        });

        datasets.push({
          format: 'json_pretty',
          density,
          dataFile: prettyFileName,
          questionnaireFile: questionnaireFileName,
          metadata: { ...dataToUse.metadata, variant: 'pretty' },
          questionCount: questionnaire.questions.length,
        });
      } else {
        // Non-JSON formats
        switch (format) {
          case 'csv':
            fileContent = convertToCsv(dataToUse);
            break;
          case 'markdown':
            fileContent = convertToMarkdown(dataToUse);
            break;
          case 'yaml':
            fileContent = convertToYaml(dataToUse);
            break;
          case 'apache':
            fileContent = convertToApacheLogs(dataToUse);
            break;
        }

        const dataFileName = `${format}_${density}.${fileExt}`;
        const dataFilePath = path.join(outputDir, 'data', dataFileName);
        fs.writeFileSync(dataFilePath, fileContent);

        // Generate questionnaire
        const questionnaire = generateQuestionnaire(dataToUse, format, density);
        const questionnaireFileName = `${format}_${density}.json`;
        const questionnairePath = path.join(outputDir, 'questionnaires', questionnaireFileName);

        // Write clean questionnaire (questions only)
        const cleanQuestionnaire = {
          metadata: questionnaire.metadata,
          questions: questionnaire.questions,
        };
        fs.writeFileSync(questionnairePath, JSON.stringify(cleanQuestionnaire)); // Minified JSON

        // Write answer key separately
        const answerKeyFileName = `${format}_${density}_answer_key.json`;
        const answerKeyPath = path.join(outputDir, 'questionnaires', answerKeyFileName);
        const answerKeyFile = {
          metadata: questionnaire.metadata,
          answerKey: questionnaire.answerKey,
        };
        fs.writeFileSync(answerKeyPath, JSON.stringify(answerKeyFile)); // Minified JSON

        // Generate answer template
        const answerTemplate = {
          metadata: {
            format,
            density,
            dataFile: dataFileName,
            questionnaireFile: questionnaireFileName,
          },
          answers: questionnaire.questions.map(q => ({ questionId: q.id, answer: '' })),
        };

        const answerTemplateFileName = `${format}_${density}_template.json`;
        const answerTemplatePath = path.join(outputDir, 'answers', answerTemplateFileName);
        fs.writeFileSync(answerTemplatePath, JSON.stringify(answerTemplate)); // Minified JSON

        console.log(`  ✓ Data: ${dataFileName} (${dataToUse.metadata.characterCount} chars)`);
        console.log(`  ✓ Questionnaire: ${questionnaireFileName} (${questionnaire.questions.length} questions)`);
        console.log(`  ✓ Answer Key: ${answerKeyFileName}`);
        console.log(`  ✓ Answer template: ${answerTemplateFileName}\n`);

        datasets.push({
          format,
          density,
          dataFile: dataFileName,
          questionnaireFile: questionnaireFileName,
          metadata: dataToUse.metadata,
          questionCount: questionnaire.questions.length,
        });
      }
    }
  }

  // Write metadata
  const metadata = {
    generatedAt: new Date().toISOString(),
    formatTargets,
    formats,
    densities,
    totalDatasets: datasets.length,
    datasets,
  };

  const metadataPath = path.join(outputDir, 'data', 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata)); // Minified JSON

  console.log(`${'='.repeat(60)}`);
  console.log(`Generated ${datasets.length} dataset(s) with questionnaires`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run if executed directly
const outputDir = process.argv[2] || 'benchmarking';
generateAll(outputDir);
