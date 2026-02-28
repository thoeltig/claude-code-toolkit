import { formatLogs } from '../../src/formats/logs';

describe('Logs Format Handler', () => {
  describe('Apache/Nginx Combined Format', () => {
    test('should parse single Apache access log line', () => {
      const log = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ip: '127.0.0.1',
        logname: '-',
        user: 'frank',
        timestamp: '[10/Oct/2000:13:55:36 -0700]',
        request: 'GET /apache_pb.gif HTTP/1.0',
        status: '200',
        bytes: '2326',
        referer: 'http://www.example.com/start.html',
        useragent: 'Mozilla/4.08 [en] (Win98; I ;Nav)'
      });
    });

    test('should parse multiple Apache log lines', () => {
      const logs = `127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 1234 "-" "Mozilla/5.0"
192.168.1.100 - john [11/Oct/2000:14:20:15 -0700] "POST /api/data HTTP/1.1" 201 1024 "https://example.com" "Chrome/91.0"`;
      const output = formatLogs(logs, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      expect(result[0].ip).toBe('127.0.0.1');
      expect(result[0].user).toBe('frank');
      expect(result[1].ip).toBe('192.168.1.100');
      expect(result[1].user).toBe('john');
      expect(result[1].status).toBe('201');
    });

    test('should handle missing user (dash) in Apache logs', () => {
      const log = '10.0.0.5 - - [11/Oct/2000:15:45:22 -0700] "GET /index.html HTTP/1.1" 304 0 "-" "curl/7.64.1"';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].user).toBe('-');
      expect(result[0].referer).toBe('-');
    });

    test('should handle user-agent with spaces', () => {
      const log = '192.168.1.50 - user123 [10/Oct/2024:14:15:45 +0000] "GET /download/file.pdf HTTP/1.1" 206 2048576 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].useragent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    test('should handle DELETE request', () => {
      const log = '172.16.0.1 - admin [12/Oct/2000:10:30:00 -0700] "DELETE /api/resource/123 HTTP/1.1" 204 0 "https://admin.example.com" "Mozilla/5.0"';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].request).toBe('DELETE /api/resource/123 HTTP/1.1');
      expect(result[0].status).toBe('204');
    });

    test('should parse Nginx format (same as Apache Combined)', () => {
      const log = '192.168.1.100 - john [10/Oct/2024:13:55:36 +0000] "GET /index.html HTTP/1.1" 200 1234 "https://example.com" "Mozilla/5.0 (X11; Linux x86_64)"';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].ip).toBe('192.168.1.100');
      expect(result[0].status).toBe('200');
    });
  });

  describe('RFC 3164 Syslog Format', () => {
    test('should detect and parse RFC 3164 syslog', () => {
      const log = '<34>Oct 11 22:14:15 mymachine su: \'su root\' failed for lonvick on /dev/pts/8';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        priority: 34,
        timestamp: 'Oct 11 22:14:15',
        hostname: 'mymachine',
        tag: 'su',
        message: '\'su root\' failed for lonvick on /dev/pts/8'
      });
    });

    test('should parse RFC 3164 with kernel tag', () => {
      const log = '<13>Feb 5 17:32:18 server01 kernel: Out of memory: Kill process 1234 (firefox) score 512';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].priority).toBe(13);
      expect(result[0].tag).toBe('kernel');
      expect(result[0].message).toContain('Out of memory');
    });

    test('should handle RFC 3164 with process ID in tag', () => {
      const log = '<165>Aug 24 05:34:00 webserver myapp[10]: Request timeout after 30s for /api/endpoint';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].tag).toBe('myapp[10]');
      expect(result[0].message).toBe('Request timeout after 30s for /api/endpoint');
    });

    test('should parse multiple RFC 3164 lines', () => {
      const logs = `<34>Oct 11 22:14:15 mymachine su: 'su root' failed
<13>Feb 5 17:32:18 server01 kernel: Out of memory
<30>Dec 8 09:45:22 database postgresql[5432]: authentication failed`;
      const output = formatLogs(logs, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result[0].tag).toBe('su');
      expect(result[2].tag).toBe('postgresql[5432]');
    });

    test('should calculate priority correctly', () => {
      const log = '<30>Dec 8 09:45:22 database postgresql[5432]: authentication failed from 192.168.1.10';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].priority).toBe(30);
    });
  });

  describe('RFC 5424 Syslog Format', () => {
    test('should detect and parse RFC 5424 syslog', () => {
      const log = '<34>1 2024-10-11T22:14:15.123456Z mymachine su 1234 ID1 [exampleSDID@32473 key="value"] \'su root\' failed for lonvick';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        priority: 34,
        version: 1,
        timestamp: '2024-10-11T22:14:15.123456Z',
        hostname: 'mymachine',
        appName: 'su',
        procId: '1234',
        msgId: 'ID1',
        structuredData: {
          'exampleSDID@32473': { key: 'value' }
        },
        message: '\'su root\' failed for lonvick'
      });
    });

    test('should parse RFC 5424 with multiple structured data blocks', () => {
      const log = '<165>1 2024-08-24T05:34:00.987654Z webserver myapp 10 EventID1 [appSDID@12345 env="production" version="1.2.3"] Request timeout after 30s';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].appName).toBe('myapp');
      expect(result[0].procId).toBe('10');
      expect(result[0].structuredData['appSDID@12345']).toEqual({
        env: 'production',
        version: '1.2.3'
      });
    });

    test('should handle RFC 5424 with dash as msgId', () => {
      const log = '<13>1 2024-10-12T05:32:18.654321Z server01 kernel 0 - [meta type="mem"] Out of memory: Kill process 1234 (firefox)';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].msgId).toBe('-');
      expect(result[0].procId).toBe('0');
      expect(result[0].structuredData.meta).toEqual({ type: 'mem' });
    });

    test('should parse RFC 5424 with no structured data', () => {
      const log = '<30>1 2024-12-08T09:45:22.111111Z database postgresql 5432 PGID authentication failed from 192.168.1.10';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].hostname).toBe('database');
      expect(result[0].message).toBe('authentication failed from 192.168.1.10');
      expect(result[0].structuredData).toBeUndefined();
    });

    test('should parse multiple RFC 5424 lines', () => {
      const logs = `<34>1 2024-10-11T22:14:15.123456Z mymachine su 1234 ID1 [exampleSDID@32473 key="value"] 'su root' failed
<13>1 2024-10-12T05:32:18.654321Z server01 kernel 0 - [meta type="mem"] Out of memory
<30>1 2024-12-08T09:45:22.111111Z database postgresql 5432 PGID [pgSDID@123 db="users"] authentication failed`;
      const output = formatLogs(logs, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(1);
      expect(result[1].version).toBe(1);
      expect(result[2].version).toBe(1);
    });
  });

  describe('Mixed Log Formats', () => {
    test('should auto-detect RFC 3164 from first line', () => {
      const logs = `<34>Oct 11 22:14:15 mymachine su: 'su root' failed
<13>Feb 5 17:32:18 server01 kernel: Out of memory`;
      const output = formatLogs(logs, { minify: true });
      const result = JSON.parse(output);

      expect(result[0]).toHaveProperty('tag');
      expect(result[0]).not.toHaveProperty('version');
    });

    test('should auto-detect RFC 5424 from first line', () => {
      const logs = `<34>1 2024-10-11T22:14:15.123456Z mymachine su 1234 ID1 [exampleSDID@32473 key="value"] 'su root' failed
<13>1 2024-10-12T05:32:18.654321Z server01 kernel 0 - [meta type="mem"] Out of memory`;
      const output = formatLogs(logs, { minify: true });
      const result = JSON.parse(output);

      expect(result[0]).toHaveProperty('version');
      expect(result[0].version).toBe(1);
    });

    test('should auto-detect Apache/Nginx from first line', () => {
      const log = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08"';
      const output = formatLogs(log, { minify: true });
      const result = JSON.parse(output);

      expect(result[0]).toHaveProperty('ip');
      expect(result[0]).toHaveProperty('request');
      expect(result[0]).not.toHaveProperty('version');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty log content', () => {
      const output = formatLogs('', { minify: true });
      expect(output).toBe('[]');
    });

    test('should handle whitespace-only log content', () => {
      const output = formatLogs('   \n  \n  ', { minify: true });
      expect(output).toBe('[]');
    });

    test('should handle log with empty lines', () => {
      const logs = `127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET / HTTP/1.0" 200 1234 "-" "Mozilla/5.0"

192.168.1.100 - john [11/Oct/2000:14:20:15 -0700] "GET / HTTP/1.1" 200 5678 "-" "Chrome/91.0"`;
      const output = formatLogs(logs, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
    });

    test('should gracefully degrade for invalid log content', () => {
      const output = formatLogs('completely invalid [[ log content', { minify: true });
      const result = JSON.parse(output);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('ip');
    });
  });

  describe('Output Format', () => {
    test('should return minified JSON by default', () => {
      const log = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET / HTTP/1.0" 200 1234 "-" "Mozilla/5.0"';
      const output = formatLogs(log, { minify: true });

      expect(output).not.toContain('\n');
      expect(output).not.toContain('  ');
    });

    test('should return pretty-printed JSON when minify is false', () => {
      const log = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET / HTTP/1.0" 200 1234 "-" "Mozilla/5.0"';
      const output = formatLogs(log, { minify: false });

      expect(output).toContain('\n');
    });
  });
});
