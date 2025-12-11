#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const answersFile = process.argv[2];
const questionnaireFile = process.argv[3];

if (!answersFile || !questionnaireFile) {
  console.error('Usage: node validate.js <answers.json> <questionnaire.json>');
  process.exit(1);
}

const answers = JSON.parse(fs.readFileSync(answersFile, 'utf-8'));
const questionnaire = JSON.parse(fs.readFileSync(questionnaireFile, 'utf-8'));

let correct = 0;
let total = 0;
const results = [];

console.log('\n' + '='.repeat(70));
console.log('VALIDATION RESULTS');
console.log('='.repeat(70) + '\n');

for (const question of questionnaire.questions) {
  const answer = answers.answers.find(a => a.questionId === question.id);
  if (!answer) {
    console.log(`✗ Q${question.id}: MISSING`);
    results.push({ questionId: question.id, correct: false, reason: 'missing' });
    continue;
  }

  total++;
  const expected = question.expectedAnswer;
  let isCorrect = false;
  let reason = '';

  switch (expected.validationMethod) {
    case 'exact':
      isCorrect = String(answer.answer).toLowerCase().trim() === String(expected.value).toLowerCase().trim();
      reason = isCorrect ? 'exact match' : 'mismatch';
      break;

    case 'numeric':
      const tolerance = expected.tolerance || 0;
      const givenNum = parseFloat(answer.answer);
      const expectedNum = parseFloat(expected.value);
      isCorrect = !isNaN(givenNum) && !isNaN(expectedNum) && Math.abs(givenNum - expectedNum) <= tolerance;
      reason = isCorrect ? `match (tol: ${tolerance})` : `mismatch (got ${givenNum}, expected ${expectedNum})`;
      break;

    case 'array_set':
      const givenItems = String(answer.answer)
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);
      const expectedItems = expected.value.map(s => String(s).toLowerCase());
      const matchCount = expectedItems.filter(item => givenItems.some(g => g.includes(item))).length;
      isCorrect = matchCount === expectedItems.length;
      reason = isCorrect ? `all items found (${matchCount}/${expectedItems.length})` : `missing items (${matchCount}/${expectedItems.length})`;
      break;

    case 'fuzzy_deduction':
      const givenStr = String(answer.answer).toLowerCase();
      const keywords = expected.keywords || [];
      const matches = keywords.filter(k => givenStr.includes(String(k).toLowerCase())).length;
      const threshold = Math.ceil(keywords.length * 0.7);
      isCorrect = matches >= threshold;
      reason = isCorrect ? `keywords found (${matches}/${keywords.length})` : `insufficient keywords (${matches}/${keywords.length})`;
      break;

    case 'manual':
      isCorrect = false;
      reason = 'requires manual review';
      break;
  }

  if (isCorrect) correct++;

  const status = isCorrect ? '✓' : '✗';
  const qText = question.question.length > 50 ? question.question.substring(0, 47) + '...' : question.question;
  console.log(`${status} Q${question.id} (${question.category}): ${qText}`);
  if (!isCorrect && expected.validationMethod !== 'manual') {
    console.log(`    Expected: ${JSON.stringify(expected.value)}`);
    console.log(`    Got:      ${JSON.stringify(answer.answer)}`);
  }
  console.log(`    [${reason}]`);

  results.push({
    questionId: question.id,
    correct: isCorrect,
    reason,
    category: question.category,
  });
}

console.log('\n' + '='.repeat(70));
console.log(`ACCURACY: ${correct}/${total} correct (${total > 0 ? Math.round((correct / total) * 100) : 0}%)`);
console.log('='.repeat(70) + '\n');

// Summary by category
const byCategory = {};
for (const result of results) {
  if (!byCategory[result.category]) byCategory[result.category] = { correct: 0, total: 0 };
  if (result.correct) byCategory[result.category].correct++;
  byCategory[result.category].total++;
}

console.log('By Category:');
for (const [cat, stats] of Object.entries(byCategory)) {
  const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  console.log(`  ${cat}: ${stats.correct}/${stats.total} (${pct}%)`);
}
console.log();
