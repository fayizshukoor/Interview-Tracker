import {
  createCandidate,
  getAllCandidates,
} from './services/candidateService.js';

import { pool } from './config/db.js';

async function main() {
  try {
    console.log('Creating Rahul...');
    const candidate = await createCandidate('Rahul');
    console.log(candidate);

    console.log('\nCreating empty candidate...');
    await createCandidate('   ');
  } catch (error) {
    console.log(
      'Expected error:',
      error instanceof Error ? error.message : error
    );
  }

  try {
    console.log('\nCreating duplicate Rahul...');
    await createCandidate('Rahul');
  } catch (error) {
    console.log(
      'Expected error:',
      error instanceof Error ? error.message : error
    );
  }

  const candidates = await getAllCandidates();

  console.log('\nAll candidates:');
  console.log(candidates);
}

main()
  .catch(console.error)
  .finally(async () => {
    await pool.end();
  });