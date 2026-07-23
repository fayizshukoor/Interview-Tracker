export interface Candidate {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  questionText: string;
  expectedAnswer: string;
  topic: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  candidateId: string;
  status: string;
  theoryScore: number | null;
  practicalScore: number | null;
  feedback: string | null;
  conductedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type QuestionResult = 'correct' | 'incorrect';

export interface ReviewTheoryQuestion {
  id: string;
  reviewId: string;
  questionId: string | null;
  questionText: string;
  expectedAnswer: string;
  topic: string;
  result: QuestionResult | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewPendingTopic {
  id: string;
  reviewId: string;
  topic: string;
  questionText: string;
  createdAt: Date;
}

export interface ReviewPracticalTask {
  id: string;
  reviewId: string;
  taskText: string;
  expectedAnswer: string | null;
  score: number | null;
  createdAt: Date;
  updatedAt: Date;
}
