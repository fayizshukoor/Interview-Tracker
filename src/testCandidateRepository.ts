import * as candidateRepository from './repositories/candidateRepository.js';
import { pool } from './config/db.js';

async function main() {
  console.log('Creating candidate...');

  const created = await candidateRepository.create('Fayiz');

  console.log('Created:', created);

  const found = await candidateRepository.findByName('Fayiz');

  console.log('Found:', found);

  const all = await candidateRepository.findAll();

  console.log('All candidates:', all);
}

main()
  .catch(console.error)
  .finally(async () => {
    await pool.end();
  });