# Interview Tracker — Backend Architecture Reference

This file is a concise reference for the backend implementation and file layout.

## Root & Config Entry Points

- `backend/src/server.ts` — starts HTTP server
- `backend/src/app.ts` — Express app setup and mounts module routes
- `backend/src/config/env.ts` — environment variable configuration
- `backend/src/config/db.ts` — PostgreSQL connection pool
- `backend/src/types/index.ts` — core TypeScript data models and interfaces

## Modules (`backend/src/modules/`)

### Auth (`backend/src/modules/auth/`)
- `auth.routes.ts` — `/auth/*` endpoints (login, register, request-otp, verify-otp, refresh, logout, me)
- `auth.controller.ts` — auth HTTP request handlers
- `auth.service.ts` — token generation, verification, and auth orchestration
- `auth.repository.ts` — refresh token and OTP database operations
- `user.service.ts` — email/password validation and user registration logic
- `user.repository.ts` — users table queries
- `email.service.ts` — nodemailer OTP delivery

### Candidates (`backend/src/modules/candidates/`)
- `candidate.routes.ts` — `/candidates` endpoints
- `candidate.controller.ts` — candidate HTTP request handlers
- `candidate.service.ts` — candidate validation and business logic
- `candidate.repository.ts` — candidates table queries

### Questions (`backend/src/modules/questions/`)
- `question.routes.ts` — `/questions` theory question endpoints
- `question.controller.ts` — theory question HTTP request handlers
- `question.service.ts` — theory question business logic
- `question.repository.ts` — questions table queries
- `practicalQuestion.routes.ts` — `/practical-questions` endpoints
- `practicalQuestion.controller.ts` — practical question HTTP request handlers
- `practicalQuestion.service.ts` — practical question business logic
- `practicalQuestion.repository.ts` — practical_questions table queries

### Reviews (`backend/src/modules/reviews/`)
- `review.routes.ts` — `/reviews` lifecycle endpoints
- `review.controller.ts` — review HTTP request handlers
- `review.service.ts` — review business logic and score calculation
- `review.repository.ts` — reviews table queries
- `reviewTheoryQuestion.routes.ts` — `/reviews/:reviewId/questions` operations
- `reviewTheoryQuestion.controller.ts` — review theory question handlers
- `reviewTheoryQuestion.service.ts` — randomized question selection, order, and scoring
- `reviewTheoryQuestion.repository.ts` — review_theory_questions table queries
- `reviewPracticalTask.routes.ts` — `/reviews/:reviewId/practical-tasks` operations
- `reviewPracticalTask.controller.ts` — practical task timers and scoring handlers
- `reviewPracticalTask.service.ts` — practical task timer orchestration
- `reviewPracticalTask.repository.ts` — review_practical_tasks table queries
- `reviewPendingTopic.routes.ts` — `/reviews/:reviewId/pending-topics` endpoints
- `reviewPendingTopic.controller.ts` — pending topic HTTP handlers
- `reviewPendingTopic.service.ts` — pending topic query logic
- `reviewPendingTopic.repository.ts` — review_pending_topics table queries

### Dashboard (`backend/src/modules/dashboard/`)
- `dashboard.routes.ts` — dashboard analytics routes
- `dashboard.controller.ts` — dashboard metrics handlers
- `dashboard.service.ts` — dashboard calculation logic

## Shared Middleware (`backend/src/middleware/`)

- `authenticate.ts` — JWT authentication middleware
- `errorHandler.ts` — global centralized error handling
- `requestLogger.ts` — HTTP request logger
- `validate.ts` — request validation utilities

## Database Assets (`backend/src/database/`)

- `migrate.ts` — migration runner
- `seed.ts` — seed runner
- `migrations/` — SQL migration scripts
- `seeds/` — SQL seed files
