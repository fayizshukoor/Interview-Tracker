# Interview Tracker — Backend Architecture Design

**Stack:** Node.js · TypeScript (strict) · Express.js · PostgreSQL  
**Patterns:** Clean Architecture · Repository Pattern · Dependency Injection  

---

## Table of Contents

1. [Architectural Principles](#1-architectural-principles)
2. [Layer Overview](#2-layer-overview)
3. [Dependency Rule](#3-dependency-rule)
4. [Folder Structure](#4-folder-structure)
5. [Layer Responsibilities](#5-layer-responsibilities)
   - 5.1 Domain Layer
   - 5.2 Application Layer
   - 5.3 Infrastructure Layer
   - 5.4 Presentation Layer
   - 5.5 Shared
6. [Dependency Injection Strategy](#6-dependency-injection-strategy)
7. [Data Flow — End to End](#7-data-flow--end-to-end)
8. [Module Map](#8-module-map)

---

## 1. Architectural Principles

### Clean Architecture
Robert Martin's Clean Architecture organizes code into concentric layers. The central rule is that **source code dependencies point inward only** — inner layers define abstractions; outer layers implement them.

### Repository Pattern
All database access is hidden behind repository interfaces defined in the domain layer. Application use cases call these interfaces without any knowledge of PostgreSQL, raw SQL, or any ORM. The concrete implementations live exclusively in the infrastructure layer.

### Dependency Injection
No layer instantiates its own dependencies. Every class receives its collaborators through its constructor. A single composition root (the DI container) wires everything together at startup. This makes every component independently unit-testable by swapping real implementations for test doubles.

---

## 2. Layer Overview

```
┌──────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│         Express routes · Controllers · Validators        │
│              DTOs · Middleware · HTTP adapter            │
├──────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                      │
│       Use Cases · Orchestration · Input/Output Ports     │
├──────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                         │
│    Entities · Value Objects · Repository Interfaces      │
│             Domain Services · Domain Errors              │
├──────────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                     │
│   PG Repositories · DB Connection · DI Container · Env  │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Dependency Rule

| Layer | May import from | Must NOT import from |
|---|---|---|
| `domain` | Nothing (pure TypeScript) | `application`, `infrastructure`, `presentation` |
| `application` | `domain` | `infrastructure`, `presentation` |
| `infrastructure` | `domain`, `application` | `presentation` |
| `presentation` | `application`, `domain` (errors/DTOs) | `infrastructure` directly |

This means:
- A use case never imports `pg`, `express`, or any framework.
- A repository interface is defined in `domain`; its PostgreSQL implementation lives in `infrastructure`.
- A controller never executes SQL directly.

---

## 4. Folder Structure

```
src/
│
├── domain/                          # Layer 1 — innermost, zero dependencies
│   ├── entities/
│   │   ├── Candidate.ts
│   │   ├── Question.ts
│   │   ├── Review.ts
│   │   ├── ReviewTheoryQuestion.ts
│   │   ├── ReviewPracticalTask.ts
│   │   └── ReviewPendingTopic.ts
│   │
│   ├── value-objects/
│   │   ├── ReviewStatus.ts
│   │   ├── QuestionResult.ts
│   │   └── Score.ts
│   │
│   ├── repositories/                # Interfaces only — no implementations here
│   │   ├── ICandidateRepository.ts
│   │   ├── IQuestionRepository.ts
│   │   └── IReviewRepository.ts
│   │
│   ├── services/                    # Pure domain logic spanning multiple entities
│   │   └── ReviewScoringService.ts
│   │
│   └── errors/
│       ├── DomainError.ts           # Base class
│       ├── NotFoundError.ts
│       ├── ConflictError.ts
│       └── ValidationError.ts
│
├── application/                     # Layer 2 — orchestration, depends on domain only
│   │
│   ├── candidates/
│   │   ├── CreateCandidateUseCase.ts
│   │   ├── GetCandidateUseCase.ts
│   │   ├── ListCandidatesUseCase.ts
│   │   └── GetCandidateHistoryUseCase.ts
│   │
│   ├── questions/
│   │   ├── CreateQuestionUseCase.ts
│   │   ├── UpdateQuestionUseCase.ts
│   │   ├── DeleteQuestionUseCase.ts
│   │   ├── ListQuestionsUseCase.ts
│   │   └── GetTopicsUseCase.ts
│   │
│   ├── reviews/
│   │   ├── StartReviewUseCase.ts
│   │   ├── GetReviewUseCase.ts
│   │   ├── UpdateReviewUseCase.ts
│   │   └── FinalizeReviewUseCase.ts
│   │
│   ├── theory-questions/
│   │   ├── AddTheoryQuestionsUseCase.ts
│   │   ├── MarkTheoryQuestionUseCase.ts
│   │   └── RemoveTheoryQuestionUseCase.ts
│   │
│   ├── practical-tasks/
│   │   ├── AddPracticalTaskUseCase.ts
│   │   ├── UpdatePracticalTaskUseCase.ts
│   │   └── RemovePracticalTaskUseCase.ts
│   │
│   ├── dashboard/
│   │   ├── GetDashboardSummaryUseCase.ts
│   │   └── GetDashboardCandidatesUseCase.ts
│   │
│   └── common/
│       ├── UseCase.ts               # Base interface: execute(input) => output
│       └── PaginationInput.ts       # Shared input shape for paginated use cases
│
├── infrastructure/                  # Layer 3 — implements interfaces, knows about DB
│   │
│   ├── database/
│   │   ├── connection.ts            # PostgreSQL pool (node-postgres)
│   │   ├── migrations/              # Raw SQL migration files
│   │   │   ├── 001_create_candidates.sql
│   │   │   ├── 002_create_questions.sql
│   │   │   ├── 003_create_reviews.sql
│   │   │   ├── 004_create_review_theory_questions.sql
│   │   │   ├── 005_create_review_practical_tasks.sql
│   │   │   └── 006_create_review_pending_topics.sql
│   │   └── seeds/
│   │       └── questionBank.seed.sql
│   │
│   ├── repositories/                # Concrete PostgreSQL implementations
│   │   ├── PgCandidateRepository.ts
│   │   ├── PgQuestionRepository.ts
│   │   └── PgReviewRepository.ts
│   │
│   └── container/
│       └── container.ts             # DI composition root — wires everything together
│
├── presentation/                    # Layer 4 — HTTP interface, depends on application
│   │
│   ├── http/
│   │   ├── app.ts                   # Express app factory (creates and configures app)
│   │   ├── server.ts                # Entry point — creates app, starts listening
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts    # JWT verification
│   │   │   ├── errorHandler.ts      # Maps domain errors → HTTP status codes
│   │   │   ├── validateRequest.ts   # Runs Zod schema, rejects bad input early
│   │   │   └── requestLogger.ts     # Structured request/response logging
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts             # Mounts all sub-routers under /api/v1
│   │   │   ├── candidateRoutes.ts
│   │   │   ├── questionRoutes.ts
│   │   │   ├── reviewRoutes.ts
│   │   │   └── dashboardRoutes.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── CandidateController.ts
│   │   │   ├── QuestionController.ts
│   │   │   ├── ReviewController.ts
│   │   │   └── DashboardController.ts
│   │   │
│   │   └── validators/              # Zod schemas for request bodies and query params
│   │       ├── candidateValidator.ts
│   │       ├── questionValidator.ts
│   │       └── reviewValidator.ts
│   │
│   └── dto/                         # Plain TypeScript types for request/response shapes
│       ├── candidate.dto.ts
│       ├── question.dto.ts
│       └── review.dto.ts
│
└── shared/                          # Utilities with no layer affiliation
    ├── config/
    │   └── env.ts                   # Typed, validated env variable loading
    ├── types/
    │   └── pagination.ts
    └── utils/
        ├── uuid.ts
        └── dateUtils.ts

tests/
├── unit/
│   ├── domain/                      # Entity and value object logic
│   └── application/                 # Use cases with mocked repositories
└── integration/
    └── api/                         # Supertest HTTP tests against a real test DB
```

---

## 5. Layer Responsibilities

---

### 5.1 Domain Layer

**Location:** `src/domain/`  
**Dependencies:** None — pure TypeScript only.  
**Rule:** This layer must compile and run with zero knowledge of Express, PostgreSQL, or any library.

#### Entities
The core business objects of the application. Each entity encapsulates its own state and enforces its own invariants — not simple data bags.

| Entity | Responsibility |
|---|---|
| `Candidate` | Holds candidate identity. Validates that a name is non-empty. |
| `Question` | Represents a bank question. Ensures all three fields (text, answer, topic) are present. |
| `Review` | The central aggregate. Knows its status, owns its collections of theory questions and practical tasks. Enforces rules: can only finalize a draft, can only modify a draft. |
| `ReviewTheoryQuestion` | Holds the snapshot of a question as used in a specific review. Carries the `result` marking. |
| `ReviewPracticalTask` | One practical task inside a review. Validates that score is 0–100. |
| `ReviewPendingTopic` | A record of a failed topic within a review. Immutable once created. |

#### Value Objects
Immutable types that carry validated, constrained values. They replace primitive obsession and make illegal states unrepresentable.

| Value Object | Responsibility |
|---|---|
| `ReviewStatus` | Typed enum constrained to `'draft'` or `'finalized'`. |
| `QuestionResult` | Typed enum constrained to `'correct'` or `'incorrect'`. |
| `Score` | Wraps a `number`; construction throws if value is outside 0–100. |

#### Repository Interfaces
Contracts that describe what data operations the application needs, without any hint of how they are fulfilled.

| Interface | Key operations |
|---|---|
| `ICandidateRepository` | `findById`, `findByName`, `findAll` (paginated), `save`, `exists` |
| `IQuestionRepository` | `findById`, `findAll` (filtered by topic), `findAllTopics`, `save`, `softDelete` |
| `IReviewRepository` | `findById`, `findByCandidate`, `findDraftByCandidate`, `save`, `saveTheoryQuestion`, `savePracticalTask`, `savePendingTopic`, `removeTheoryQuestion`, `removePracticalTask` |

#### Domain Services
Stateless logic that belongs to the domain but does not fit naturally inside a single entity.

| Service | Responsibility |
|---|---|
| `ReviewScoringService` | Computes `theoryScore` (correct / total × 100) and `practicalScore` (average of task scores) from a `Review` aggregate. Called by `FinalizeReviewUseCase`. |

#### Domain Errors
Typed error classes that carry semantic meaning. The presentation layer maps these to HTTP status codes without any business logic.

| Error | HTTP mapping |
|---|---|
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `ValidationError` | 400 |
| `DomainError` (base) | 500 fallback |

---

### 5.2 Application Layer

**Location:** `src/application/`  
**Dependencies:** `domain` only.  
**Rule:** No framework imports. No `pg`, no `express`, no `zod`. Just TypeScript and domain types.

This layer contains one use case class per user action. Each use case:
1. Receives a plain input object (not an Express `Request`).
2. Calls one or more repository interfaces to read or write data.
3. Applies domain logic (via entities or domain services).
4. Returns a plain output object (not an Express `Response`).

A use case has a single public method, conventionally named `execute(input): Promise<Output>`, defined by the `UseCase<I, O>` base interface.

#### Use Case Groups and Their Responsibilities

**Candidates**

| Use Case | What it does |
|---|---|
| `CreateCandidateUseCase` | Checks for duplicate name → creates and saves a `Candidate` entity. |
| `GetCandidateUseCase` | Fetches a single candidate by ID; throws `NotFoundError` if absent. |
| `ListCandidatesUseCase` | Returns a paginated, optionally name-filtered list of candidates. |
| `GetCandidateHistoryUseCase` | Returns paginated, date-filtered finalized reviews for a candidate. |

**Questions**

| Use Case | What it does |
|---|---|
| `CreateQuestionUseCase` | Validates input and saves a new `Question` entity. |
| `UpdateQuestionUseCase` | Loads question, applies changes, saves. Throws `NotFoundError` if missing. |
| `DeleteQuestionUseCase` | Soft-deletes a question (sets `is_deleted = true`). |
| `ListQuestionsUseCase` | Returns paginated questions, filterable by topic and keyword. |
| `GetTopicsUseCase` | Returns the distinct list of all active topics in the bank. |

**Reviews**

| Use Case | What it does |
|---|---|
| `StartReviewUseCase` | Checks no existing draft for candidate → creates a `draft` review. |
| `GetReviewUseCase` | Loads full review aggregate (theory questions, practical tasks, pending topics). |
| `UpdateReviewUseCase` | Updates mutable fields (e.g., feedback) on a draft review. |
| `FinalizeReviewUseCase` | Validates review is complete → uses `ReviewScoringService` to compute scores → persists pending topics → sets status to `finalized`. |

**Theory Questions**

| Use Case | What it does |
|---|---|
| `AddTheoryQuestionsUseCase` | Loads each source question, creates snapshots, adds them to the review. Enforces draft-only rule. |
| `MarkTheoryQuestionUseCase` | Sets `result` on a theory question. If `incorrect`, creates a `ReviewPendingTopic`. |
| `RemoveTheoryQuestionUseCase` | Removes a theory question from a draft review. |

**Practical Tasks**

| Use Case | What it does |
|---|---|
| `AddPracticalTaskUseCase` | Validates score range, adds a task to a draft review. |
| `UpdatePracticalTaskUseCase` | Updates task text or score on a draft review. |
| `RemovePracticalTaskUseCase` | Removes a practical task from a draft review. |

**Dashboard**

| Use Case | What it does |
|---|---|
| `GetDashboardSummaryUseCase` | Queries total reviews, averages, and top failed topics; supports date range. |
| `GetDashboardCandidatesUseCase` | Returns paginated candidates enriched with last review metadata. |

#### `common/UseCase.ts`
A generic base interface:
```
interface UseCase<I, O> {
  execute(input: I): Promise<O>
}
```
Every use case implements this. Controllers depend on this interface, not on concrete classes — enabling easy test substitution.

---

### 5.3 Infrastructure Layer

**Location:** `src/infrastructure/`  
**Dependencies:** `domain`, `application`, and external libraries (`pg`, etc.).  
**Rule:** This is the only layer that knows about PostgreSQL. Nothing outside this layer touches the database.

#### Database (`infrastructure/database/`)

| File / Folder | Responsibility |
|---|---|
| `connection.ts` | Creates and exports a shared `pg.Pool` instance configured from env variables. The pool is the single point of DB access for all repositories. |
| `migrations/` | Raw SQL files executed in order by a migration runner script. Each file is self-contained and idempotent where possible. |
| `seeds/` | Optional SQL to populate the question bank with starter questions for development. |

#### Repositories (`infrastructure/repositories/`)
Concrete implementations of the domain repository interfaces. Each repository:
- Receives the `pg.Pool` through its constructor (injected, not imported directly).
- Writes raw parameterized SQL — no ORM.
- Maps flat database rows to domain entity instances.
- Handles PostgreSQL-specific concerns (UUIDs, `TIMESTAMPTZ`, `CITEXT`, enum casting).

| Repository | Implements | Notable responsibilities |
|---|---|---|
| `PgCandidateRepository` | `ICandidateRepository` | Case-insensitive name search via `CITEXT`; duplicate detection. |
| `PgQuestionRepository` | `IQuestionRepository` | Filters `is_deleted = false`; returns distinct topic list. |
| `PgReviewRepository` | `IReviewRepository` | Assembles full review aggregate from multiple joined tables; handles snapshot insertion; manages pending topics. |

#### DI Container (`infrastructure/container/`)

| File | Responsibility |
|---|---|
| `container.ts` | The **composition root** — the one place in the entire application where `new` is called to wire together concrete classes. Creates the DB pool, instantiates repositories, injects them into use cases, injects use cases into controllers. Nothing else creates dependencies. |

---

### 5.4 Presentation Layer

**Location:** `src/presentation/`  
**Dependencies:** `application` (use cases), `domain` (error types).  
**Rule:** No business logic. Controllers are thin — they translate HTTP in/out and delegate everything else.

#### Entry Points

| File | Responsibility |
|---|---|
| `http/server.ts` | The Node.js entry point. Calls the app factory, starts `app.listen()`, handles `SIGTERM` for graceful shutdown. |
| `http/app.ts` | Express app factory. Registers middleware, mounts the router, does not start the server. Exported separately so integration tests can import the app without binding a port. |

#### Middleware

| Middleware | Responsibility |
|---|---|
| `authMiddleware.ts` | Verifies the `Authorization: Bearer <JWT>` header. Rejects with `401` if absent or invalid. Attaches decoded payload to `req.user`. |
| `validateRequest.ts` | Accepts a Zod schema; parses `req.body` / `req.query` against it. Returns `400` with field-level errors if validation fails. Passes the parsed, typed result downstream. |
| `errorHandler.ts` | Express error-handling middleware (4-argument signature). Catches all errors propagated via `next(err)`. Maps domain error types to HTTP status codes. Formats the standard error envelope. Logs unexpected errors. |
| `requestLogger.ts` | Logs method, path, status code, and duration for every request. |

#### Routes

Each route file defines an Express `Router`. It declares the HTTP method + path, applies the relevant validator middleware, and delegates to the appropriate controller method. Routes have no logic of their own.

| Router | Endpoints covered |
|---|---|
| `candidateRoutes.ts` | `POST /candidates`, `GET /candidates`, `GET /candidates/:id`, `GET /candidates/:id/reviews` |
| `questionRoutes.ts` | `POST /questions`, `GET /questions`, `GET /questions/topics`, `GET /questions/:id`, `PUT /questions/:id`, `DELETE /questions/:id` |
| `reviewRoutes.ts` | Review CRUD + `POST /reviews/:id/finalize` + theory question sub-routes + practical task sub-routes |
| `dashboardRoutes.ts` | `GET /dashboard/summary`, `GET /dashboard/candidates` |

#### Controllers

One controller per resource. Each controller method:
1. Extracts validated data from `req` (body, params, query).
2. Calls the appropriate use case's `execute()` method.
3. Sends the result as a JSON response with the correct status code.
4. Passes any thrown error to `next(err)` for the error handler.

Controllers never contain `if/else` business logic. They are translation adapters only.

#### Validators (`presentation/http/validators/`)
Zod schemas that describe the exact shape of valid request bodies and query strings. Validators are defined once and referenced by both the `validateRequest` middleware and the DTOs for type inference. They are the single source of truth for input contract.

#### DTOs (`presentation/dto/`)
Plain TypeScript `type` or `interface` definitions describing the shape of data entering and leaving the API. DTOs are inferred from Zod schemas where possible. They have no methods and carry no business logic.

---

### 5.5 Shared

**Location:** `src/shared/`  
**Dependencies:** Nothing from domain, application, or infrastructure.  
**Rule:** Generic utilities that any layer may use without creating circular dependencies.

| Module | Responsibility |
|---|---|
| `config/env.ts` | Loads `process.env`, validates required variables are present, and exports a typed `config` object. Throws at startup if any required variable is missing — fail fast. |
| `types/pagination.ts` | `PaginationInput` and `PaginatedResult<T>` generic types used across use cases and controllers. |
| `utils/uuid.ts` | Wrapper around `crypto.randomUUID()` to keep UUID generation consistent and mockable. |
| `utils/dateUtils.ts` | Helpers for parsing and formatting `TIMESTAMPTZ` values consistently across the app. |

---

## 6. Dependency Injection Strategy

### Approach: Manual Constructor Injection via Composition Root

Rather than a heavy IoC framework, the project uses **manual constructor injection**. The DI container (`infrastructure/container/container.ts`) is the only file in the codebase that calls `new` to create stateful objects.

### Wiring Order (bottom-up)

```
1. DB Pool              ← created from env config
2. Repositories         ← constructed with DB Pool injected
3. Domain Services      ← constructed with no dependencies (pure)
4. Use Cases            ← constructed with Repositories + Domain Services injected
5. Controllers          ← constructed with Use Cases injected
6. Routers              ← constructed with Controllers injected
7. Express App          ← mounts Routers
```

### Why Manual Over a Framework (e.g., tsyringe)?
- Zero decorators / reflect-metadata boilerplate.
- The wiring is explicit and readable — one file shows the entire dependency graph.
- No "magic" resolution at runtime that obscures errors.
- Easy to swap in test doubles: just pass a mock object to the constructor.

### Testing with DI
Because every class receives dependencies through its constructor, tests instantiate the class directly with mock/stub implementations of the interfaces:

```
new FinalizeReviewUseCase(mockReviewRepo, mockScoringService)
```

No test framework setup, no IoC container, no monkey-patching.

---

## 7. Data Flow — End to End

Below is the complete path for a single request: **POST /api/v1/reviews/:id/finalize**

```
HTTP Request
    │
    ▼
authMiddleware          → validates JWT, attaches user to req
    │
    ▼
reviewRoutes.ts         → matches POST /:id/finalize
    │
    ▼
validateRequest(schema) → Zod validates req.params (id is UUID)
    │
    ▼
ReviewController
  .finalizeReview()     → extracts reviewId from req.params
    │
    ▼
FinalizeReviewUseCase
  .execute({ reviewId })
    │
    ├── IReviewRepository.findById(reviewId)
    │       → PgReviewRepository executes SQL, maps rows to Review entity
    │
    ├── Review.assertIsDraft()
    │       → throws ConflictError if already finalized (domain rule)
    │
    ├── ReviewScoringService.computeScores(review)
    │       → pure calculation, returns { theoryScore, practicalScore }
    │
    ├── IReviewRepository.savePendingTopics(incorrectQuestions)
    │       → PgReviewRepository inserts into review_pending_topics
    │
    └── IReviewRepository.save(review.finalize(scores))
            → PgReviewRepository updates reviews row, sets status = 'finalized'
    │
    ▼
ReviewController        → res.status(200).json(finalizedReviewDto)
    │
    ▼
HTTP Response
```

If `ConflictError` is thrown at any point:
```
use case → throws ConflictError
    │
    ▼
controller → next(err)
    │
    ▼
errorHandler middleware → maps ConflictError → 409, formats JSON error envelope
    │
    ▼
HTTP Response { error: { code: "CONFLICT_ERROR", message: "..." } }
```

---

## 8. Module Map

A reference mapping every feature to its files across all layers.

| Feature | Domain | Application | Infrastructure | Presentation |
|---|---|---|---|---|
| Candidates | `Candidate.ts` | `candidates/*.ts` | `PgCandidateRepository.ts` | `CandidateController.ts`, `candidateRoutes.ts` |
| Questions | `Question.ts` | `questions/*.ts` | `PgQuestionRepository.ts` | `QuestionController.ts`, `questionRoutes.ts` |
| Reviews | `Review.ts` | `reviews/*.ts` | `PgReviewRepository.ts` | `ReviewController.ts`, `reviewRoutes.ts` |
| Theory Qs | `ReviewTheoryQuestion.ts` | `theory-questions/*.ts` | `PgReviewRepository.ts` | `ReviewController.ts` |
| Practical Tasks | `ReviewPracticalTask.ts` | `practical-tasks/*.ts` | `PgReviewRepository.ts` | `ReviewController.ts` |
| Pending Topics | `ReviewPendingTopic.ts` | (part of FinalizeReview) | `PgReviewRepository.ts` | `ReviewController.ts` |
| Scoring | `ReviewScoringService.ts` | `FinalizeReviewUseCase.ts` | — | — |
| Dashboard | — | `dashboard/*.ts` | `PgReviewRepository.ts` | `DashboardController.ts`, `dashboardRoutes.ts` |
| DI Wiring | — | — | `container.ts` | `app.ts`, `server.ts` |
| Auth | — | — | — | `authMiddleware.ts` |
| Error Handling | `errors/*.ts` | — | — | `errorHandler.ts` |
| Validation | — | — | — | `validators/*.ts`, `validateRequest.ts` |
