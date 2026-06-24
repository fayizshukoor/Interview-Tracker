import * as reviewService from './services/reviewService.js';

async function main(): Promise<void> {
  try {
    const review = await reviewService.createReview(
      '0e8d1582-d555-4fe7-ba12-7086e63caada'
    );

    console.log('Review created:');
    console.log(review);
  } catch (err) {
    console.error(
      err instanceof Error ? err.message : err
    );
  }
}

main();