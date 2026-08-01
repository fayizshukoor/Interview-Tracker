# Interview Tracker — Current Backend Architecture

**Stack:** Node.js · TypeScript · Express.js · PostgreSQL  
**Current pattern:** controller → service → repository → PostgreSQL

## What the backend looks like now

This repository is using a practical service/repository-style architecture rather than the older clean-architecture folder layout described in earlier drafts.

### Main folders

- src/app.ts — Express app setup and route mounting
- src/server.ts — server entry point
- src/controllers/ — HTTP handlers for each resource
- src/services/ — business logic and orchestration
- src/repositories/ — PostgreSQL access layer
- src/routes/ — route definitions
- src/middleware/ — auth, logging, validation, error handling
- src/config/ — environment and DB configuration
- src/database/ — migration and seed runner files
- src/types/ — shared TypeScript types

### Request flow

1. A request enters Express through a route in src/routes.
2. The matching controller parses the request and calls a service.
3. The service performs business logic and calls a repository.
4. The repository runs SQL against PostgreSQL.
5. The response is returned to the client.

### Auth flow

- Public routes: /health and /auth/*
- Protected routes: candidates, questions, practical-questions, reviews, review-related endpoints, dashboard
- Access tokens are JWTs signed with JWT_SECRET
- Refresh tokens are opaque random values stored in the database and rotated on refresh

### Database layer

- Migrations live in src/database/migrations
- The current seed runner is src/database/seed.ts
- The main seed file is src/database/seeds/questionBank.seed.sql

## Key backend modules

- authController / authService / authRepository — login, register, OTP, refresh, logout
- candidateController / candidateService / candidateRepository — candidate CRUD and listing
- questionController / questionService / questionRepository — theory question bank
- practicalQuestionController / practicalQuestionService / practicalQuestionRepository — practical question bank
- reviewController / reviewService / reviewRepository — review lifecycle and history
- reviewTheoryQuestionController / reviewTheoryQuestionService / reviewTheoryQuestionRepository — theory questions inside a review
- reviewPracticalTaskController / reviewPracticalTaskService / reviewPracticalTaskRepository — practical tasks inside a review
- reviewPendingTopicController / reviewPendingTopicService / reviewPendingTopicRepository — failed topics tracking
- dashboardController / dashboardService — dashboard summary and top failed topics

## Notes

The project currently does not use separate domain/application/infrastructure/presentation folders. The implementation is organized around controllers, services, and repositories directly under src.
