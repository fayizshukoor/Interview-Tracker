# Interview Tracker

A full-stack interview management application built with Node.js, Express, PostgreSQL, React, and Vite.

## Project Structure

```text
Interview Tracker/
├── backend/          # Express API, PostgreSQL repositories & migrations
├── frontend/         # React SPA built with Vite
├── docs/             # Specifications, architecture docs & ER diagrams
│   ├── database/     # ER diagram and consolidated schema
│   ├── backend-architecture.md
│   ├── backend-architecture-reference.md
│   └── interview-tracker-spec.md
├── package.json      # Root npm workspace orchestrator
└── README.md
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Set up your `.env` file in the root and/or `backend/` directory:
```bash
cp backend/.env.example backend/.env
```

### 3. Run Development Servers
Start both the backend API and frontend Vite server concurrently with a single command:
```bash
npm run dev
```

* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:3000`

### 4. Other Available Scripts
- `npm run dev:backend` — Start only the backend API in watch mode
- `npm run dev:frontend` — Start only the frontend Vite development server
- `npm run build` — Compile both backend (`tsc`) and frontend (`vite build`)
- `npm run start` — Run the production backend server (`node dist/server.js`)

## Documentation

Full architectural documentation and data models can be found in the [`docs/`](./docs) directory:
- [Entity Relationship Diagram](./docs/database/er-diagram.md)
- [Backend Architecture Guide](./docs/backend-architecture.md)
- [Backend Architecture Reference](./docs/backend-architecture-reference.md)
- [Product Specifications](./docs/interview-tracker-spec.md)

