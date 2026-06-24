import * as reviewTheoryQuestionService from './services/reviewTheoryQuestionService.js';
import { pool } from './config/db.js';

// ---------------------------------------------------------------------------
// Replace these with real IDs from your database before running.
// Run testReviewService.ts to get a review id.
// Run testQuestionService.ts or query the questions table for question ids.
// ---------------------------------------------------------------------------
const REVIEW_ID    = 'af0b75ae-6e49-4194-8180-9d5d27c94ecf';
const QUESTION_ID_1 = 'a007612f-663d-47f8-af06-c2b3e942bbb9';
const QUESTION_ID_2 = '0f27751f-d941-418d-9d8d-e334414ea2e4';

async function run(): Promise<void> {
  // 1. Add both questions to the review
  console.log('--- Add questions to review ---');
  const added = await reviewTheoryQuestionService.addQuestionsToReview(
    REVIEW_ID,
    [QUESTION_ID_1, QUESTION_ID_2],
  );
  console.log(`Added ${added.length} question(s):`);
  added.forEach((q) => console.log(`  [${q.id}] ${q.questionText} (result: ${q.result ?? 'unmarked'})`));

  // 2. Fetch all questions for the review
  console.log('\n--- Questions for review ---');
  const questions = await reviewTheoryQuestionService.getQuestionsForReview(REVIEW_ID);
  console.log(`Total: ${questions.length}`);
  questions.forEach((q) => console.log(`  [${q.id}] ${q.questionText} (result: ${q.result ?? 'unmarked'})`));

  // 3. Mark the first question as correct
  console.log('\n--- Mark first question as correct ---');
  const firstId = questions[0]?.id;
  if (!firstId) {
    console.log('No questions found to mark.');
    return;
  }

  const marked = await reviewTheoryQuestionService.markQuestionResult(firstId, 'correct');
  console.log(`Marked: [${marked.id}] ${marked.questionText} -> result: ${marked.result}`);
}

run()
  .catch((err: unknown) => {
    console.error('Unexpected error:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
