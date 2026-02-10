const fs = require('fs');
const path = require('path');

// Generate Apache Combined Log Format - 200 entries
function generateApacheLogs() {
  const ips = ['192.168.1.100', '10.0.0.5', '172.16.0.1', '203.0.113.45', '198.51.100.20', '192.0.2.10'];
  const users = ['frank', 'john', 'jane', 'admin', '-'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
  const paths = ['/index.html', '/api/users', '/api/products', '/download/file.pdf', '/login', '/api/search', '/static/js/app.js', '/images/logo.png', '/cart', '/checkout'];
  const statusCodes = [200, 201, 204, 301, 304, 400, 401, 403, 404, 500, 502, 503];
  const referers = ['http://www.example.com/', 'https://example.com/search', '-', 'https://google.com', 'https://facebook.com'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (X11; Linux x86_64)',
    'curl/7.64.1',
    'Python-Requests/2.25.1'
  ];

  let logs = '';
  for (let i = 0; i < 200; i++) {
    const ip = ips[Math.floor(Math.random() * ips.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const date = new Date(2024, 0, Math.floor(Math.random() * 31) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    const timestamp = date.toISOString().replace('T', ' ').split('.')[0];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    const protocol = 'HTTP/1.' + (Math.random() > 0.7 ? '0' : '1');
    const status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const bytes = Math.floor(Math.random() * 1000000);
    const referer = referers[Math.floor(Math.random() * referers.length)];
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

    logs += `${ip} - ${user} [${timestamp} +0000] "${method} ${path} ${protocol}" ${status} ${bytes} "${referer}" "${ua}"\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'real-world-logs/apache_combined_200.log'), logs);
  console.log('Generated: apache_combined_200.log');
}

// Generate Nginx logs - 200 entries
function generateNginxLogs() {
  const ips = ['192.168.1.100', '10.0.0.5', '172.16.0.1', '203.0.113.45', '198.51.100.20', '192.0.2.10'];
  const users = ['john', 'jane', 'admin', '-'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const paths = ['/index.html', '/api/v1/users', '/api/v1/products', '/download/report.pdf', '/login', '/api/v1/search'];
  const statusCodes = [200, 201, 204, 304, 400, 401, 403, 404, 500];
  const referers = ['https://example.com/', 'https://example.com/search', '-'];
  const userAgents = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Mozilla/5.0 (X11; Linux x86_64)', 'curl/7.68.0'];

  let logs = '';
  for (let i = 0; i < 200; i++) {
    const ip = ips[Math.floor(Math.random() * ips.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const date = new Date(2024, 0, Math.floor(Math.random() * 31) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    const timestamp = date.toISOString().replace('T', ' ').replace('Z', '+0000').split('.')[0];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    const protocol = 'HTTP/1.1';
    const status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const bytes = Math.floor(Math.random() * 500000);
    const referer = referers[Math.floor(Math.random() * referers.length)];
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

    logs += `${ip} - ${user} [${timestamp}] "${method} ${path} ${protocol}" ${status} ${bytes} "${referer}" "${ua}"\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'real-world-logs/nginx_access_200.log'), logs);
  console.log('Generated: nginx_access_200.log');
}

// Generate RFC 3164 Syslog - 200 entries
function generateSyslogRFC3164() {
  const facilities = ['kernel', 'auth', 'mail', 'daemon', 'syslog', 'lpr', 'news', 'uucp', 'cron', 'local0', 'local1'];
  const severities = ['Emergency', 'Alert', 'Critical', 'Error', 'Warning', 'Notice', 'Info', 'Debug'];
  const hostnames = ['web1', 'web2', 'db1', 'app1', 'cache1', 'router1'];
  const messages = [
    'Connection accepted from %s',
    'Authentication failed for user %s',
    'Process %s crashed with exit code %d',
    'Disk usage at %d%% capacity',
    'Memory allocation failed',
    'Service started successfully',
    'Configuration reloaded',
    'Error in module: %s'
  ];

  let logs = '';
  for (let i = 0; i < 200; i++) {
    const facility = facilities[Math.floor(Math.random() * facilities.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const hostname = hostnames[Math.floor(Math.random() * hostnames.length)];
    const priority = (Math.floor(Math.random() * 8) * 8 + Math.floor(Math.random() * 8));
    const date = new Date(2024, 0, Math.floor(Math.random() * 31) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toTimeString().split(' ')[0];
    const tag = facility + (Math.random() > 0.7 ? '[' + Math.floor(Math.random() * 10000) + ']' : '');
    const msg = messages[Math.floor(Math.random() * messages.length)];

    logs += `<${priority}>${month.padStart(3)} ${String(day).padStart(2)} ${time} ${hostname} ${tag}: ${msg}\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'real-world-logs/syslog_rfc3164_200.log'), logs);
  console.log('Generated: syslog_rfc3164_200.log');
}

// Generate RFC 5424 Syslog - 200 entries
function generateSyslogRFC5424() {
  const appNames = ['app-server', 'api-gateway', 'database', 'cache', 'worker', 'scheduler'];
  const msgIds = ['AUTH_FAIL', 'DB_ERROR', 'API_TIMEOUT', 'CACHE_MISS', 'TASK_COMPLETE', 'CONFIG_RELOAD'];
  const messages = [
    'User authentication failed from 192.168.1.100',
    'Database connection timeout after 30s',
    'API request exceeded rate limit',
    'Cache invalidated for key: user_session_123',
    'Background task completed successfully',
    'Configuration reloaded from /etc/app/config.yml'
  ];

  let logs = '';
  for (let i = 0; i < 200; i++) {
    const priority = Math.floor(Math.random() * 191) + 1;
    const version = '1';
    const timestamp = new Date(2024, 0, Math.floor(Math.random() * 31) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), Math.floor(Math.random() * 1000)).toISOString();
    const hostname = 'cloud-' + Math.floor(Math.random() * 5);
    const appName = appNames[Math.floor(Math.random() * appNames.length)];
    const procId = Math.floor(Math.random() * 99999);
    const msgId = msgIds[Math.floor(Math.random() * msgIds.length)];
    const sdId = 'exampleSDID@' + Math.floor(Math.random() * 100000);
    const key = Math.random() > 0.5 ? 'env="prod"' : 'env="staging"';
    const version2 = Math.random() > 0.5 ? 'version="2.1.0"' : 'version="1.5.3"';
    const msg = messages[Math.floor(Math.random() * messages.length)];

    logs += `<${priority}>${version} ${timestamp} ${hostname} ${appName} ${procId} ${msgId} [${sdId} ${key} ${version2}] ${msg}\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'real-world-logs/syslog_rfc5424_200.log'), logs);
  console.log('Generated: syslog_rfc5424_200.log');
}

// Generate E-commerce SQL dump
function generateEcommerceDump() {
  let sql = '-- E-commerce Database Dump\n\n';

  // Create users table and inserts
  sql += `INSERT INTO users (id, username, email, phone, verified, created_at) VALUES\n`;
  for (let i = 1; i <= 100; i++) {
    const email = `user${i}@example.com`;
    const phone = Math.random() > 0.3 ? `'555-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}'` : 'NULL';
    const verified = Math.random() > 0.2 ? 'true' : 'false';
    sql += `(${i}, 'user${i}', '${email}', ${phone}, ${verified}, '2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00')${i < 100 ? ',' : ';'}\n`;
  }

  // Create products table and inserts
  sql += `\nINSERT INTO products (sku, name, category, price, stock) VALUES\n`;
  const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books'];
  for (let i = 1; i <= 50; i++) {
    const sku = 'PROD-' + String(i).padStart(4, '0');
    const name = `Product ${i}`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const price = (Math.random() * 1000 + 10).toFixed(2);
    const stock = Math.floor(Math.random() * 500);
    sql += `('${sku}', '${name}', '${category}', ${price}, ${stock})${i < 50 ? ',' : ';'}\n`;
  }

  // Create orders table and inserts
  sql += `\nINSERT INTO orders (id, user_id, total, status, created_at) VALUES\n`;
  for (let i = 1; i <= 100; i++) {
    const userId = Math.floor(Math.random() * 100) + 1;
    const total = (Math.random() * 5000 + 50).toFixed(2);
    const statuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    sql += `(${i}, ${userId}, ${total}, '${status}', '2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00')${i < 100 ? ',' : ';'}\n`;
  }

  fs.writeFileSync(path.join(__dirname, 'real-world-sql/ecommerce_dump.sql'), sql);
  console.log('Generated: ecommerce_dump.sql');
}

// Generate user registration SQL
function generateUserRegistration() {
  let sql = `INSERT INTO users (id, username, email, phone, verified, signup_method, created_at) VALUES\n`;
  for (let i = 1; i <= 200; i++) {
    const email = `user${i}@mail.test`;
    const phone = Math.random() > 0.4 ? `'555-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}'` : 'NULL';
    const verified = Math.random() > 0.3 ? 'true' : 'false';
    const method = ['email', 'google', 'github'][Math.floor(Math.random() * 3)];
    sql += `(${i}, 'user${i}', '${email}', ${phone}, ${verified}, '${method}', '2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00')${i < 200 ? ',' : ';'}\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'real-world-sql/user_registration.sql'), sql);
  console.log('Generated: user_registration.sql');
}

// Generate product catalog
function generateProductCatalog() {
  let sql = `INSERT INTO products (sku, name, description, category, price, cost, stock, reorder_point) VALUES\n`;
  const categories = ['Electronics', 'Accessories', 'Software', 'Hardware', 'Peripherals'];
  for (let i = 1; i <= 150; i++) {
    const sku = 'SKU-' + String(i).padStart(5, '0');
    const name = `Product Item ${i}`;
    const desc = `High-quality product for category use`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const price = (Math.random() * 2000 + 20).toFixed(2);
    const cost = (Math.random() * parseFloat(price) * 0.6).toFixed(2);
    const stock = Math.floor(Math.random() * 1000);
    const reorder = Math.floor(Math.random() * 100) + 10;
    sql += `('${sku}', '${name}', '${desc}', '${category}', ${price}, ${cost}, ${stock}, ${reorder})${i < 150 ? ',' : ';'}\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'real-world-sql/product_catalog.sql'), sql);
  console.log('Generated: product_catalog.sql');
}

// Generate order transactions
function generateOrderTransactions() {
  let sql = `INSERT INTO orders (id, order_number, user_id, total_amount, tax, shipping, status, notes, created_at) VALUES\n`;
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'];
  let orderId = 1;
  for (let i = 1; i <= 200; i++) {
    const orderNum = 'ORD-2024-' + String(i).padStart(6, '0');
    const userId = Math.floor(Math.random() * 100) + 1;
    const subtotal = Math.random() * 5000 + 50;
    const tax = (subtotal * 0.08).toFixed(2);
    const shipping = Math.random() > 0.3 ? (Math.random() * 50 + 5).toFixed(2) : '0.00';
    const total = (subtotal + parseFloat(tax) + parseFloat(shipping)).toFixed(2);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const notes = Math.random() > 0.7 ? `'Express delivery requested'` : 'NULL';
    sql += `(${orderId}, '${orderNum}', ${userId}, ${total}, ${tax}, ${shipping}, '${status}', ${notes}, '2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00')${i < 200 ? ',' : ';'}\n`;
    orderId++;
  }
  fs.writeFileSync(path.join(__dirname, 'real-world-sql/order_transactions.sql'), sql);
  console.log('Generated: order_transactions.sql');
}

// Main
console.log('Generating real-world test data...\n');
generateApacheLogs();
generateNginxLogs();
generateSyslogRFC3164();
generateSyslogRFC5424();
generateEcommerceDump();
generateUserRegistration();
generateProductCatalog();
generateOrderTransactions();
console.log('\nAll test data generated successfully!');
