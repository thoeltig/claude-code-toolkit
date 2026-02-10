/**
 * Generates realistic SQL patterns for benchmarking and testing
 * This script creates a reusable corpus of SQL statements covering:
 * - E-commerce queries (orders, products, inventory)
 * - Complex JOINs and subqueries
 * - Basic CRUD operations
 * - Edge cases (multiple conditions, functions, etc.)
 *
 * Output: JSON file with categorized SQL statements
 * Reusable for: Performance benchmarking, regression testing, pattern validation
 */

export interface TestSqlOptions {
  count?: number;
  category?: 'all'|'basic'|'ecommerce'|'complex'|'edge-cases';
  seed?: number;
}

export interface GeneratedTestSet {
  category: string;
  description: string;
  sql: string;
  expectedComplexity: 'simple'|'moderate'|'complex';
}

// Seed for reproducible random generation
let randomSeed = 12345;
function seededRandom(): number {
  randomSeed = (randomSeed * 9301 + 49297) % 233280;
  return randomSeed / 233280;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const basicStatements: GeneratedTestSet[] = [
  // Basic INSERT
  { category: 'insert-simple', description: 'Single row INSERT', sql: 'INSERT INTO users (id, name) VALUES (1, "John")', expectedComplexity: 'simple' },
  { category: 'insert-simple', description: 'Multiple rows INSERT', sql: 'INSERT INTO users (id, name) VALUES (1, "John"), (2, "Jane"), (3, "Bob")', expectedComplexity: 'simple' },
  { category: 'insert-simple', description: 'Many rows INSERT (11)', sql: 'INSERT INTO users (id, name) VALUES (1, "John"), (2, "Jane"), (3, "Bob"), (4, "Alice"), (5, "Charlie"), (6, "David"), (7, "Eve"), (8, "Frank"), (9, "Grace"), (10, "Henry"), (11, "Ivy")', expectedComplexity: 'simple' },

  // Basic SELECT
  { category: 'select-simple', description: 'Basic SELECT', sql: 'SELECT * FROM users', expectedComplexity: 'simple' },
  { category: 'select-simple', description: 'SELECT with columns', sql: 'SELECT id, name FROM users', expectedComplexity: 'simple' },
  { category: 'select-simple', description: 'SELECT with WHERE', sql: 'SELECT id, name FROM users WHERE age > 18', expectedComplexity: 'simple' },

  // Basic UPDATE
  { category: 'update-simple', description: 'Single column UPDATE', sql: 'UPDATE users SET status = "active" WHERE id = 1', expectedComplexity: 'simple' },
  { category: 'update-simple', description: 'Multiple columns UPDATE', sql: 'UPDATE users SET status = "active", email = "john@example.com" WHERE id = 1', expectedComplexity: 'simple' },

  // Basic DELETE
  { category: 'delete-simple', description: 'DELETE with WHERE', sql: 'DELETE FROM users WHERE id = 1', expectedComplexity: 'simple' },
  { category: 'delete-simple', description: 'DELETE all (dangerous)', sql: 'DELETE FROM users', expectedComplexity: 'simple' },

  // CREATE TABLE
  { category: 'create-table', description: 'Simple table', sql: 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255))', expectedComplexity: 'simple' },
  { category: 'create-table', description: 'Table with constraints', sql: 'CREATE TABLE users (id INT PRIMARY KEY NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, status VARCHAR(20) DEFAULT "pending")', expectedComplexity: 'moderate' },

  // DROP
  { category: 'drop', description: 'DROP TABLE', sql: 'DROP TABLE users', expectedComplexity: 'simple' },
  { category: 'drop', description: 'DROP TABLE IF EXISTS', sql: 'DROP TABLE IF EXISTS users', expectedComplexity: 'simple' },

  // TRUNCATE
  { category: 'truncate', description: 'TRUNCATE TABLE', sql: 'TRUNCATE TABLE users', expectedComplexity: 'simple' },
];

const ecommerceStatements: GeneratedTestSet[] = [
  { category: 'ecommerce-select', description: 'Order summary query', sql: 'SELECT o.id, u.name, COUNT(o.id) as order_count FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = "completed" GROUP BY u.id, u.name', expectedComplexity: 'moderate' },
  { category: 'ecommerce-select', description: 'Product inventory report', sql: 'SELECT p.id, p.name, SUM(i.quantity) as total_stock FROM products p LEFT JOIN inventory i ON p.id = i.product_id GROUP BY p.id, p.name HAVING SUM(i.quantity) > 0', expectedComplexity: 'moderate' },
  { category: 'ecommerce-select', description: 'Customer lifetime value', sql: 'SELECT u.id, u.name, SUM(o.total) as lifetime_value FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.total > (SELECT AVG(total) FROM orders) GROUP BY u.id, u.name', expectedComplexity: 'complex' },
  { category: 'ecommerce-insert', description: 'Bulk order insert', sql: 'INSERT INTO orders (user_id, product_id, quantity, total) VALUES (1, 10, 5, 99.99), (2, 20, 3, 149.99), (1, 15, 2, 49.99)', expectedComplexity: 'simple' },
  { category: 'ecommerce-update', description: 'Update order status', sql: 'UPDATE orders SET status = "shipped", shipped_date = "2024-01-15" WHERE id = 100', expectedComplexity: 'simple' },
];

const complexStatements: GeneratedTestSet[] = [
  { category: 'complex-join', description: 'LEFT JOIN basic', sql: 'SELECT u.id, u.name FROM users u LEFT JOIN orders o ON u.id = o.user_id', expectedComplexity: 'moderate' },
  { category: 'complex-join', description: 'Multiple JOINs', sql: 'SELECT u.id, u.name, o.id, p.name FROM users u JOIN orders o ON u.id = o.user_id JOIN products p ON o.product_id = p.id', expectedComplexity: 'complex' },
  { category: 'complex-where', description: 'Complex WHERE (AND/OR)', sql: 'SELECT * FROM users WHERE (age > 18 AND status = "active") OR (role = "admin" AND created_at > "2024-01-01")', expectedComplexity: 'moderate' },
  { category: 'complex-where', description: 'WHERE with IN subquery', sql: 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 1000)', expectedComplexity: 'complex' },
  { category: 'complex-cte', description: 'CTE (WITH clause)', sql: 'WITH active_users AS (SELECT id, name FROM users WHERE status = "active") SELECT * FROM active_users WHERE age > 18', expectedComplexity: 'complex' },
  { category: 'complex-union', description: 'UNION query', sql: 'SELECT id, name FROM users UNION SELECT id, name FROM inactive_users', expectedComplexity: 'moderate' },
];

const edgeCaseStatements: GeneratedTestSet[] = [
  { category: 'edge-whitespace', description: 'Extra whitespace', sql: 'SELECT   id  ,   name   FROM   users   WHERE   age  >  18', expectedComplexity: 'simple' },
  { category: 'edge-case', description: 'Mixed case keywords', sql: 'SeLeCt Id, NaMe FrOm UsErS wHeRe AgE > 18', expectedComplexity: 'simple' },
  { category: 'edge-strings', description: 'Single quotes in data', sql: "INSERT INTO users (name) VALUES ('O''Brien')", expectedComplexity: 'simple' },
  { category: 'edge-functions', description: 'Aggregate functions in SELECT', sql: 'SELECT status, COUNT(*) as count, AVG(salary) as avg_salary FROM employees GROUP BY status', expectedComplexity: 'moderate' },
  { category: 'edge-functions', description: 'Functions in WHERE', sql: 'SELECT * FROM orders WHERE YEAR(order_date) = 2024 AND MONTH(order_date) >= 3', expectedComplexity: 'moderate' },
  { category: 'edge-arithmetic', description: 'Arithmetic in UPDATE', sql: 'UPDATE products SET price = price * 1.1, stock = stock - 1 WHERE category = "electronics"', expectedComplexity: 'simple' },
  { category: 'edge-constraints', description: 'Multiple table constraints', sql: 'CREATE TABLE orders (id INT PRIMARY KEY, user_id INT, product_id INT, FOREIGN KEY (user_id) REFERENCES users(id), UNIQUE KEY unique_order (user_id, product_id))', expectedComplexity: 'moderate' },
];

export function generateTestSql(category: string = 'all', options: TestSqlOptions = {}): GeneratedTestSet[] {
  const count = options.count || 100;
  const seed = options.seed || randomSeed;
  randomSeed = seed;

  let source: GeneratedTestSet[] = [];

  switch (category) {
    case 'basic':
      source = basicStatements;
      break;
    case 'ecommerce':
      source = ecommerceStatements;
      break;
    case 'complex':
      source = complexStatements;
      break;
    case 'edge-cases':
      source = edgeCaseStatements;
      break;
    case 'all':
    default:
      source = [...basicStatements, ...ecommerceStatements, ...complexStatements, ...edgeCaseStatements];
  }

  // Duplicate and shuffle to reach count
  const result: GeneratedTestSet[] = [];
  const shuffled = shuffle(source);

  while (result.length < count) {
    result.push(...shuffled);
  }

  return result.slice(0, count);
}

export function generateTestSqlStrings(category: string = 'all', options: TestSqlOptions = {}): string[] {
  return generateTestSql(category, options).map(test => test.sql);
}

// CLI usage
if (require.main === module) {
  const count = parseInt(process.argv[2] || '100');
  const category = process.argv[3] || 'all';

  const tests = generateTestSql(category, { count });

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    category,
    count: tests.length,
    tests
  }));
}
