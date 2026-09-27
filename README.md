# ReachInbox Email Scheduler

A full-stack email scheduling system built for the ReachInbox SDE Intern assignment.

The application provides a React-based dashboard for scheduling emails, an Express API for managing scheduling requests, MySQL for persistent email state, Redis and BullMQ for durable delayed jobs, and a worker service that delivers emails through SMTP.

## Architecture

```text
┌──────────────────────┐
│      React + Vite    │
│    Email Dashboard   │
└──────────┬───────────┘
           │ HTTP
           ▼
┌──────────────────────┐
│    Express API       │
│   Port 4000          │
└───────┬───────┬──────┘
        │       │
        │       ▼
        │   ┌──────────────┐
        │   │    MySQL     │
        │   │ Email State  │
        │   └──────────────┘
        │
        ▼
┌──────────────────────┐
│        Redis         │
│      BullMQ Queue    │
└──────────┬───────────┘
           │
           │ Delayed Job
           ▼
┌──────────────────────┐
│    Worker Service    │
│    Email Processor   │
└──────────┬───────────┘
           │ SMTP
           ▼
┌──────────────────────┐
│   Ethereal SMTP      │
│   Email Delivery     │
└──────────────────────┘
```

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express
* TypeScript
* Passport.js
* Google OAuth 2.0
* Express Session

### Data & Infrastructure

* MySQL 8
* Redis 7
* BullMQ
* Elasticsearch 8

### Email

* Nodemailer
* Ethereal SMTP

### Development

* Docker
* npm workspaces
* TypeScript

## Core Features

### Email Scheduling

Users can schedule an email for a future date and time.

The scheduling flow is:

```text
Dashboard
   ↓
POST /api/v1/emails/schedule
   ↓
Validate request
   ↓
Create email record in MySQL
   ↓
Create delayed BullMQ job
   ↓
Redis stores the job
   ↓
Worker processes job when due
   ↓
SMTP delivery through Ethereal
   ↓
MySQL status → SENT
```

### Durable Delayed Jobs

BullMQ is used for delayed email delivery.

Jobs are persisted through Redis rather than relying on in-memory timers. This allows the worker to process scheduled jobs independently from the API process.

Each email uses its database ID as the BullMQ `jobId`.

### Idempotency

The scheduling endpoint requires an `Idempotency-Key`.

Repeated requests with the same key for the same user return the existing email instead of creating another email record.

This prevents accidental duplicate scheduling when a client retries a request.

### Email Processing State

Emails maintain persistent delivery state in MySQL.

Supported states include:

```text
PENDING
QUEUED
PROCESSING
SENT
RESCHEDULED
FAILED
CANCELLED
```

The worker uses an atomic database update to claim an email before processing it.

### Retry Handling

BullMQ jobs are configured with retry attempts and exponential backoff.

If delivery fails, the worker records the error and allows BullMQ to retry the job.

After the configured attempts are exhausted, the email is marked as `FAILED`.

### Authentication

Google OAuth 2.0 authentication is implemented using Passport.js with server-side sessions backed by Redis.

User sessions use HttpOnly cookies.

The scheduling API validates the authenticated user before accessing user-owned resources.

> **Development note:** Because the Google OAuth client configuration could not be browser-verified in the assignment environment, the local demo dashboard includes a development-only demo mode for demonstrating the scheduling pipeline. This mode is enabled only when `NODE_ENV=development` and the request explicitly contains the demo header. It is not intended for production.

## Database

The application uses MySQL 8 for persistent application state.

Main entities include:

* `users`
* `senders`
* `email_batches`
* `emails`
* `slack_connections`

The `emails` table stores:

* recipient information
* subject and body
* scheduling time
* delivery status
* attempt count
* BullMQ job ID
* idempotency key
* delivery/error information

## Infrastructure

The project can run its infrastructure services using Docker.

Required services:

```text
MySQL        → localhost:3306
Redis        → localhost:6379
Elasticsearch → localhost:9200
```

Example:

```bash
docker compose up -d
```

Check running containers:

```bash
docker ps
```

## Installation

Clone the repository:

```bash
git clone https://github.com/jamiya-kouser/reachinbox-email-scheduler.git
cd reachinbox-email-scheduler
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
copy .env.example .env
```

Configure the required environment variables in `.env`.

**Never commit `.env` to GitHub.**

## Database Migration

Run:

```bash
npm run migrate
```

## Development

Start the backend:

```bash
npm run dev:server
```

Start the worker:

```bash
npm run dev:worker
```

Start the frontend:

```bash
npm run dev:client
```

The development application runs with:

```text
Frontend: http://localhost:3001
Backend:  http://localhost:4000
```

## Production Build

Build all workspaces:

```bash
npm run build
```

The build includes:

```text
Shared package
Server
Worker
Client
```

The project has been verified with a successful complete TypeScript/Vite production build.

## Health Check

The backend exposes:

```text
GET /health
```

The endpoint checks connectivity with the application's infrastructure dependencies.

## Email Delivery Verification

The complete scheduling pipeline was tested locally:

```text
React Dashboard
      ↓
Express API
      ↓
MySQL
      ↓
BullMQ
      ↓
Redis
      ↓
Worker
      ↓
Nodemailer
      ↓
Ethereal SMTP
      ↓
MySQL status = SENT
```

A scheduled email was successfully processed by the worker and persisted with `SENT` status in MySQL.

## Project Structure

```text
reachinbox-email-scheduler/
│
├── client/
│   └── src/
│       ├── App.tsx
│       └── index.css
│
├── server/
│   └── src/
│       ├── auth.ts
│       ├── routes.ts
│       ├── server.ts
│       ├── config/
│       ├── db/
│       ├── queues/
│       └── redis/
│
├── worker/
│   └── src/
│       ├── index.ts
│       ├── processors/
│       ├── services/
│       ├── db/
│       ├── redis/
│       └── config/
│
├── shared/
│   └── src/
│
├── docker-compose.yml
├── package.json
├── package-lock.json
└── .env.example
```

## Engineering Decisions

### Why BullMQ?

BullMQ provides durable delayed jobs backed by Redis and allows the API and worker to operate independently.

### Why MySQL?

MySQL acts as the source of truth for email state. Queue state is not used as the application's only record of an email.

### Why use the email ID as the BullMQ job ID?

Using the persistent email ID provides a stable relationship between the database record and the queue job and supports idempotent scheduling.

### Why server-side sessions?

Authentication state remains on the server and the browser receives an HttpOnly session cookie rather than application secrets.

## Current Implementation Status

### Implemented and locally verified

* React scheduling dashboard
* Express scheduling API
* MySQL persistence
* Redis connectivity
* BullMQ delayed jobs
* Worker email processing
* SMTP delivery through Ethereal
* Email status updates
* Idempotency-key handling
* Retry configuration
* Complete project build
* Docker-based infrastructure
* Google OAuth implementation
* Redis-backed sessions

### Implemented but not browser-verified

* Google OAuth browser login, due to the Google Cloud OAuth client configuration returning an `invalid_client` response in the assignment environment.

### Not presented as completed

The following assignment capabilities are not represented as fully completed features in this submission:

* Production-ready hourly rate-limit scheduling/rescheduling
* Elasticsearch search UI/API
* Slack OAuth and alert integration
* Full sender-management UI
* Bulk campaign import
* Persistent dashboard activity/history UI

The repository therefore documents the implemented and verified functionality rather than claiming unverified features.

## Security Notes

* Secrets are stored in `.env`.
* `.env` is excluded from version control.
* Only `.env.example` is committed.
* Session cookies are HttpOnly.
* User ownership is checked when accessing scheduling resources.
* Development demo mode is explicitly restricted to development environments.

## Author

**Jamiya Kouser**

CSE – Artificial Intelligence & Machine Learning

GitHub:
https://github.com/jamiya-kouser
