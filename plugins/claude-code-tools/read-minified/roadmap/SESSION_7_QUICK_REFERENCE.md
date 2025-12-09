# Session 7 Quick Reference

## 🎯 Core Strategy: Never Lose Information

### The `unparsedContent` Approach
```
Original SQL:
  SELECT u.id, u.name FROM users u LEFT JOIN orders o ON u.id = o.user_id

Parser Output:
  {
    "action": "SELECT",
    "table": "users",
    "columns": ["u.id", "u.name"],
    "unparsedContent": "LEFT JOIN orders o ON u.id = o.user_id",
    "statementIndex": 0
  }

Later Sessions:
  Parse unparsedContent incrementally → fewer fields unparsedContent
```

### Why This Works
- ✅ Zero information loss (always have original parts)
- ✅ No complex reconstruction needed
- ✅ Easy to incrementally improve
- ✅ Graceful degradation (parse what we know, fallback for rest)

---

## 📋 Session 7 Tasks (5 Days)

| Day | Task | Tests | Output |
|-----|------|-------|--------|
| 1 | Setup benchmarking script | - | `generate-test-sql.ts` |
| 2 | Fallback field + tests | 30+ | `unparsedContent` field |
| 3 | Reconstruction decision test | 15+ | Decision: Full/Partial/Defer |
| 4 | Edge cases + fallback tests | 35+ | 50-70 new unit tests |
| 5 | Real-world validation | 30-50 | Benchmarking report |

---

## 🧪 Three Test Types

### Unit Tests (Separate files)
```
sql.edge-cases-advanced.test.ts      (JOINs, subqueries, complex expressions)
sql.unparsed-content.test.ts         (Fallback behavior, information preservation)
sql.reconstruction.test.ts           (Only if simple enough - see test-driven decision)
```

### Real-World Tests (Generated corpus)
```
sql.real-world.test.ts               (Generated SQL patterns - different file)
benchmarks/session-7-results.md       (Performance metrics)
```

### Test Philosophy
- ✅ Unit: One concept per test
- ✅ Real-world: Mixed patterns like production SQL
- ✅ Both: Zero information loss guaranteed

---

## ⚡ Quick Wins (Low-Hanging Fruit)

Easy to add to existing tests:
- Multiple INSERT rows
- Complex WHERE (AND/OR combinations)
- Multiple column indexes
- Whitespace edge cases
- Case sensitivity variations

---

## 🔍 Decision Gate: Reconstruction

### Test Before Implementing

```typescript
// If this test passes → implement full reconstruction
// If <80% pass → use unparsedContent fallback instead

test('should reconstruct SELECT', () => {
  const original = 'SELECT id, name FROM users WHERE age > 18';
  const json = formatSql(original, { minify: true });
  const reconstructed = reconstructSql(json);
  expect(normalize(reconstructed)).toBe(normalize(original));
});
```

---

## 📊 Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Zero info loss | 100% | Critical - must never discard data |
| Unit test pass rate | 100% | Comprehensive coverage |
| Real-world success | 90%+ | Practical validation |
| Test count | 450+ | Thorough coverage |

---

## 🚀 Reusable Artifacts for Future

1. **generate-test-sql.ts** - Benchmark any future version
2. **Real-world corpus** - Test patterns library
3. **unparsedContent strategy** - Pattern for handling unknowns
4. **Reconstruction framework** - Incremental parsing template

---

## 📝 Quick Decision Checklist

- [ ] Fallback tests all pass (no info loss)
- [ ] Reconstruction test run (80%+ needed to implement)
- [ ] Real-world corpus tested (90%+ coverage target)
- [ ] Unit tests comprehensive (50-70 new)
- [ ] Benchmarking script working
- [ ] All tests passing

---

## Key Points to Remember

1. **Never lose information** - unparsedContent fallback
2. **Test before implementing** - Decide reconstruction via test
3. **Separate concerns** - Unit tests vs real-world tests
4. **Incremental approach** - Parse more in future sessions
5. **Reusable output** - Script and test corpus for later

