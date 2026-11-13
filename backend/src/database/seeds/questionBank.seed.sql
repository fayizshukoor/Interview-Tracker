-- =============================================================================
-- Seed: Question Bank
-- Description : Populates the questions table with starter questions across
--               common interview topics. Safe to run multiple times —
--               uses INSERT ... ON CONFLICT DO NOTHING to skip duplicates.
--
-- Usage:
--   psql $DATABASE_URL -f src/infrastructure/database/seeds/questionBank.seed.sql
--
--   Or via the seed runner:
--   npx ts-node src/infrastructure/database/seed.ts
-- =============================================================================

-- We use a temporary function to make bulk insertion readable and idempotent.
-- Each question is keyed by (question_text, topic) for conflict detection.

INSERT INTO questions (id, question_text, expected_answer, topic) VALUES

-- ---------------------------------------------------------------------------
-- Topic: JavaScript
-- ---------------------------------------------------------------------------
(
  gen_random_uuid(),
  'What is the difference between var, let, and const?',
  'var is function-scoped and hoisted; let and const are block-scoped. const prevents reassignment of the binding but does not make objects immutable. let allows reassignment. var declarations are hoisted and initialised to undefined; let/const are hoisted but remain in the temporal dead zone until the declaration is reached.',
  'JavaScript'
),
(
  gen_random_uuid(),
  'Explain how closures work in JavaScript.',
  'A closure is a function that retains access to its outer lexical scope even after the outer function has returned. The inner function holds a reference to the variables in the enclosing scope, not copies of their values. Common use cases: data privacy, factory functions, memoisation.',
  'JavaScript'
),
(
  gen_random_uuid(),
  'What is the event loop and how does it work?',
  'JavaScript is single-threaded. The event loop continuously checks if the call stack is empty; if so, it dequeues the next callback from the task queue (macrotasks) or microtask queue (Promises, queueMicrotask) and pushes it onto the stack. Microtasks are drained fully before the next macrotask runs.',
  'JavaScript'
),
(
  gen_random_uuid(),
  'What is the difference between == and === in JavaScript?',
  '== performs type coercion before comparison (loose equality); === compares value and type without coercion (strict equality). Best practice is to always use === to avoid unexpected coercion bugs.',
  'JavaScript'
),
(
  gen_random_uuid(),
  'What are Promises and how do they differ from callbacks?',
  'A Promise represents the eventual completion or failure of an asynchronous operation. Unlike callbacks, Promises chain with .then()/.catch(), avoid callback hell, and integrate with async/await. Promises have three states: pending, fulfilled, rejected.',
  'JavaScript'
),
(
  gen_random_uuid(),
  'Explain prototypal inheritance in JavaScript.',
  'Every JavaScript object has an internal [[Prototype]] link to another object. Property lookups traverse this prototype chain. Objects inherit from other objects directly, not from classes. ES6 class syntax is syntactic sugar over this prototype mechanism.',
  'JavaScript'
),

-- ---------------------------------------------------------------------------
-- Topic: TypeScript
-- ---------------------------------------------------------------------------
(
  gen_random_uuid(),
  'What is the difference between interface and type in TypeScript?',
  'Both define object shapes. interface supports declaration merging and is preferred for defining object shapes and contracts. type is more flexible — it can represent unions, intersections, primitives, and tuples. For public API contracts use interface; for complex type aliases use type.',
  'TypeScript'
),
(
  gen_random_uuid(),
  'What are generics in TypeScript and why are they useful?',
  'Generics allow writing reusable, type-safe functions and classes that work across multiple types without losing type information. Instead of using any, a type parameter (e.g. <T>) is introduced and inferred or specified at call site. Example: Array<T>, Promise<T>.',
  'TypeScript'
),
(
  gen_random_uuid(),
  'What is the unknown type and how does it differ from any?',
  'Both accept any value, but unknown is type-safe: you cannot perform operations on an unknown value without first narrowing its type (typeof, instanceof, type guards). any disables type checking entirely. Prefer unknown when the type is genuinely not known at compile time.',
  'TypeScript'
),
(
  gen_random_uuid(),
  'What are decorators in TypeScript?',
  'Decorators are a stage-3 proposal (experimentalDecorators in older TS). They are functions applied to classes, methods, accessors, properties, or parameters using @ syntax. Used heavily in frameworks like NestJS for metadata annotation, dependency injection, and AOP-style concerns.',
  'TypeScript'
),

-- ---------------------------------------------------------------------------
-- Topic: Node.js
-- ---------------------------------------------------------------------------
(
  gen_random_uuid(),
  'What is the Node.js event-driven, non-blocking I/O model?',
  'Node.js uses a single-threaded event loop backed by libuv, which offloads I/O operations (file system, network) to the OS kernel or a thread pool. When an operation completes, its callback is queued and picked up by the event loop. This allows handling many concurrent connections without spawning OS threads per connection.',
  'Node.js'
),
(
  gen_random_uuid(),
  'What is the difference between process.nextTick and setImmediate?',
  'process.nextTick callbacks run at the end of the current operation, before the event loop continues — they drain the nextTick queue entirely before moving to I/O. setImmediate runs in the check phase of the event loop, after I/O callbacks. nextTick has higher priority.',
  'Node.js'
),
(
  gen_random_uuid(),
  'What are streams in Node.js and what are the four types?',
  'Streams are objects that let you read or write data in chunks rather than buffering everything in memory. Four types: Readable (source of data), Writable (destination), Duplex (both readable and writable), Transform (Duplex that transforms data as it passes through). Examples: fs.createReadStream, http.IncomingMessage.',
  'Node.js'
),
(
  gen_random_uuid(),
  'How does the Node.js module system work? What is the difference between CommonJS and ES Modules?',
  'CommonJS (require/module.exports) loads modules synchronously and caches them after first load. ES Modules (import/export) are asynchronous, statically analysable, and support tree-shaking. Node.js supports both; .mjs or "type": "module" in package.json activates ESM.',
  'Node.js'
),

-- ---------------------------------------------------------------------------
-- Topic: Express.js
-- ---------------------------------------------------------------------------
(
  gen_random_uuid(),
  'What is middleware in Express.js and how does the middleware chain work?',
  'Middleware are functions with signature (req, res, next). Express executes them in registration order. Each middleware can modify req/res, call next() to pass control forward, or call next(err) to skip to error-handling middleware. Error-handling middleware has four arguments: (err, req, res, next).',
  'Express.js'
),
(
  gen_random_uuid(),
  'How do you handle errors in Express.js?',
  'Synchronous errors thrown inside route handlers are caught by Express automatically. For async handlers, errors must be passed to next(err) explicitly (or use an async wrapper). A 4-argument middleware (err, req, res, next) registered after all routes acts as the global error handler.',
  'Express.js'
),
(
  gen_random_uuid(),
  'What is the difference between app.use() and app.get()/app.post()?',
  'app.use() matches any HTTP method and mounts middleware at a path prefix (or globally if no path given). app.get()/app.post() match only their specific HTTP method and exact path. app.use() is typically used for middleware; app.get/post/put/delete are used for route handlers.',
  'Express.js'
),

-- ---------------------------------------------------------------------------
-- Topic: PostgreSQL
-- ---------------------------------------------------------------------------
(
  gen_random_uuid(),
  'What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?',
  'INNER JOIN returns rows where there is a match in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right; unmatched right rows are NULL. FULL OUTER JOIN returns all rows from both tables; unmatched rows on either side are NULL.',
  'PostgreSQL'
),
(
  gen_random_uuid(),
  'What is a database index and when should you use one?',
  'An index is a data structure (commonly B-tree) that speeds up data retrieval at the cost of extra storage and slower writes. Use indexes on columns frequently used in WHERE, JOIN, and ORDER BY clauses. Avoid over-indexing tables with heavy write workloads. Partial indexes can index a subset of rows.',
  'PostgreSQL'
),
(
  gen_random_uuid(),
  'What is a database transaction and what are the ACID properties?',
  'A transaction groups operations so they succeed or fail atomically. ACID: Atomicity (all or nothing), Consistency (database remains valid), Isolation (concurrent transactions do not interfere), Durability (committed data survives failures). PostgreSQL is fully ACID-compliant.',
  'PostgreSQL'
),
(
  gen_random_uuid(),
  'What is the difference between WHERE and HAVING in SQL?',
  'WHERE filters rows before aggregation — it cannot reference aggregate functions. HAVING filters groups after a GROUP BY aggregation — it can reference aggregate functions like COUNT, SUM, AVG. Use WHERE to reduce rows early for performance; use HAVING to filter aggregated results.',
  'PostgreSQL'
),
(
  gen_random_uuid(),
  'What are database normalization and the first three normal forms?',
  '1NF: each column holds atomic values; no repeating groups. 2NF: in 1NF and every non-key attribute is fully functionally dependent on the whole primary key (eliminates partial dependencies). 3NF: in 2NF and no transitive dependencies — non-key attributes depend only on the primary key.',
  'PostgreSQL'
),

-- ---------------------------------------------------------------------------
-- Topic: REST API Design
-- ---------------------------------------------------------------------------
(
  gen_random_uuid(),
  'What are the principles of RESTful API design?',
  'Client-server separation, statelessness (no session state on server), cacheability, uniform interface (resource identification via URIs, standard HTTP verbs, self-descriptive messages), layered system, and optional code-on-demand. REST uses HTTP methods semantically: GET=read, POST=create, PUT/PATCH=update, DELETE=remove.',
  'REST API Design'
),
(
  gen_random_uuid(),
  'What is the difference between PUT and PATCH?',
  'PUT replaces the entire resource with the provided representation — omitted fields are set to null or default. PATCH applies a partial update — only the provided fields are changed. Use PUT when the client sends the complete resource; use PATCH for partial updates.',
  'REST API Design'
),
(
  gen_random_uuid(),
  'What HTTP status codes should a REST API use for common scenarios?',
  '200 OK (success), 201 Created (resource created), 204 No Content (success with no body), 400 Bad Request (invalid input), 401 Unauthorized (authentication required), 403 Forbidden (authenticated but not authorised), 404 Not Found, 409 Conflict (duplicate/state conflict), 422 Unprocessable Entity (semantic validation failure), 500 Internal Server Error.',
  'REST API Design'
),

-- ---------------------------------------------------------------------------
-- Topic: Clean Architecture
-- ---------------------------------------------------------------------------
(
  gen_random_uuid(),
  'What is Clean Architecture and what problem does it solve?',
  'Clean Architecture (Robert Martin) organises code into concentric layers (entities, use cases, interface adapters, frameworks). The dependency rule states that source code dependencies only point inward. This keeps business logic independent of frameworks, databases, and delivery mechanisms, making the system testable and maintainable.',
  'Clean Architecture'
),
(
  gen_random_uuid(),
  'What is the Repository Pattern and why is it used?',
  'The Repository Pattern abstracts the data access layer behind an interface. Application code depends on the interface, not on a specific database or ORM. This allows swapping data sources, simplifies unit testing (mock repositories), and keeps business logic free of query language concerns.',
  'Clean Architecture'
),
(
  gen_random_uuid(),
  'What is Dependency Injection and what are its benefits?',
  'Dependency Injection is a technique where a class receives its dependencies from outside rather than creating them internally. Benefits: decoupling (classes depend on abstractions), testability (easy to inject mocks), flexibility (swap implementations without changing consuming code), and explicit dependency graphs.',
  'Clean Architecture'
)

ON CONFLICT DO NOTHING;
