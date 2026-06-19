# Interview Tracker — Backend Architecture Reference

**Purpose:** File-by-file reference. Every file in the backend is listed with its exact responsibility, the interface it exposes or implements, and its dependencies. No implementation code — signatures and contracts only.

**Stack:** TypeScript (strict) · Node.js · Express.js · PostgreSQL  
**Patterns:** Clean Architecture · Repository Pattern · Manual Constructor Injection

---

## Folder Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── Candidate.ts
│   │   ├── Question.ts
│   │   ├── Review.ts
│   │   ├── ReviewTheoryQuestion.ts
│   │   ├── ReviewPracticalTask.ts
│   │   └── ReviewPendingTopic.ts
│   ├── value-objects/
│   │   ├── ReviewStatus.ts
│   │   ├── QuestionResult.ts
│   │   └── Score.ts
│   ├── repositories/
│   │   ├── ICandidateRepository.ts
│   │   ├── IQuestionRepository.ts
│   │   └── IReviewRepository.ts
│   ├── services/
│   │   └── ReviewScoringService.ts
│   └── errors/
│       ├── DomainError.ts
│       ├── NotFoundError.ts
│       ├── ConflictError.ts
│       └── ValidationError.ts
├── application/
│   ├── common/
│   │   ├── UseCase.ts
│   │   └── PaginationInput.ts
│   ├── candidates/
│   │   ├── CreateCandidateUseCase.ts
│   │   ├── GetCandidateUseCase.ts
│   │   ├── ListCandidatesUseCase.ts
│   │   └── GetCandidateHistoryUseCase.ts
│   ├── questions/
│   │   ├── CreateQuestionUseCase.ts
│   │   ├── UpdateQuestionUseCase.ts
│   │   ├── DeleteQuestionUseCase.ts
│   │   ├── ListQuestionsUseCase.ts
│   │   └── GetTopicsUseCase.ts
│   ├── reviews/
│   │   ├── StartReviewUseCase.ts
│   │   ├── GetReviewUseCase.ts
│   │   ├── UpdateReviewUseCase.ts
│   │   └── FinalizeReviewUseCase.ts
│   ├── theory-questions/
│   │   ├── AddTheoryQuestionsUseCase.ts
│   │   ├── MarkTheoryQuestionUseCase.ts
│   │   └── RemoveTheoryQuestionUseCase.ts
│   ├── practical-tasks/
│   │   ├── AddPracticalTaskUseCase.ts
│   │   ├── UpdatePracticalTaskUseCase.ts
│   │   └── RemovePracticalTaskUseCase.ts
│   └── dashboard/
│       ├── GetDashboardSummaryUseCase.ts
│       └── GetDashboardCandidatesUseCase.ts
├── infrastructure/
│   ├── database/
│   │   ├── connection.ts
│   │   ├── migrate.ts
│   │   ├── seed.ts
│   │   ├── migrations/  (001–008 .sql files)
│   │   └── seeds/
│   │       └── questionBank.seed.sql
│   ├── repositories/
│   │   ├── PgCandidateRepository.ts
│   │   ├── PgQuestionRepository.ts
│   │   └── PgReviewRepository.ts
│   └── container/
│       └── container.ts
├── presentation/
│   ├── http/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── validateRequest.ts
│   │   │   └── requestLogger.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── candidateRoutes.ts
│   │   │   ├── questionRoutes.ts
│   │   │   ├── reviewRoutes.ts
│   │   │   └── dashboardRoutes.ts
│   │   ├── controllers/
│   │   │   ├── CandidateController.ts
│   │   │   ├── QuestionController.ts
│   │   │   ├── ReviewController.ts
│   │   │   └── DashboardController.ts
│   │   └── validators/
│   │       ├── candidateValidator.ts
│   │       ├── questionValidator.ts
│   │       └── reviewValidator.ts
│   └── dto/
│       ├── candidate.dto.ts
│       ├── question.dto.ts
│       └── review.dto.ts
└── shared/
    ├── config/
    │   └── env.ts
    ├── types/
    │   └── pagination.ts
    └── utils/
        ├── uuid.ts
        └── dateUtils.ts
```

---

## 1. Domain Layer

**Rule:** Zero external dependencies. No `import` from any npm package or any other layer.

---

### 1.1 Value Objects

#### `domain/value-objects/ReviewStatus.ts`
- **Responsibility:** Constrain the review lifecycle to exactly two valid states.
- **Exports:** `ReviewStatus` — a string literal union `'draft' | 'finalized'`.
- **Used by:** `Review` entity, `IReviewRepository`, all review use cases.

#### `domain/value-objects/QuestionResult.ts`
- **Responsibility:** Constrain a theory question's outcome to two valid states.
- **Exports:** `QuestionResult` — a string literal union `'correct' | 'incorrect'`.
- **Used by:** `ReviewTheoryQuestion` entity, `MarkTheoryQuestionUseCase`.

#### `domain/value-objects/Score.ts`
- **Responsibility:** Wrap a numeric score and reject construction if value is outside 0–100.
- **Exports:** `Score` class with a `value: number` readonly property.
- **Throws:** `ValidationError` on construction if value is out of range.
- **Used by:** `ReviewPracticalTask` entity, `ReviewScoringService`.

---

### 1.2 Entities

Each entity is a class that owns its data, validates its own invariants, and exposes behaviour — not a plain data object.

#### `domain/entities/Candidate.ts`
- **Responsibility:** Represent a candidate profile. Enforce that `name` is a non-empty string.
- **Properties:** `id: string`, `name: string`, `createdAt: Date`, `updatedAt: Date`
- **Behaviour:** Static factory `Candidate.create(name)` — throws `ValidationError` if name is blank.
- **Used by:** `CreateCandidateUseCase`, `ICandidateRepository`.

#### `domain/entities/Question.ts`
- **Responsibility:** Represent a question bank entry. Enforce all three fields are present.
- **Properties:** `id: string`, `questionText: string`, `expectedAnswer: string`, `topic: string`, `isDeleted: boolean`, `createdAt: Date`, `updatedAt: Date`
- **Behaviour:** `softDelete()` — sets `isDeleted = true`. Static factory `Question.create(...)`.
- **Used by:** All question use cases, `IQuestionRepository`, `AddTheoryQuestionsUseCase`.

#### `domain/entities/Review.ts`
- **Responsibility:** Central aggregate. Owns the review's lifecycle and child collections. Enforces that modifications only happen on a draft.
- **Properties:** `id: string`, `candidateId: string`, `status: ReviewStatus`, `theoryScore: number | null`, `practicalScore: number | null`, `feedback: string | null`, `conductedAt: Date | null`, `theoryQuestions: ReviewTheoryQuestion[]`, `practicalTasks: ReviewPracticalTask[]`, `pendingTopics: ReviewPendingTopic[]`
- **Behaviour:**
  - `assertIsDraft()` — throws `ConflictError` if status is `'finalized'`.
  - `finalize(theoryScore, practicalScore)` — sets scores, `conductedAt = now()`, status = `'finalized'`.
  - `setFeedback(text)` — updates feedback, calls `assertIsDraft()`.
- **Used by:** All review use cases, `IReviewRepository`.

#### `domain/entities/ReviewTheoryQuestion.ts`
- **Responsibility:** Snapshot of a question as it existed when selected for a review. Carries the interviewer's result marking.
- **Properties:** `id: string`, `reviewId: string`, `questionId: string | null`, `questionText: string`, `expectedAnswer: string`, `topic: string`, `result: QuestionResult | null`
- **Behaviour:** `mark(result: QuestionResult)` — sets the result. Static factory `ReviewTheoryQuestion.createSnapshot(reviewId, question)`.
- **Used by:** `AddTheoryQuestionsUseCase`, `MarkTheoryQuestionUseCase`, `IReviewRepository`.

#### `domain/entities/ReviewPracticalTask.ts`
- **Responsibility:** A single practical task within a review. Validates score is 0–100.
- **Properties:** `id: string`, `reviewId: string`, `taskText: string`, `score: Score`
- **Behaviour:** Static factory `ReviewPracticalTask.create(reviewId, taskText, score)`.
- **Used by:** `AddPracticalTaskUseCase`, `UpdatePracticalTaskUseCase`, `IReviewRepository`.

#### `domain/entities/ReviewPendingTopic.ts`
- **Responsibility:** Immutable record of a topic failed in a review. Created when a theory question is marked incorrect.
- **Properties:** `id: string`, `reviewId: string`, `topic: string`, `questionText: string`, `createdAt: Date`
- **Behaviour:** Static factory only — no mutation methods. Immutable after creation.
- **Used by:** `MarkTheoryQuestionUseCase`, `FinalizeReviewUseCase`, `IReviewRepository`.

---

### 1.3 Repository Interfaces

Pure TypeScript interfaces. No implementation. Defined in the domain so use cases depend on the abstraction, not the database.

#### `domain/repositories/ICandidateRepository.ts`
```
interface ICandidateRepository {
  findById(id: string): Promise<Candidate | null>
  findByName(name: string): Promise<Candidate | null>
  findAll(params: { search?: string; page: number; limit: number }): Promise<PaginatedResult<Candidate>>
  save(candidate: Candidate): Promise<void>
  exists(name: string): Promise<boolean>
}
```

#### `domain/repositories/IQuestionRepository.ts`
```
interface IQuestionRepository {
  findById(id: string): Promise<Question | null>
  findAll(params: { topic?: string; search?: string; page: number; limit: number }): Promise<PaginatedResult<Question>>
  findAllTopics(): Promise<string[]>
  save(question: Question): Promise<void>
  softDelete(id: string): Promise<void>
}
```

#### `domain/repositories/IReviewRepository.ts`
```
interface IReviewRepository {
  findById(id: string): Promise<Review | null>
  findByCandidate(candidateId: string, params: { from?: Date; to?: Date; page: number; limit: number }): Promise<PaginatedResult<Review>>
  findDraftByCandidate(candidateId: string): Promise<Review | null>
  save(review: Review): Promise<void>
  saveTheoryQuestion(question: ReviewTheoryQuestion): Promise<void>
  updateTheoryQuestion(question: ReviewTheoryQuestion): Promise<void>
  removeTheoryQuestion(reviewId: string, questionId: string): Promise<void>
  savePracticalTask(task: ReviewPracticalTask): Promise<void>
  updatePracticalTask(task: ReviewPracticalTask): Promise<void>
  removePracticalTask(reviewId: string, taskId: string): Promise<void>
  savePendingTopics(topics: ReviewPendingTopic[]): Promise<void>
  clearPendingTopics(reviewId: string): Promise<void>
  getDashboardSummary(params: { from?: Date; to?: Date }): Promise<DashboardSummary>
  getDashboardCandidates(params: { from?: Date; to?: Date; page: number; limit: number }): Promise<PaginatedResult<CandidateWithLastReview>>
}
```

---

### 1.4 Domain Service

#### `domain/services/ReviewScoringService.ts`
- **Responsibility:** Pure, stateless computation. Calculates both scores from a `Review` aggregate's collections. Lives in domain because the scoring formula is business logic, not infrastructure.
- **Methods:**
  - `computeTheoryScore(questions: ReviewTheoryQuestion[]): number` — `(correct / total) * 100`. Returns 0 if no questions.
  - `computePracticalScore(tasks: ReviewPracticalTask[]): number` — average of all task scores. Returns 0 if no tasks.
- **Dependencies:** `ReviewTheoryQuestion`, `ReviewPracticalTask` entities only.
- **Used by:** `FinalizeReviewUseCase`.

---

### 1.5 Domain Errors

Each error class extends a base. The presentation layer inspects the class name to choose the HTTP status code.

| File | Class | Purpose |
|---|---|---|
| `DomainError.ts` | `DomainError` | Abstract base class. Carries `message` and `code` string. |
| `NotFoundError.ts` | `NotFoundError extends DomainError` | Resource looked up by ID does not exist. → HTTP 404 |
| `ConflictError.ts` | `ConflictError extends DomainError` | State conflict (duplicate name, already finalized). → HTTP 409 |
| `ValidationError.ts` | `ValidationError extends DomainError` | Invalid input value (bad score range, empty name). → HTTP 400 |

---

## 2. Application Layer

**Rule:** Depends only on `domain`. No `pg`, no `express`, no `zod`. Receives and returns plain objects.

---

### 2.1 Common

#### `application/common/UseCase.ts`
- **Responsibility:** Base interface that all use cases implement. Enforces a single entry point.
- **Exports:**
  ```
  interface UseCase<I, O> {
    execute(input: I): Promise<O>
  }
  ```
- **Why:** Controllers depend on `UseCase<I, O>`, not on concrete classes. Enables test doubles with zero mocking framework.

#### `application/common/PaginationInput.ts`
- **Responsibility:** Shared input shape for any paginated use case.
- **Exports:** `type PaginationInput = { page: number; limit: number }`
- **Used by:** All `List*` and `Get*History` use cases.

---

### 2.2 Candidate Use Cases

Each use case constructor receives the repository interface it needs, injected by the DI container.

#### `CreateCandidateUseCase`
- **Input:** `{ name: string }`
- **Output:** `{ id: string; name: string; createdAt: Date }`
- **Steps:** Check `ICandidateRepository.exists(name)` → throw `ConflictError` if true → `Candidate.create(name)` → `save` → return DTO.
- **Injects:** `ICandidateRepository`

#### `GetCandidateUseCase`
- **Input:** `{ id: string }`
- **Output:** `CandidateDTO`
- **Steps:** `findById` → throw `NotFoundError` if null → return.
- **Injects:** `ICandidateRepository`

#### `ListCandidatesUseCase`
- **Input:** `{ search?: string } & PaginationInput`
- **Output:** `PaginatedResult<CandidateDTO>`
- **Steps:** Delegate to `findAll` with params.
- **Injects:** `ICandidateRepository`

#### `GetCandidateHistoryUseCase`
- **Input:** `{ candidateId: string; from?: Date; to?: Date } & PaginationInput`
- **Output:** `PaginatedResult<ReviewSummaryDTO>`
- **Steps:** Assert candidate exists → `findByCandidate` with date range.
- **Injects:** `ICandidateRepository`, `IReviewRepository`

---

### 2.3 Question Use Cases

#### `CreateQuestionUseCase`
- **Input:** `{ questionText: string; expectedAnswer: string; topic: string }`
- **Output:** `QuestionDTO`
- **Steps:** `Question.create(...)` → `save`.
- **Injects:** `IQuestionRepository`

#### `UpdateQuestionUseCase`
- **Input:** `{ id: string; questionText?: string; expectedAnswer?: string; topic?: string }`
- **Output:** `QuestionDTO`
- **Steps:** `findById` → throw `NotFoundError` if null → apply partial update → `save`.
- **Injects:** `IQuestionRepository`

#### `DeleteQuestionUseCase`
- **Input:** `{ id: string }`
- **Output:** `void`
- **Steps:** `findById` → throw `NotFoundError` if null → `softDelete(id)`.
- **Injects:** `IQuestionRepository`

#### `ListQuestionsUseCase`
- **Input:** `{ topic?: string; search?: string } & PaginationInput`
- **Output:** `PaginatedResult<QuestionDTO>`
- **Steps:** Delegate to `findAll`.
- **Injects:** `IQuestionRepository`

#### `GetTopicsUseCase`
- **Input:** `void`
- **Output:** `{ topics: string[] }`
- **Steps:** Delegate to `findAllTopics`.
- **Injects:** `IQuestionRepository`

---

### 2.4 Review Use Cases

#### `StartReviewUseCase`
- **Input:** `{ candidateId: string }`
- **Output:** `ReviewDTO`
- **Steps:** Assert candidate exists → `findDraftByCandidate` → throw `ConflictError` if draft exists → create new `Review` entity with status `'draft'` → `save`.
- **Injects:** `ICandidateRepository`, `IReviewRepository`

#### `GetReviewUseCase`
- **Input:** `{ id: string }`
- **Output:** `ReviewDetailDTO` (includes theory questions, practical tasks, pending topics)
- **Steps:** `findById` → throw `NotFoundError` if null → return full aggregate.
- **Injects:** `IReviewRepository`

#### `UpdateReviewUseCase`
- **Input:** `{ id: string; feedback?: string }`
- **Output:** `ReviewDTO`
- **Steps:** `findById` → `assertIsDraft()` → `setFeedback(feedback)` → `save`.
- **Injects:** `IReviewRepository`

#### `FinalizeReviewUseCase`
- **Input:** `{ id: string }`
- **Output:** `ReviewDetailDTO`
- **Steps:** `findById` → `assertIsDraft()` → assert at least one question and one task exist → `ReviewScoringService.computeTheoryScore` + `computePracticalScore` → `clearPendingTopics` → `savePendingTopics(incorrectQuestions)` → `review.finalize(scores)` → `save`.
- **Injects:** `IReviewRepository`, `ReviewScoringService`

---

### 2.5 Theory Question Use Cases

#### `AddTheoryQuestionsUseCase`
- **Input:** `{ reviewId: string; questionIds: string[] }`
- **Output:** `ReviewTheoryQuestionDTO[]`
- **Steps:** Load review → `assertIsDraft()` → for each ID: `findById(question)` → `ReviewTheoryQuestion.createSnapshot(reviewId, question)` → `saveTheoryQuestion`.
- **Injects:** `IReviewRepository`, `IQuestionRepository`

#### `MarkTheoryQuestionUseCase`
- **Input:** `{ reviewId: string; theoryQuestionId: string; result: QuestionResult }`
- **Output:** `ReviewTheoryQuestionDTO`
- **Steps:** Load review → `assertIsDraft()` → find the theory question → `question.mark(result)` → `updateTheoryQuestion` → if `incorrect`: create `ReviewPendingTopic` → `savePendingTopics`. If previously `incorrect` and now `correct`: `clearPendingTopics` for that question → re-save remaining.
- **Injects:** `IReviewRepository`

#### `RemoveTheoryQuestionUseCase`
- **Input:** `{ reviewId: string; theoryQuestionId: string }`
- **Output:** `void`
- **Steps:** Load review → `assertIsDraft()` → `removeTheoryQuestion`.
- **Injects:** `IReviewRepository`

---

### 2.6 Practical Task Use Cases

#### `AddPracticalTaskUseCase`
- **Input:** `{ reviewId: string; taskText: string; score: number }`
- **Output:** `ReviewPracticalTaskDTO`
- **Steps:** Load review → `assertIsDraft()` → `new Score(score)` (throws on bad range) → `ReviewPracticalTask.create(...)` → `savePracticalTask`.
- **Injects:** `IReviewRepository`

#### `UpdatePracticalTaskUseCase`
- **Input:** `{ reviewId: string; taskId: string; taskText?: string; score?: number }`
- **Output:** `ReviewPracticalTaskDTO`
- **Steps:** Load review → `assertIsDraft()` → find task → apply updates → `updatePracticalTask`.
- **Injects:** `IReviewRepository`

#### `RemovePracticalTaskUseCase`
- **Input:** `{ reviewId: string; taskId: string }`
- **Output:** `void`
- **Steps:** Load review → `assertIsDraft()` → `removePracticalTask`.
- **Injects:** `IReviewRepository`

---

### 2.7 Dashboard Use Cases

#### `GetDashboardSummaryUseCase`
- **Input:** `{ from?: Date; to?: Date }`
- **Output:** `{ totalReviews: number; totalCandidates: number; averageTheoryScore: number; averagePracticalScore: number; topFailedTopics: { topic: string; failureCount: number }[] }`
- **Steps:** Delegate to `IReviewRepository.getDashboardSummary(params)`.
- **Injects:** `IReviewRepository`

#### `GetDashboardCandidatesUseCase`
- **Input:** `{ from?: Date; to?: Date } & PaginationInput`
- **Output:** `PaginatedResult<CandidateWithLastReviewDTO>`
- **Steps:** Delegate to `IReviewRepository.getDashboardCandidates(params)`.
- **Injects:** `IReviewRepository`

---

## 3. Infrastructure Layer

**Rule:** The only layer that imports `pg` or any database library. Implements domain interfaces.

---

### 3.1 Database

#### `infrastructure/database/connection.ts`
- **Responsibility:** Create and export the single shared `pg.Pool` instance for the entire application.
- **Source of config:** Reads `DATABASE_URL` (or individual `PGHOST`, `PGPORT`, etc.) from `shared/config/env.ts`.
- **Exports:** `pool: Pool` — imported by all repository constructors via injection.
- **Important:** Pool is created once at startup. All repositories share the same pool. Connections are never created per-request.

---

### 3.2 Repositories

Each repository class:
- Implements the corresponding domain interface exactly.
- Receives `pg.Pool` through its constructor.
- Uses parameterized queries only (`$1, $2, …`) — never string interpolation.
- Maps raw `pg` `RowDataPacket` objects to domain entity instances.
- Never exposes SQL or database types to callers.

#### `PgCandidateRepository` implements `ICandidateRepository`

| Method | SQL responsibility |
|---|---|
| `findById` | `SELECT … WHERE id = $1` |
| `findByName` | `SELECT … WHERE name = $1` (CITEXT handles case) |
| `findAll` | `SELECT … WHERE name ILIKE $1 ORDER BY name LIMIT $2 OFFSET $3` + `COUNT(*)` for total |
| `save` | `INSERT … ON CONFLICT (id) DO UPDATE SET …` (upsert) |
| `exists` | `SELECT EXISTS(SELECT 1 FROM candidates WHERE name = $1)` |

#### `PgQuestionRepository` implements `IQuestionRepository`

| Method | SQL responsibility |
|---|---|
| `findById` | `SELECT … WHERE id = $1 AND is_deleted = false` |
| `findAll` | Filter by `topic` and full-text search; paginated; `is_deleted = false` |
| `findAllTopics` | `SELECT DISTINCT topic FROM questions WHERE is_deleted = false ORDER BY topic` |
| `save` | Upsert on `id` |
| `softDelete` | `UPDATE questions SET is_deleted = true WHERE id = $1` |

#### `PgReviewRepository` implements `IReviewRepository`

This is the most complex repository. It owns all five tables related to reviews.

| Method | SQL responsibility |
|---|---|
| `findById` | Fetches `reviews` row + all child rows from `review_theory_questions`, `review_practical_tasks`, `review_pending_topics`. Assembles full `Review` aggregate. |
| `findByCandidate` | `SELECT … WHERE candidate_id = $1 AND status = 'finalized'` with date range + pagination |
| `findDraftByCandidate` | `SELECT … WHERE candidate_id = $1 AND status = 'draft' LIMIT 1` |
| `save` | Upsert `reviews` row |
| `saveTheoryQuestion` | `INSERT INTO review_theory_questions …` with snapshot columns |
| `updateTheoryQuestion` | `UPDATE review_theory_questions SET result = $1 WHERE id = $2` |
| `removeTheoryQuestion` | `DELETE FROM review_theory_questions WHERE id = $1 AND review_id = $2` |
| `savePracticalTask` | `INSERT INTO review_practical_tasks …` |
| `updatePracticalTask` | `UPDATE review_practical_tasks SET task_text = $1, score = $2 WHERE id = $3` |
| `removePracticalTask` | `DELETE FROM review_practical_tasks WHERE id = $1 AND review_id = $2` |
| `savePendingTopics` | Bulk `INSERT INTO review_pending_topics …` |
| `clearPendingTopics` | `DELETE FROM review_pending_topics WHERE review_id = $1` |
| `getDashboardSummary` | Aggregate query: `COUNT`, `AVG`, and `GROUP BY topic` across finalized reviews with optional date range |
| `getDashboardCandidates` | Join `candidates` with `v_candidate_latest_review` view; paginated |

---

### 3.3 DI Container

#### `infrastructure/container/container.ts`
- **Responsibility:** The composition root — the single place in the application where `new` is called to wire all concrete classes together. Nothing outside this file calls `new` on any service, repository, use case, or controller.
- **Exports:** `buildContainer(): AppContainer` where `AppContainer` is a plain object holding all constructed instances.

**Wiring order (bottom-up):**

```
Step 1 — Shared config
  env = loadEnv()

Step 2 — DB connection
  pool = new Pool(env.databaseUrl)

Step 3 — Domain services (no deps)
  scoringService = new ReviewScoringService()

Step 4 — Repositories (inject pool)
  candidateRepo = new PgCandidateRepository(pool)
  questionRepo  = new PgQuestionRepository(pool)
  reviewRepo    = new PgReviewRepository(pool)

Step 5 — Use cases (inject repos + services)
  createCandidate     = new CreateCandidateUseCase(candidateRepo)
  getCandidate        = new GetCandidateUseCase(candidateRepo)
  listCandidates      = new ListCandidatesUseCase(candidateRepo)
  getCandidateHistory = new GetCandidateHistoryUseCase(candidateRepo, reviewRepo)
  createQuestion      = new CreateQuestionUseCase(questionRepo)
  updateQuestion      = new UpdateQuestionUseCase(questionRepo)
  deleteQuestion      = new DeleteQuestionUseCase(questionRepo)
  listQuestions       = new ListQuestionsUseCase(questionRepo)
  getTopics           = new GetTopicsUseCase(questionRepo)
  startReview         = new StartReviewUseCase(candidateRepo, reviewRepo)
  getReview           = new GetReviewUseCase(reviewRepo)
  updateReview        = new UpdateReviewUseCase(reviewRepo)
  finalizeReview      = new FinalizeReviewUseCase(reviewRepo, scoringService)
  addTheoryQuestions  = new AddTheoryQuestionsUseCase(reviewRepo, questionRepo)
  markTheoryQuestion  = new MarkTheoryQuestionUseCase(reviewRepo)
  removeTheoryQuestion= new RemoveTheoryQuestionUseCase(reviewRepo)
  addPracticalTask    = new AddPracticalTaskUseCase(reviewRepo)
  updatePracticalTask = new UpdatePracticalTaskUseCase(reviewRepo)
  removePracticalTask = new RemovePracticalTaskUseCase(reviewRepo)
  getDashboardSummary = new GetDashboardSummaryUseCase(reviewRepo)
  getDashboardCandidates = new GetDashboardCandidatesUseCase(reviewRepo)

Step 6 — Controllers (inject use cases)
  candidateController  = new CandidateController(createCandidate, getCandidate, listCandidates, getCandidateHistory)
  questionController   = new QuestionController(createQuestion, updateQuestion, deleteQuestion, listQuestions, getTopics)
  reviewController     = new ReviewController(startReview, getReview, updateReview, finalizeReview, addTheoryQuestions, markTheoryQuestion, removeTheoryQuestion, addPracticalTask, updatePracticalTask, removePracticalTask)
  dashboardController  = new DashboardController(getDashboardSummary, getDashboardCandidates)

Step 7 — Routers (inject controllers)
  router = buildRouter(candidateController, questionController, reviewController, dashboardController)
```

---

## 4. Presentation Layer

**Rule:** No business logic. Controllers are translation adapters only. No direct database access.

---

### 4.1 Entry Points

#### `presentation/http/server.ts`
- **Responsibility:** Node.js process entry point.
- **Does:** Calls `buildContainer()` → calls `createApp(router)` → calls `app.listen(PORT)`.
- **Also:** Registers `SIGTERM` / `SIGINT` handlers for graceful shutdown (drain pool, close server).
- **Does NOT:** Contain any route or middleware logic.

#### `presentation/http/app.ts`
- **Responsibility:** Express application factory. Accepts the fully built router and returns a configured `express.Application`.
- **Registers:** `express.json()`, `express.urlencoded()`, `requestLogger`, `authMiddleware`, the main router, and `errorHandler` (last).
- **Exported separately from `server.ts`** so integration tests can import the app without binding a network port.

---

### 4.2 Middleware

Middleware are pure functions. Each has one concern. They are registered in `app.ts` in the order below.

#### `middleware/requestLogger.ts`
- **Position:** First middleware registered.
- **Responsibility:** Logs every incoming request (method, path) and outgoing response (status code, duration in ms).
- **Dependencies:** None — uses `console` or a logger utility.

#### `middleware/authMiddleware.ts`
- **Position:** Runs before all routes.
- **Responsibility:** Reads `Authorization: Bearer <token>` header → verifies JWT signature against `JWT_SECRET` from env → attaches decoded payload to `req.user` → calls `next()`. Responds `401` if header is missing or token is invalid.
- **Dependencies:** `jsonwebtoken`, `shared/config/env.ts`.
- **Does NOT:** Perform authorization (what the user can do) — only authentication (who the user is).

#### `middleware/validateRequest.ts`
- **Position:** Applied per-route, before the controller method.
- **Responsibility:** Factory function that accepts a Zod schema and returns an Express middleware. Parses `req.body` and/or `req.query` against the schema. On failure, calls `next(new ValidationError(...))`. On success, replaces `req.body` / `req.query` with the parsed, type-safe result and calls `next()`.
- **Dependencies:** `zod`, domain `ValidationError`.

#### `middleware/errorHandler.ts`
- **Position:** Last middleware registered (after all routes).
- **Signature:** `(err, req, res, next)` — 4-argument Express error handler.
- **Responsibility:** Central error → HTTP response mapping. Reads the error class name to select status code. Formats the standard error envelope `{ error: { code, message, details? } }`. Logs unexpected errors (non-domain errors).

| Error class | HTTP status |
|---|---|
| `ValidationError` | 400 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `DomainError` (other) | 422 |
| Anything else | 500 |

---

### 4.3 Route Structure

#### `routes/index.ts`
- **Responsibility:** Single mount point. Imports all sub-routers and mounts them under `/api/v1`.
- **Does:** `app.use('/api/v1/candidates', candidateRoutes)`, etc.

#### `routes/candidateRoutes.ts`
| Method | Path | Validator | Controller method |
|---|---|---|---|
| POST | `/candidates` | `createCandidateSchema` | `createCandidate` |
| GET | `/candidates` | `listCandidatesSchema` (query) | `listCandidates` |
| GET | `/candidates/:id` | UUID param | `getCandidate` |
| GET | `/candidates/:id/reviews` | UUID param + date/page query | `getCandidateHistory` |

#### `routes/questionRoutes.ts`
| Method | Path | Validator | Controller method |
|---|---|---|---|
| POST | `/questions` | `createQuestionSchema` | `createQuestion` |
| GET | `/questions` | `listQuestionsSchema` (query) | `listQuestions` |
| GET | `/questions/topics` | — | `getTopics` |
| GET | `/questions/:id` | UUID param | `getQuestion` |
| PUT | `/questions/:id` | `updateQuestionSchema` | `updateQuestion` |
| DELETE | `/questions/:id` | UUID param | `deleteQuestion` |

#### `routes/reviewRoutes.ts`
| Method | Path | Validator | Controller method |
|---|---|---|---|
| POST | `/reviews` | `startReviewSchema` | `startReview` |
| GET | `/reviews/:id` | UUID param | `getReview` |
| PUT | `/reviews/:id` | `updateReviewSchema` | `updateReview` |
| POST | `/reviews/:id/finalize` | UUID param | `finalizeReview` |
| POST | `/reviews/:id/theory-questions` | `addTheoryQuestionsSchema` | `addTheoryQuestions` |
| PATCH | `/reviews/:id/theory-questions/:tqId` | `markTheoryQuestionSchema` | `markTheoryQuestion` |
| DELETE | `/reviews/:id/theory-questions/:tqId` | UUID params | `removeTheoryQuestion` |
| POST | `/reviews/:id/practical-tasks` | `addPracticalTaskSchema` | `addPracticalTask` |
| PUT | `/reviews/:id/practical-tasks/:taskId` | `updatePracticalTaskSchema` | `updatePracticalTask` |
| DELETE | `/reviews/:id/practical-tasks/:taskId` | UUID params | `removePracticalTask` |

#### `routes/dashboardRoutes.ts`
| Method | Path | Validator | Controller method |
|---|---|---|---|
| GET | `/dashboard/summary` | date range query | `getSummary` |
| GET | `/dashboard/candidates` | date range + page query | `getCandidates` |

---

### 4.4 Controllers

Every controller method follows the same pattern:
1. Extract validated data from `req.body`, `req.params`, `req.query`.
2. Call `useCase.execute(input)`.
3. Send `res.status(code).json(result)`.
4. Catch errors with `try/catch` → `next(err)`.

No `if/else` business logic. No database calls. No domain knowledge beyond error types.

#### `CandidateController`
- **Injects:** `CreateCandidateUseCase`, `GetCandidateUseCase`, `ListCandidatesUseCase`, `GetCandidateHistoryUseCase`
- **Methods:** `createCandidate`, `getCandidate`, `listCandidates`, `getCandidateHistory`
- **Response codes:** 201 (create), 200 (all reads)

#### `QuestionController`
- **Injects:** `CreateQuestionUseCase`, `UpdateQuestionUseCase`, `DeleteQuestionUseCase`, `ListQuestionsUseCase`, `GetTopicsUseCase`
- **Methods:** `createQuestion`, `getQuestion`, `listQuestions`, `getTopics`, `updateQuestion`, `deleteQuestion`
- **Response codes:** 201 (create), 200 (reads/update), 204 (delete)

#### `ReviewController`
- **Injects:** All 10 review-related use cases
- **Methods:** `startReview`, `getReview`, `updateReview`, `finalizeReview`, `addTheoryQuestions`, `markTheoryQuestion`, `removeTheoryQuestion`, `addPracticalTask`, `updatePracticalTask`, `removePracticalTask`
- **Response codes:** 201 (create/add), 200 (reads/updates/finalize), 204 (removes)

#### `DashboardController`
- **Injects:** `GetDashboardSummaryUseCase`, `GetDashboardCandidatesUseCase`
- **Methods:** `getSummary`, `getCandidates`
- **Response codes:** 200

---

### 4.5 Validators

Each validator file exports one or more Zod schemas. The `validateRequest` middleware accepts a schema and enforces it before the request reaches the controller.

| File | Schemas |
|---|---|
| `candidateValidator.ts` | `createCandidateSchema`, `listCandidatesSchema` |
| `questionValidator.ts` | `createQuestionSchema`, `updateQuestionSchema`, `listQuestionsSchema` |
| `reviewValidator.ts` | `startReviewSchema`, `updateReviewSchema`, `addTheoryQuestionsSchema`, `markTheoryQuestionSchema`, `addPracticalTaskSchema`, `updatePracticalTaskSchema` |

---

### 4.6 DTOs

Plain TypeScript `type` definitions. No methods. Inferred from Zod schemas where possible. Define the exact JSON shape of every API request and response.

| File | Types defined |
|---|---|
| `candidate.dto.ts` | `CandidateDTO`, `CreateCandidateRequestDTO`, `ListCandidatesQueryDTO`, `CandidateWithLastReviewDTO` |
| `question.dto.ts` | `QuestionDTO`, `CreateQuestionRequestDTO`, `UpdateQuestionRequestDTO`, `ListQuestionsQueryDTO` |
| `review.dto.ts` | `ReviewDTO`, `ReviewDetailDTO`, `ReviewSummaryDTO`, `ReviewTheoryQuestionDTO`, `ReviewPracticalTaskDTO`, `ReviewPendingTopicDTO`, `StartReviewRequestDTO`, `AddTheoryQuestionsRequestDTO`, `MarkTheoryQuestionRequestDTO`, `AddPracticalTaskRequestDTO`, `UpdatePracticalTaskRequestDTO`, `DashboardSummaryDTO`, `DashboardQueryDTO` |

---

## 5. Shared

No layer affiliation. Any layer may import from `shared` without creating circular dependencies.

#### `shared/config/env.ts`
- **Responsibility:** Load, validate, and export typed environment configuration. Throws at startup if any required variable is missing — fail fast, not at runtime.
- **Exports:** `config` object with typed fields: `port`, `databaseUrl`, `jwtSecret`, `nodeEnv`.

#### `shared/types/pagination.ts`
- **Exports:**
  - `PaginationInput = { page: number; limit: number }`
  - `PaginatedResult<T> = { data: T[]; total: number; page: number; limit: number }`
- **Used by:** All list use cases and their corresponding controller responses.

#### `shared/utils/uuid.ts`
- **Responsibility:** Thin wrapper around `crypto.randomUUID()`.
- **Exports:** `generateUuid(): string`
- **Why not call `crypto` directly:** Centralises UUID generation so it can be deterministically mocked in tests.

#### `shared/utils/dateUtils.ts`
- **Responsibility:** Consistent parsing and formatting of `TIMESTAMPTZ` values returned from PostgreSQL.
- **Exports:** `parseDate(value: unknown): Date`, `formatDate(date: Date): string` (ISO 8601).

---

## 6. Dependency Rule — Quick Reference

```
shared        ←  any layer can import this
domain        ←  application, infrastructure
application   ←  infrastructure, presentation
infrastructure←  presentation (routers only, via container)

NEVER:
  domain        →  application / infrastructure / presentation
  application   →  infrastructure / presentation
  presentation  →  infrastructure directly (only via injected use cases)
```

---

## 7. End-to-End Data Flow Summary

```
Request → authMiddleware → route → validateRequest(schema)
       → Controller.method()
           → UseCase.execute(input)
               → Repository.method()  ← (pg.Pool via constructor injection)
                   → Entity / DomainService (pure logic)
               ← entity / plain data
           ← output DTO
       ← res.json(dto)
Response

On error anywhere in the use case / domain:
  throw DomainError
  → controller: next(err)
  → errorHandler: map to HTTP status + JSON envelope
```

---

*End of Backend Architecture Reference*
