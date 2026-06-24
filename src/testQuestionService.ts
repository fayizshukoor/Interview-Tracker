import * as questionService from './services/questionService.js';
import { pool } from './config/db.js';

async function run(): Promise<void> {
  // 1. Create a question
  console.log('--- Create question ---');
  const created = await questionService.createQuestion(
    'What is a loop?',
    'A loop is used to execute a block of code repeatedly.',
    'Loops',
  );
  console.log('Created:', created);

  // 2. Get all questions
  console.log('\n--- All questions ---');
  const all = await questionService.getAllQuestions();
  console.log(`Total: ${all.length}`);
  all.forEach((q) => console.log(`  [${q.topic}] ${q.questionText}`));

  // 3. Get questions by topic
  console.log('\n--- Questions by topic "Loops" ---');
  const byTopic = await questionService.getQuestionsByTopic('Loops');
  console.log(`Found: ${byTopic.length}`);
  byTopic.forEach((q) => console.log(`  ${q.questionText}`));

  // 4. Validation — empty questionText should throw
  console.log('\n--- Validation: empty questionText ---');
  try {
    await questionService.createQuestion('', 'Some answer', 'Some topic');
    console.log('ERROR: Expected an error but none was thrown.');
  } catch (err) {
    console.log('Caught expected error:', err instanceof Error ? err.message : err);
  }
}

run()
  .catch((err: unknown) => {
    console.error('Unexpected error:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
