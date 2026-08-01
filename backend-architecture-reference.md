# Interview Tracker — Backend Architecture Reference

This file is a concise reference for the current backend implementation.

## Main entry points

- src/app.ts — creates the Express app and mounts routes
- src/server.ts — starts the HTTP server

## Route layer

- src/routes/authRoutes.ts — login/register/OTP/refresh/logout endpoints
- src/routes/candidateRoutes.ts — candidate endpoints
- src/routes/questionRoutes.ts — theory question endpoints
- src/routes/practicalQuestionRoutes.ts — practical question endpoints
- src/routes/reviewRoutes.ts — review lifecycle endpoints
- src/routes/reviewTheoryQuestionRoutes.ts — theory-question operations inside reviews
- src/routes/reviewPendingTopicRoutes.ts — pending-topic endpoints
- src/routes/reviewPracticalTaskRoutes.ts — practical-task endpoints
- src/routes/dashboardRoutes.ts — dashboard summary endpoints

## Controller layer

- src/controllers/authController.ts
- src/controllers/candidateController.ts
- src/controllers/questionController.ts
- src/controllers/practicalQuestionController.ts
- src/controllers/reviewController.ts
- src/controllers/reviewTheoryQuestionController.ts
- src/controllers/reviewPendingTopicController.ts
- src/controllers/reviewPracticalTaskController.ts
- src/controllers/dashboardController.ts

## Service layer

- src/services/authService.ts
- src/services/candidateService.ts
- src/services/questionService.ts
- src/services/practicalQuestionService.ts
- src/services/reviewService.ts
- src/services/reviewTheoryQuestionService.ts
- src/services/reviewPracticalTaskService.ts
- src/services/reviewPendingTopicService.ts
- src/services/dashboardService.ts
- src/services/userService.ts
- src/services/emailService.ts

## Repository layer

- src/repositories/authRepository.ts
- src/repositories/candidateRepository.ts
- src/repositories/questionRepository.ts
- src/repositories/practicalQuestionRepository.ts
- src/repositories/reviewRepository.ts
- src/repositories/reviewTheoryQuestionRepository.ts
- src/repositories/reviewPracticalTaskRepository.ts
- src/repositories/reviewPendingTopicRepository.ts
- src/repositories/userRepository.ts

## Middleware and config

- src/middleware/authenticate.ts — JWT authentication
- src/middleware/errorHandler.ts — error responses
- src/middleware/requestLogger.ts — request logging
- src/middleware/validate.ts — validation helpers
- src/config/env.ts — environment variables
- src/config/db.ts — PostgreSQL pool configuration

## Database assets

- src/database/migrate.ts — migration runner
- src/database/seed.ts — seed runner
- src/database/migrations/ — SQL migration files
- src/database/seeds/questionBank.seed.sql — starter question data
