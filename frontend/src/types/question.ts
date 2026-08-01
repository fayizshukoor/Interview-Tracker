export type QuestionType = 'normal' | 'code_snippet';

export interface Question {
  id: string;
  questionText: string;
  expectedAnswer: string;
  topic: string;
  questionType: QuestionType;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionPayload {
  questionText: string;
  expectedAnswer: string;
  topic: string;
  questionType: QuestionType;
}
