import { formatSql } from '../../src/formats/sql';

describe('SQL Mixed Statements - Updated Tests', () => {
  test('should handle high-volume insert batching with grouping', () => {
    let sql = 'CREATE TABLE events (id INT, event_type VARCHAR(50));';
    for (let i = 1; i <= 5; i++) {
      sql += `INSERT INTO events (id, event_type) VALUES (${i}, 'event_${i}');`;
    }
    const output = formatSql(sql, { minify: true });
    const result = JSON.parse(output);

    expect(result).toHaveLength(1);
    expect(result[0].actions).toHaveLength(2);
    expect(result[0].actions[0].action).toBe('CREATE');
    expect(result[0].table).toBe('events');
    expect(result[0].actions[1].action).toBe('INSERT');
    expect(result[0].table).toBe('events');
    expect(result[0].actions[1].rowCount).toBe(5);
  });

  test('should handle database migration with grouping', () => {
    const sql = `CREATE TABLE users (id INT, name VARCHAR(100));
    INSERT INTO users (id, name) VALUES (1, 'John');
    INSERT INTO users (id, name) VALUES (2, 'Jane');`;
    const output = formatSql(sql, { minify: true });
    const result = JSON.parse(output);

    expect(result).toHaveLength(1);
    expect(result[0].actions).toHaveLength(2);
    expect(result[0].actions[0].action).toBe('CREATE');
    expect(result[0].actions[1].action).toBe('INSERT');
    expect(result[0].actions[1].rowCount).toBe(2);
  });
});
