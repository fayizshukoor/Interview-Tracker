# Interview Tracker — Software Specification Document

**Version:** 1.0
**Date:** June 19, 2026
**Status:** Draft

---

## Table of Contents

1. [Functional Requirements](#1-functional-requirements)
2. [Non-Functional Requirements](#2-non-functional-requirements)
3. [User Stories](#3-user-stories)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Folder Structure](#6-folder-structure)
7. [Development Roadmap](#7-development-roadmap)

---

## 1. Functional Requirements

### 1.1 Candidate Management

- FR-01: The system shall allow an interviewer to create a new candidate profile with a name.
- FR-02: The system shall allow an interviewer to search and select an existing candidate before starting a review.
- FR-03: The system shall display the full review history of a selected candidate, ordered by date (most recent first).
- FR-04: Each review record in the history shall show date, theory score, practical score, pending topics, and feedback.

### 1.2 Question Bank Management

- FR-05: The system shall maintain a persistent question bank.
- FR-06: Each question shall have: question text, expected answer points, and topic.
- FR-07: An interviewer shall be able to add, edit, and delete questions from the bank.
- FR-08: Questions shall be filterable and searchable by topic.

### 1.3 Theory Review

- FR-09: During a review, the interviewer shall be able to select any number of questions from the bank (default: 10).
- FR-10: The interviewer shall mark each selected question as Correct or Incorrect.
- FR-11: Theory score shall be auto-calculated as: (correct count / total selected) x 100.
- FR-12: Questions marked Incorrect shall be automatically added to the Pending Topics list for that review.

### 1.4 Practical Review

- FR-13: The interviewer shall be able to add one or more practical questions or tasks per review.
- FR-14: The interviewer shall enter a numeric score (0-100) for each practical task.
- FR-15: The overall practical score shall be the average of all practical task scores.

### 1.5 Review Result

- FR-16: A completed review shall store: theory score, practical score, pending topics list, and free-text feedback.
- FR-17: The system shall generate a review summary combining scores, pending topics, and feedback.
- FR-18: A review shall support a draft state and a finalized state.

### 1.6 Dashboard

- FR-19: The dashboard shall show the total number of reviews conducted.
- FR-20: The dashboard shall list all candidates with their most recent review date and scores.
- FR-21: The dashboard shall display the most frequently failed topics across all reviews.
- FR-22: The dashboard shall support filtering by date range.

---

## 2. Non-Functional Requirements

### 2.1 Performance

- NFR-01: API responses for list endpoints shall complete within 500ms under normal load.
- NFR-02: Dashboard aggregation queries shall complete within 1 second for up to 10,000 review records.

### 2.2 Reliability

- NFR-03: The system shall persist all finalized reviews durably in PostgreSQL.
- NFR-04: Draft reviews shall not be lost on accidental page reload (auto-save or session persistence).

### 2.3 Scalability

- NFR-05: The architecture shall support horizontal scaling of the API layer without shared in-process state.
- NFR-06: Database queries shall use indexed columns for candidate lookups and topic aggregations.

### 2.4 Maintainability

- NFR-07: The codebase shall follow Clean Architecture principles with clear separation between domain, application, infrastructure, and presentation layers.
- NFR-08: All dependencies shall be injected; no layer shall directly instantiate its dependencies.
- NFR-09: The codebase shall be fully typed in TypeScript with strict mode enabled.
- NFR-10: Each module shall have a single responsibility.

### 2.5 Security

- NFR-11: All API inputs shall be validated and sanitized before processing.
- NFR-12: The API shall be protected by authentication (JWT-based) so only authorized interviewers can access data.
- NFR-13: Database credentials shall be managed via environment variables, never hardcoded.

### 2.6 Usability

- NFR-14: The UI shall provide clear feedback for all user actions (success, error, loading states).
- NFR-15: The review workflow shall be completable in a single, linear page flow without unnecessary navigation.

### 2.7 Testability

- NFR-16: Business logic in the domain and application layers shall be unit-testable without a database or HTTP dependency.
- NFR-17: Integration tests shall cover all API endpoints.

---

## 3. User Stories

### Candidate Management

**US-01 — Add a Candidate**
> As an interviewer, I want to add a new candidate by name so that I can start tracking their reviews.

Acceptance Criteria:
- I can enter a candidate name and save it.
- The system rejects duplicate names (case-insensitive) with a clear message.
- The new candidate appears in the candidate list immediately.

**US-02 — View Candidate History**
> As an interviewer, I want to view all past reviews for a candidate so that I can understand their progress over time.

Acceptance Criteria:
- I can search or select a candidate and see all their reviews.
- Each review entry shows date, theory score, practical score, and pending topics.
- Reviews are ordered most-recent first.

---

### Question Bank

**US-03 — Add a Question**
> As an interviewer, I want to add a question to the bank with a topic and expected answer points so that it can be used in future reviews.

Acceptance Criteria:
- I can fill in question text, expected answer, and topic, then save.
- The question immediately appears when filtering by its topic.

**US-04 — Edit or Delete a Question**
> As an interviewer, I want to edit or delete existing questions so that the bank stays accurate and relevant.

Acceptance Criteria:
- I can modify any field of an existing question and save.
- I can delete a question with a confirmation prompt.
- Deleting a question does not affect historical reviews that already used it.

**US-05 — Browse Questions by Topic**
> As an interviewer, I want to filter questions by topic so that I can quickly find relevant questions for a review.

Acceptance Criteria:
- A topic filter shows only questions matching that topic.
- Clearing the filter shows all questions.

---

### Theory Review

**US-06 — Select Questions for a Review**
> As an interviewer, I want to pick questions from the bank for a theory review so that I can test the candidate on specific topics.

Acceptance Criteria:
- I can browse and select any number of questions (at least 1).
- Selected questions are shown in a review checklist.
- I can deselect a question before finalizing.

**US-07 — Mark Question Results**
> As an interviewer, I want to mark each question as Correct or Incorrect so that the theory score is calculated automatically.

Acceptance Criteria:
- Each question in the checklist has a Correct / Incorrect toggle.
- Theory score updates in real time as I mark questions.
- All Incorrect questions are listed as Pending Topics automatically.

---

### Practical Review

**US-08 — Add Practical Tasks**
> As an interviewer, I want to add practical tasks and assign scores so that the practical portion of the review is recorded.

Acceptance Criteria:
- I can add one or more task descriptions with scores (0–100).
- I can remove a task before finalizing.
- The overall practical score shows the average of all task scores.

---

### Review Result

**US-09 — Add Feedback and Finalize a Review**
> As an interviewer, I want to add free-text feedback and finalize the review so that a complete record is stored for the candidate.

Acceptance Criteria:
- I can type free-text feedback before finalizing.
- Finalizing locks the review and stores it permanently.
- A summary screen shows theory score, practical score, pending topics, and feedback.

**US-10 — Save a Draft Review**
> As an interviewer, I want to save a review as a draft so that I can continue it later without losing progress.

Acceptance Criteria:
- I can save at any point in the review flow.
- Returning to the candidate shows the in-progress draft.
- Only one draft is allowed per candidate at a time.

---

### Dashboard

**US-11 — View Dashboard Overview**
> As an interviewer, I want to see a high-level overview so that I can quickly understand overall review activity.

Acceptance Criteria:
- Total reviews count is visible at a glance.
- A table lists all candidates with their last review date and scores.
- The top N most-failed topics are displayed with failure counts.

**US-12 — Filter Dashboard by Date**
> As an interviewer, I want to filter the dashboard by date range so that I can focus on a specific period.

Acceptance Criteria:
- I can set a start date and end date.
- All dashboard metrics update to reflect only reviews in that range.
- Clearing the filter restores the full view.

---

## 4. Database Design

### Overview

The database is PostgreSQL. All tables use UUID primary keys generated by the application layer. Timestamps use `TIMESTAMPTZ`.

---

### Entity Relationship Summary

```
candidates         1 ──< reviews
questions          1 ──< review_theory_questions
reviews            1 ──< review_theory_questions
reviews            1 ──< review_practical_tasks
reviews            1 ──< review_pending_topics
questions          >── topic (string, not a separate table initially)
```

---

### Table Definitions

#### `candidates`

| Column       | Type          | Constraints              |
|--------------|---------------|--------------------------|
| id           | UUID          | PK, default gen_random_uuid() |
| name         | VARCHAR(255)  | NOT NULL, UNIQUE (case-insensitive via CITEXT or lower() index) |
| created_at   | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |
| updated_at   | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |

---

#### `questions`

| Column           | Type          | Constraints              |
|------------------|---------------|--------------------------|
| id               | UUID          | PK                       |
| question_text    | TEXT          | NOT NULL                 |
| expected_answer  | TEXT          | NOT NULL                 |
| topic            | VARCHAR(255)  | NOT NULL, INDEXED        |
| created_at       | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |
| updated_at       | TIMESTAMPTZ   | NOT NULL, DEFAULT now()  |

---

#### `reviews`

| Column            | Type          | Constraints                                 |
|-------------------|---------------|---------------------------------------------|
| id                | UUID          | PK                                          |
| candidate_id      | UUID          | NOT NULL, FK → candidates(id)               |
| status            | VARCHAR(20)   | NOT NULL, CHECK IN ('draft', 'finalized')   |
| theory_score      | NUMERIC(5,2)  | NULLABLE (computed on finalize)             |
| practical_score   | NUMERIC(5,2)  | NULLABLE (computed on finalize)             |
| feedback          | TEXT          | NULLABLE                                    |
| conducted_at      | TIMESTAMPTZ   | NULLABLE (set on finalize)                  |
| created_at        | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                     |
| updated_at        | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                     |

Index: `(candidate_id, conducted_at DESC)` for history queries.

---

#### `review_theory_questions`

Stores a snapshot of each question used in a review (snapshot protects history from question edits/deletes).

| Column           | Type          | Constraints                           |
|------------------|---------------|---------------------------------------|
| id               | UUID          | PK                                    |
| review_id        | UUID          | NOT NULL, FK → reviews(id) ON DELETE CASCADE |
| question_id      | UUID          | NULLABLE, FK → questions(id) ON DELETE SET NULL |
| question_text    | TEXT          | NOT NULL (snapshot)                   |
| expected_answer  | TEXT          | NOT NULL (snapshot)                   |
| topic            | VARCHAR(255)  | NOT NULL (snapshot)                   |
| result           | VARCHAR(20)   | NULLABLE, CHECK IN ('correct', 'incorrect') |
| created_at       | TIMESTAMPTZ   | NOT NULL, DEFAULT now()               |

---

#### `review_practical_tasks`

| Column       | Type          | Constraints                                  |
|--------------|---------------|----------------------------------------------|
| id           | UUID          | PK                                           |
| review_id    | UUID          | NOT NULL, FK → reviews(id) ON DELETE CASCADE |
| task_text    | TEXT          | NOT NULL                                     |
| score        | NUMERIC(5,2)  | NOT NULL, CHECK (score >= 0 AND score <= 100)|
| created_at   | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                      |

---

#### `review_pending_topics`

Stored explicitly for fast dashboard aggregation (denormalized from incorrect theory questions).

| Column       | Type          | Constraints                                  |
|--------------|---------------|----------------------------------------------|
| id           | UUID          | PK                                           |
| review_id    | UUID          | NOT NULL, FK → reviews(id) ON DELETE CASCADE |
| topic        | VARCHAR(255)  | NOT NULL                                     |
| question_text| TEXT          | NOT NULL                                     |

Index: `(topic)` for frequency aggregation queries.

---

### Key Design Decisions

1. **Snapshot pattern** — `review_theory_questions` copies question text at review time. Editing or deleting a question never corrupts historical review data.
2. **Denormalized pending topics** — Stored as a separate table to enable efficient `GROUP BY topic` aggregation on the dashboard without scanning all theory results.
3. **Scores stored on `reviews`** — Theory and practical scores are computed and stored on finalization, avoiding repeated aggregation on reads.
4. **CITEXT or functional index** — Candidate name uniqueness is enforced case-insensitively.

---

## 5. API Design

Base URL: `/api/v1`  
Content-Type: `application/json`  
Authentication: `Authorization: Bearer <JWT>` on all endpoints.

---

### 5.1 Candidates

#### `POST /candidates`
Create a new candidate.

Request body:
```json
{ "name": "Jane Smith" }
```
Response `201`:
```json
{ "id": "uuid", "name": "Jane Smith", "createdAt": "ISO8601" }
```
Errors: `400` invalid input, `409` name already exists.

---

#### `GET /candidates`
List all candidates with optional search.

Query params: `search` (string, partial name match), `page`, `limit`.

Response `200`:
```json
{
  "data": [
    { "id": "uuid", "name": "Jane Smith", "lastReviewAt": "ISO8601", "lastTheoryScore": 80, "lastPracticalScore": 75 }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

#### `GET /candidates/:id`
Get a single candidate's details.

Response `200`: candidate object with `id`, `name`, `createdAt`.  
Error: `404` not found.

---

#### `GET /candidates/:id/reviews`
Get review history for a candidate, ordered by `conductedAt DESC`.

Query params: `page`, `limit`, `from` (date), `to` (date).

Response `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "finalized",
      "theoryScore": 80,
      "practicalScore": 75,
      "pendingTopics": ["Closures", "Promises"],
      "feedback": "Good overall, needs work on async.",
      "conductedAt": "ISO8601"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

---

### 5.2 Question Bank

#### `POST /questions`
Add a question to the bank.

Request body:
```json
{ "questionText": "...", "expectedAnswer": "...", "topic": "JavaScript" }
```
Response `201`: question object.

---

#### `GET /questions`
List questions with optional filters.

Query params: `topic`, `search`, `page`, `limit`.

Response `200`: paginated list of question objects.

---

#### `GET /questions/:id`
Get a single question.

---

#### `PUT /questions/:id`
Update a question.

Request body: any subset of `questionText`, `expectedAnswer`, `topic`.

Response `200`: updated question object.

---

#### `DELETE /questions/:id`
Delete a question.

Response `204`.  
Note: Questions referenced in reviews are soft-deleted (FK set to NULL via ON DELETE SET NULL, snapshot preserved).

---

#### `GET /questions/topics`
Return a distinct list of all topics in the bank.

Response `200`:
```json
{ "topics": ["JavaScript", "Node.js", "SQL"] }
```

---

### 5.3 Reviews

#### `POST /reviews`
Start a new review (creates a draft).

Request body:
```json
{ "candidateId": "uuid" }
```
Response `201`:
```json
{ "id": "uuid", "candidateId": "uuid", "status": "draft", "createdAt": "ISO8601" }
```
Error: `409` if candidate already has an active draft.

---

#### `GET /reviews/:id`
Get full review details including theory questions, practical tasks, pending topics.

Response `200`:
```json
{
  "id": "uuid",
  "candidateId": "uuid",
  "status": "draft",
  "theoryScore": null,
  "practicalScore": null,
  "feedback": null,
  "theoryQuestions": [
    { "id": "uuid", "questionText": "...", "topic": "...", "result": "correct" }
  ],
  "practicalTasks": [
    { "id": "uuid", "taskText": "...", "score": 85 }
  ],
  "pendingTopics": [],
  "conductedAt": null
}
```

---

#### `PUT /reviews/:id`
Update draft review fields (feedback only at this level; questions and tasks have their own sub-routes).

Request body: `{ "feedback": "..." }`

Response `200`: updated review object.

---

#### `POST /reviews/:id/finalize`
Finalize a draft review. Computes and stores scores, locks the record.

Response `200`: finalized review object with computed `theoryScore`, `practicalScore`, `pendingTopics`, `conductedAt`.

Errors: `400` if review has no questions or tasks, `409` if already finalized.

---

### 5.4 Review — Theory Questions

#### `POST /reviews/:id/theory-questions`
Add selected questions to the review (bulk).

Request body:
```json
{ "questionIds": ["uuid1", "uuid2"] }
```
Response `201`: array of created `review_theory_questions` objects (with snapshots).

---

#### `PATCH /reviews/:id/theory-questions/:questionId`
Mark a theory question result.

Request body: `{ "result": "correct" | "incorrect" }`

Response `200`: updated theory question object.

---

#### `DELETE /reviews/:id/theory-questions/:questionId`
Remove a question from the review (draft only).

Response `204`.

---

### 5.5 Review — Practical Tasks

#### `POST /reviews/:id/practical-tasks`
Add a practical task.

Request body: `{ "taskText": "Build a REST API endpoint", "score": 80 }`

Response `201`: practical task object.

---

#### `PUT /reviews/:id/practical-tasks/:taskId`
Update a practical task's text or score.

Response `200`: updated task object.

---

#### `DELETE /reviews/:id/practical-tasks/:taskId`
Remove a practical task (draft only).

Response `204`.

---

### 5.6 Dashboard

#### `GET /dashboard/summary`
High-level stats.

Query params: `from` (date), `to` (date).

Response `200`:
```json
{
  "totalReviews": 120,
  "totalCandidates": 45,
  "averageTheoryScore": 72.4,
  "averagePracticalScore": 68.1,
  "topFailedTopics": [
    { "topic": "Closures", "failureCount": 34 },
    { "topic": "SQL Joins", "failureCount": 28 }
  ]
}
```

---

#### `GET /dashboard/candidates`
Candidate list with latest review metadata (same as `GET /candidates` but with dashboard-specific fields pre-computed).

Query params: `from`, `to`, `page`, `limit`.

---

### 5.7 Error Response Format

All errors follow:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [ { "field": "name", "issue": "required" } ]
  }
}
```

---

## 6. Folder Structure

```
interview-tracker/
├── src/
│   ├── domain/                         # Enterprise business rules (no framework dependencies)
│   │   ├── entities/
│   │   │   ├── Candidate.ts
│   │   │   ├── Question.ts
│   │   │   ├── Review.ts
│   │   │   ├── ReviewTheoryQuestion.ts
│   │   │   ├── ReviewPracticalTask.ts
│   │   │   └── ReviewPendingTopic.ts
│   │   ├── value-objects/
│   │   │   ├── ReviewStatus.ts         # 'draft' | 'finalized'
│   │   │   ├── QuestionResult.ts       # 'correct' | 'incorrect'
│   │   │   └── Score.ts                # 0–100 validated numeric
│   │   ├── repositories/               # Interfaces only (contracts)
│   │   │   ├── ICandidateRepository.ts
│   │   │   ├── IQuestionRepository.ts
│   │   │   └── IReviewRepository.ts
│   │   └── errors/
│   │       ├── DomainError.ts
│   │       ├── NotFoundError.ts
│   │       ├── ConflictError.ts
│   │       └── ValidationError.ts
│   │
│   ├── application/                    # Use cases / application services
│   │   ├── candidates/
│   │   │   ├── CreateCandidateUseCase.ts
│   │   │   ├── GetCandidateUseCase.ts
│   │   │   ├── ListCandidatesUseCase.ts
│   │   │   └── GetCandidateReviewHistoryUseCase.ts
│   │   ├── questions/
│   │   │   ├── CreateQuestionUseCase.ts
│   │   │   ├── UpdateQuestionUseCase.ts
│   │   │   ├── DeleteQuestionUseCase.ts
│   │   │   ├── ListQuestionsUseCase.ts
│   │   │   └── GetTopicsUseCase.ts
│   │   ├── reviews/
│   │   │   ├── StartReviewUseCase.ts
│   │   │   ├── GetReviewUseCase.ts
│   │   │   ├── UpdateReviewUseCase.ts
│   │   │   ├── FinalizeReviewUseCase.ts
│   │   │   ├── AddTheoryQuestionsUseCase.ts
│   │   │   ├── MarkTheoryQuestionUseCase.ts
│   │   │   ├── RemoveTheoryQuestionUseCase.ts
│   │   │   ├── AddPracticalTaskUseCase.ts
│   │   │   ├── UpdatePracticalTaskUseCase.ts
│   │   │   └── RemovePracticalTaskUseCase.ts
│   │   └── dashboard/
│   │       ├── GetDashboardSummaryUseCase.ts
│   │       └── GetDashboardCandidatesUseCase.ts
│   │
│   ├── infrastructure/                 # Frameworks, DB, external services
│   │   ├── database/
│   │   │   ├── connection.ts           # PostgreSQL pool setup (pg or knex)
│   │   │   ├── migrations/             # SQL migration files
│   │   │   │   ├── 001_create_candidates.sql
│   │   │   │   ├── 002_create_questions.sql
│   │   │   │   ├── 003_create_reviews.sql
│   │   │   │   ├── 004_create_review_theory_questions.sql
│   │   │   │   ├── 005_create_review_practical_tasks.sql
│   │   │   │   └── 006_create_review_pending_topics.sql
│   │   │   └── seeds/                  # Optional seed data
│   │   ├── repositories/               # Concrete implementations
│   │   │   ├── PgCandidateRepository.ts
│   │   │   ├── PgQuestionRepository.ts
│   │   │   └── PgReviewRepository.ts
│   │   └── container/
│   │       └── container.ts            # DI container (tsyringe or manual)
│   │
│   ├── presentation/                   # HTTP layer
│   │   ├── http/
│   │   │   ├── app.ts                  # Express app factory
│   │   │   ├── server.ts               # Entry point (starts server)
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── authMiddleware.ts
│   │   │   │   ├── validateRequest.ts
│   │   │   │   └── requestLogger.ts
│   │   │   ├── routes/
│   │   │   │   ├── candidateRoutes.ts
│   │   │   │   ├── questionRoutes.ts
│   │   │   │   ├── reviewRoutes.ts
│   │   │   │   └── dashboardRoutes.ts
│   │   │   ├── controllers/
│   │   │   │   ├── CandidateController.ts
│   │   │   │   ├── QuestionController.ts
│   │   │   │   ├── ReviewController.ts
│   │   │   │   └── DashboardController.ts
│   │   │   └── validators/             # Zod or Joi schemas
│   │   │       ├── candidateValidator.ts
│   │   │       ├── questionValidator.ts
│   │   │       └── reviewValidator.ts
│   │   └── dto/                        # Request/Response shape types
│   │       ├── candidate.dto.ts
│   │       ├── question.dto.ts
│   │       └── review.dto.ts
│   │
│   └── shared/
│       ├── types/
│       │   └── pagination.ts
│       └── utils/
│           ├── uuid.ts
│           └── dateUtils.ts
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   └── application/
│   └── integration/
│       └── api/
│
├── .env.example
├── .eslintrc.json
├── tsconfig.json
├── package.json
└── README.md
```

### Architecture Layer Rules

| Layer | Can depend on | Cannot depend on |
|---|---|---|
| `domain` | Nothing external | `application`, `infrastructure`, `presentation` |
| `application` | `domain` | `infrastructure`, `presentation` |
| `infrastructure` | `domain`, `application` | `presentation` |
| `presentation` | `application`, `domain` (DTOs/errors) | `infrastructure` directly |

Dependency Inversion: `presentation` calls `application` use cases; use cases depend on `domain` repository interfaces; `infrastructure` provides concrete implementations injected at startup via the DI container.

---

## 7. Development Roadmap

### Phase 0 — Project Setup (Day 1–2)

- [ ] Initialize Node.js + TypeScript project (`tsconfig.json`, `eslint`, `prettier`)
- [ ] Install core dependencies: `express`, `pg`, `zod`, `tsyringe` (or manual DI), `jsonwebtoken`, `dotenv`
- [ ] Install dev dependencies: `ts-node-dev`, `jest`, `supertest`, `@types/*`
- [ ] Set up PostgreSQL connection and migration runner
- [ ] Run migration `001` through `006` to create all tables
- [ ] Configure environment variables (`.env.example`)
- [ ] Scaffold folder structure and layer boundaries

**Deliverable:** Project boots, connects to DB, and returns `200` from a health check endpoint.

---

### Phase 1 — Domain & Repository Contracts (Day 3–4)

- [ ] Define all domain entities with business logic (e.g., `Review.finalize()`, `Review.computeScores()`)
- [ ] Define value objects (`ReviewStatus`, `QuestionResult`, `Score`)
- [ ] Define repository interfaces (`ICandidateRepository`, `IQuestionRepository`, `IReviewRepository`)
- [ ] Write unit tests for domain entities

**Deliverable:** Domain layer fully typed and unit-tested; no DB or HTTP involved.

---

### Phase 2 — Infrastructure: Repositories (Day 5–7)

- [ ] Implement `PgCandidateRepository`
- [ ] Implement `PgQuestionRepository`
- [ ] Implement `PgReviewRepository` (includes theory questions, practical tasks, pending topics)
- [ ] Set up DI container wiring repositories to interfaces
- [ ] Write integration tests for each repository against a test DB

**Deliverable:** All data can be persisted and retrieved via repository implementations.

---

### Phase 3 — Application Use Cases (Day 8–11)

- [ ] Implement Candidate use cases (Create, List, Get, History)
- [ ] Implement Question use cases (Create, Update, Delete, List, Topics)
- [ ] Implement Review use cases (Start, Get, Update, Finalize)
- [ ] Implement Theory Question use cases (Add, Mark, Remove)
- [ ] Implement Practical Task use cases (Add, Update, Remove)
- [ ] Implement Dashboard use cases (Summary, Candidates)
- [ ] Write unit tests for each use case (with mocked repositories)

**Deliverable:** All business workflows are implemented and tested independently of HTTP.

---

### Phase 4 — Presentation: API Layer (Day 12–15)

- [ ] Create Express app with middleware (logger, error handler, auth)
- [ ] Implement JWT auth middleware and stub auth endpoint
- [ ] Build and wire all routes and controllers
- [ ] Implement request validators (Zod schemas)
- [ ] Map domain errors to HTTP status codes in the error handler
- [ ] Write integration tests for all API endpoints using `supertest`

**Deliverable:** All API endpoints are functional and return correct responses with validation and error handling.

---

### Phase 5 — Dashboard & Aggregations (Day 16–17)

- [ ] Implement `GET /dashboard/summary` with DB-level aggregations
- [ ] Implement top failed topics query (GROUP BY on `review_pending_topics`)
- [ ] Add date range filtering across dashboard queries
- [ ] Performance test dashboard queries with realistic data volume

**Deliverable:** Dashboard API is accurate and performant.

---

### Phase 6 — Hardening & Polish (Day 18–20)

- [ ] Add indexes identified during performance testing
- [ ] Validate all edge cases (empty reviews, no questions, duplicate candidates)
- [ ] Complete `.env.example` documentation
- [ ] Write README with setup and run instructions
- [ ] Final end-to-end review of all API contracts against spec

**Deliverable:** Production-ready backend API.

---

### Optional Phase 7 — Frontend (Post-backend)

- [ ] Choose frontend framework (React + TypeScript recommended)
- [ ] Build candidate management screens
- [ ] Build review workflow (question selection, marking, practical tasks)
- [ ] Build review summary screen
- [ ] Build dashboard screen with charts

---

### Dependency Summary

| Package | Purpose |
|---|---|
| `express` | HTTP server |
| `pg` | PostgreSQL client |
| `zod` | Request validation and schema definition |
| `tsyringe` | Dependency injection container |
| `jsonwebtoken` | JWT creation and verification |
| `dotenv` | Environment variable loading |
| `ts-node-dev` | TypeScript dev server with hot reload |
| `jest` | Test runner |
| `supertest` | HTTP integration testing |
| `@types/express`, `@types/pg`, `@types/jest` | TypeScript type definitions |

---

*End of Specification Document*
