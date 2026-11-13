# Interview Tracker — Current Backend Architecture

**Stack:** Node.js · TypeScript · Express.js · PostgreSQL  
**Current pattern:** Modular Monolith (Vertical Slices per domain: route → controller → service → repository → PostgreSQL)

## What the backend looks like now

The backend lives in its own dedicated package under `backend/` and follows a **Modular Monolith** architecture. Each business domain is self-contained in `backend/src/modules/<domain>/` with its own routes, controllers, services, and repositories.

### Workspace structure

```text
Interview Tracker/
├── backend/                  # Dedicated backend package
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts            # Express app & route mounting
│   │   ├── server.ts         # Server entry point
│   │   ├── config/           # Environment & database configuration
│   │   ├── database/         # Migrations & seed runners
│   │   ├── middleware/       # Auth, error handler, logger, validation
│   │   ├── types/            # Shared TypeScript entity types
│   │   └── modules/          # Business domain vertical slices
│   │       ├── auth/         # Login, register, OTP, tokens, users
│   │       ├── candidates/   # Candidate management
│   │       ├── questions/    # Theory & practical question banks
│   │       ├── reviews/      # Review lifecycle, theory questions, practical tasks, pending topics
│   │       └── dashboard/    # Dashboard metrics
├── frontend/                 # Dedicated frontend package (React + Vite)
├── docs/                     # Specifications, architecture docs & ER diagrams
│   └── database/             # ER diagram and consolidated schema
├── package.json              # Monorepo workspace orchestrator
└── README.md
```

### Request flow within a module

1. A request enters Express and is routed to a module route (`modules/<domain>/<name>.routes.ts`).
2. The matching controller (`modules/<domain>/<name>.controller.ts`) parses the request and calls a service.
3. The service (`modules/<domain>/<name>.service.ts`) executes business logic and calls a repository.
4. The repository (`modules/<domain>/<name>.repository.ts`) runs SQL queries against PostgreSQL.
5. The response is returned to the client.

### Auth flow

- Public routes: `/health` and `/auth/*`
- Protected routes: `/candidates`, `/questions`, `/practical-questions`, `/reviews`, etc.
- Access tokens are JWTs signed with `JWT_SECRET`.
- Refresh tokens are opaque random values stored in the database and rotated on refresh.

### Database layer

- Migrations live in `backend/src/database/migrations`
- Migration runner: `backend/src/database/migrate.ts`
- Seed runner: `backend/src/database/seed.ts`
- Seed data: `backend/src/database/seeds/questionBank.seed.sql`

## Key backend modules

- **`modules/auth`**: `auth.controller`, `auth.service`, `auth.repository`, `user.service`, `user.repository`, `email.service` — authentication, registration, OTP, tokens, users.
- **`modules/candidates`**: `candidate.controller`, `candidate.service`, `candidate.repository` — candidate CRUD and listing.
- **`modules/questions`**: `question.*` and `practicalQuestion.*` — theory and practical question banks.
- **`modules/reviews`**: `review.*`, `reviewTheoryQuestion.*`, `reviewPracticalTask.*`, `reviewPendingTopic.*` — complete review lifecycle, questions, tasks, and failed topic tracking.
- **`modules/dashboard`**: `dashboard.controller`, `dashboard.service` — dashboard metrics and analytics.
