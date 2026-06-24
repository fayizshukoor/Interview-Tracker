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
