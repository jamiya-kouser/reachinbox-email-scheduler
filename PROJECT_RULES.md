# ReachInbox Email Scheduler — Project Rules

This is a real hiring assignment for the Outbox Labs / ReachInbox.ai Software Development Engineer Intern role.

The goal is to build a reliable, secure, production-style full-stack email scheduling system.

## Mandatory technologies

Backend:
- TypeScript
- Node.js
- Express.js
- BullMQ
- Redis
- MySQL
- Ethereal Email SMTP

Frontend:
- React
- TypeScript
- Tailwind CSS

Infrastructure:
- Docker
- MySQL
- Redis
- Elasticsearch

Integrations:
- Google OAuth
- Slack OAuth
- Elasticsearch

## Absolute rules

1. Do NOT use cron.
2. Do NOT use node-cron.
3. Do NOT use Agenda.
4. Do NOT use OS-level scheduled tasks.
5. Do NOT use in-memory scheduling.
6. Do NOT use an in-memory-only rate limiter.
7. Do NOT create fake Google OAuth.
8. Do NOT create fake Slack OAuth.
9. Do NOT create fake email sending.
10. Do NOT use hardcoded dashboard data.
11. Do NOT expose secrets to the frontend.
12. Do NOT commit .env files.
13. Do NOT trust userId supplied by the frontend.
14. Every protected resource must be authorized against the authenticated user.
15. User A must never access User B's emails.
16. Elasticsearch searches must also be user-scoped.
17. BullMQ jobs must persist across application restarts.
18. Emails must not be sent twice.
19. Hourly rate limiting must work across multiple workers.
20. When an hourly limit is reached, jobs must be delayed/rescheduled rather than permanently dropped.
21. Slack notification must be real.
22. Elasticsearch search must be real.
23. Ethereal SMTP sending must be real.
24. Google authentication must be real.
25. Do not claim a feature works until it has been tested.
26. Do not copy another candidate's assignment or GitHub repository.
27. Use original implementation.
28. Prefer simple, maintainable engineering over unnecessary complexity.
29. Never hide errors by hardcoding fake success responses.
30. Never proceed past a failed critical verification without fixing the underlying problem.

## Security

Authentication and authorization are core requirements.

Never accept a frontend-provided userId as proof of ownership.

The authenticated user must come from the backend authentication/session context.

All database queries for user-owned resources must be scoped to the authenticated user.

Protect against IDOR.

Never expose:
- Google client secrets
- Slack access tokens
- database passwords
- Redis credentials
- session secrets
- Ethereal credentials

## Scheduling

BullMQ + Redis must be used for delayed email scheduling.

The database is the application source of truth.

Redis/BullMQ provides durable scheduled jobs.

Workers process emails asynchronously.

## Idempotency

The system must prevent duplicate sends caused by:
- duplicate API requests
- retries
- worker restarts
- network retries
- job retries

## Rate limiting

Rate limiting must be coordinated through Redis or another shared persistent mechanism.

Never use:

let count = 0;

as the only rate limiter.

The implementation must work correctly when multiple workers are running.

## Development process

Build the application in phases.

Do not generate the entire application at once.

After each major phase:
1. Implement.
2. Run it.
3. Test it.
4. Fix errors.
5. Report what was verified.
6. Only then continue.

## Code quality

Use:
- TypeScript types
- clear names
- modular services
- reusable components
- validation
- centralized error handling
- secure configuration
- meaningful logging

Avoid unnecessary abstraction.

## Windows

Development environment is Windows/PowerShell.

When giving commands, prefer PowerShell-compatible commands.

## Important

This project is being built for a real hiring evaluation.

Correctness, reliability, security, maintainability and understanding are more important than flashy UI.