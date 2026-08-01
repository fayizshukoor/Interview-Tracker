# Interview Tracker — Current Project Specification

**Version:** 2.0  
**Status:** Implemented / in active development

## Product scope

Interview Tracker is a full-stack interview management application for interviewers to manage candidates, build a question bank, run theory and practical reviews, and review results from a dashboard.

## Core features

### Authentication

- Email-based registration and login
- OTP verification flow for account creation
- JWT access tokens
- Refresh tokens stored server-side and rotated on refresh
- Logout revokes the refresh token

### Candidate management

- Create and list candidates
- Associate candidates with reviews
- View review history per candidate

### Question bank

- Store theory questions with topic and expected answer
- Store practical questions/tasks with topic and expected answer
- Soft-delete support for question banks
- Filter by topic

### Review workflow

- Create a draft review for a candidate
- Add theory questions from the question bank
- Add practical tasks to a review
- Mark theory questions as correct/incorrect
- Track failed topics per review
- Finalize a review and calculate scores
- Support pause/resume timing for practical tasks

### Dashboard

- Show review counts
- Show candidate summaries and latest review date
- Show most-failed topics
- Filter by date range

## Data model summary

The backend uses PostgreSQL with tables for:

- users
- candidates
- questions
- practical_questions
- reviews
- review_theory_questions
- review_practical_tasks
- review_pending_topics
- refresh_tokens
- email_verification_otps

## Current implementation notes

- The frontend is a React + TypeScript + Vite app.
- The backend is an Express + TypeScript API.
- The database schema is managed through SQL migrations in src/database/migrations.
- Authentication is currently implemented with access tokens and refresh tokens.
