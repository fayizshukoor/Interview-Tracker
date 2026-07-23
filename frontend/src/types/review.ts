export interface Review {
  id: string;
  candidateId: string;
  status: string;
  theoryScore: number | null;
  practicalScore: number | null;
  feedback: string | null;
  conductedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPendingTopic {
  id: string;
  reviewId: string;
  topic: string;
  questionText: string;
  createdAt: string;
}

export interface ReviewPracticalTask {
  id: string;
  reviewId: string;
  taskText: string;
  expectedAnswer: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PracticalQuestion {
  id: string;
  taskText: string;
  expectedAnswer: string | null;
  topic: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListItem extends Review {
  candidateName: string;
  questionCount: number;
}

export interface ReviewTheoryQuestion {
  id: string;
  reviewId: string;
  questionId: string | null;
  questionText: string;
  expectedAnswer: string;
  topic: string;
  result: 'correct' | 'incorrect' | null;
  createdAt: string;
  updatedAt: string;
}
