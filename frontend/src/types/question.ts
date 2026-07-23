export interface Question {
  id: string;
  questionText: string;
  expectedAnswer: string;
  topic: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionPayload {
  questionText: string;
  expectedAnswer: string;
  topic: string;
}
