# Real-World Test Data for Phase 5-6

## Overview
This directory contains generated real-world test data for logs and SQL INSERT statements. Use these files for performance benchmarking and token usage measurement in next session.

## Logs Directory

### Apache Combined Format
- **File**: `apache_combined_200.log`
- **Entries**: 200
- **Format**: Space-delimited with quoted fields
- **Content**:
  - Various HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD)
  - Status codes: 2xx, 3xx, 4xx, 5xx
  - Real-looking URLs, referers, user agents
  - Response sizes: 0-1MB

**Use for**:
- Token usage measurement of Apache log parsing
- Performance baseline (200 entries)
- Comparison with minified JSON output

### Nginx Access Format
- **File**: `nginx_access_200.log`
- **Entries**: 200
- **Format**: Same as Apache Combined
- **Content**: Nginx-style log entries, similar to Apache

**Use for**:
- Verify Apache and Nginx parse identically
- Confirm 200 entry handling
- Performance comparison

### RFC 3164 Syslog
- **File**: `syslog_rfc3164_200.log`
- **Entries**: 200
- **Format**: Traditional syslog with priority and tag
- **Content**:
  - Various facilities: kernel, auth, mail, daemon, cron
  - Mix of message types and severities
  - Process IDs in tags
  - Natural-looking syslog messages

**Use for**:
- Token usage of traditional syslog format
- Performance with 200 entries
- Verify priority parsing

### RFC 5424 Syslog
- **File**: `syslog_rfc5424_200.log`
- **Entries**: 200
- **Format**: Modern syslog with structured data
- **Content**:
  - Cloud platform app names
  - Structured data with key=value pairs
  - ISO 8601 timestamps with microseconds
  - Realistic app names (app-server, api-gateway, database)

**Use for**:
- Token usage of modern/cloud syslog format
- Verify structured data parsing
- Compare overhead: RFC 3164 vs RFC 5424

## SQL Directory

### E-commerce Complete Dump
- **File**: `ecommerce_dump.sql`
- **Inserts**: 3 tables (users, products, orders)
- **Rows**: ~250 total
- **Content**:
  - 100 user records with mixed NULL fields
  - 50 product records with prices and stock
  - 100 order records with statuses and timestamps
  - Multiple INSERT statements

**Use for**:
- Multi-table INSERT parsing
- Realistic data relationships
- Token usage on complete schema

### User Registration
- **File**: `user_registration.sql`
- **Inserts**: 1 table
- **Rows**: 200 users
- **Content**:
  - Mix of signup methods (email, google, github)
  - Optional phone numbers (NULL values)
  - Verification status (true/false)
  - Timestamps across January 2024

**Use for**:
- Token usage on single-table, large dataset
- Boolean and NULL value handling
- Performance with 200 rows

### Product Catalog
- **File**: `product_catalog.sql`
- **Inserts**: 1 table
- **Rows**: 150 products
- **Content**:
  - SKU codes (formatted)
  - Multiple categories
  - Decimal prices and costs
  - Stock quantities and reorder points

**Use for**:
- Numeric data type handling (decimals)
- Real pricing information
- Inventory management context

### Order Transactions
- **File**: `order_transactions.sql`
- **Inserts**: 1 table
- **Rows**: 200 orders
- **Content**:
  - Order numbers (formatted)
  - Complex pricing: subtotal, tax, shipping, total
  - Various statuses (pending, processing, shipped, etc.)
  - Optional notes field
  - Real transaction amounts

**Use for**:
- Token usage on financial data
- Decimal calculations and precision
- Complex business logic representation

## How to Use in Next Session

### 1. Measure Token Usage
```bash
# Test Apache logs
node read-minified.js real-world-logs/apache_combined_1000.log --minify --to-json

# Test syslog formats
node read-minified.js real-world-logs/syslog_rfc3164_500.log --minify --to-json
node read-minified.js real-world-logs/syslog_rfc5424_500.log --minify --to-json
```

### 2. Test SQL INSERT Parsing
```bash
# Test multi-table dump
node read-minified.js real-world-sql/ecommerce_dump.sql --minify --to-json

# Test single-table, large dataset
node read-minified.js real-world-sql/user_registration.sql --minify --to-json
node read-minified.js real-world-sql/product_catalog.sql --minify --to-json
```

### 3. Measure & Record
For each file:
1. **Original size**: Check file size in bytes
2. **Parsed size**: Measure JSON output size
3. **Token estimate**: Calculate ~1 token per 4 characters
4. **Overhead %**: (parsed - original) / original × 100
5. **Insights**: Is structure worth the overhead?

## Data Generation Script

**File**: `generate-test-data.js`

If you need to regenerate or modify the test data:
```bash
node generate-test-data.js
```

The script generates completely fresh random data each time. Modify the script to change:
- Number of entries
- Data ranges (prices, user counts)
- Categories and message types
- Timestamps and distributions

## Notes for Next Session

1. **Start here**: Load these files and measure actual token usage
2. **Decision point**: After SQL measurement, decide if parsing overhead is justified
3. **Plan**: Based on token analysis, prioritize remaining SQL features:
   - CREATE TABLE (schema extraction)
   - SELECT results (query outputs)
   - UPDATE/DELETE (modification tracking)
4. **Archive**: These test data files establish a baseline for performance regression testing

## File Organization

```
Claude_Temp_Files/
├── generate-test-data.js           # Generator script
├── README_TEST_DATA.md             # This file
├── real-world-logs/
│   ├── apache_combined_200.log
│   ├── nginx_access_200.log
│   ├── syslog_rfc3164_200.log
│   └── syslog_rfc5424_200.log
└── real-world-sql/
    ├── ecommerce_dump.sql
    ├── user_registration.sql
    ├── product_catalog.sql
    └── order_transactions.sql
```
