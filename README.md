# ReachInbox Email Scheduler

A distributed, reliable, and fault-tolerant email scheduling system with rate limiting, anti-thundering-herd rescheduling, and search capabilities.

## Architecture Overview

```
React (Vite + Tailwind) -> Express API -> MySQL (State of Truth) -> Redis -> BullMQ Delayed Jobs -> Worker -> Ethereal SMTP
                                      |
                                      +-> Elasticsearch (Full-text Search)
                                      +-> Slack (Rate-limit Alerts)
```

- **Database**: MySQL 8.0 with `mysql2/promise`
- **Cache & Queue Broker**: Redis 7 with Append-Only File (AOF) persistence
- **Queue Engine**: BullMQ with native delayed jobs (no cron, node-cron, or polling loops)
- **Email Delivery**: Ethereal Email SMTP (Nodemailer) with instant web preview URLs
- **Authentication**: Google OAuth 2.0 with Redis-backed server-side sessions and HttpOnly cookies
- **Search**: Elasticsearch 8.x for user-scoped email indexing and querying
- **Notifications**: Slack OAuth 2.0 with rate-limit alerts

---

## Rate-Limit Rescheduling Algorithm & Mathematical Specification

When high-volume batches (e.g., 1,000+ emails) are scheduled, they must satisfy two concurrent constraints:
1. **Sender Hourly Quota**: At most $Q$ emails (e.g., 200 emails) per discrete calendar hour $[H, H+1)$.
2. **Minimum Inter-Email Delay**: At least $D$ milliseconds (e.g., 2,000 ms) between consecutive dispatches from the same sender account.

### Why Simple Offsets are Incorrect
- Spacing 200 emails by 2,000 ms consumes $200 \times 2,000\text{ ms} = 400\text{ seconds}$ (~6.67 minutes).
- Assuming $Q$ emails consume an entire hour, or scheduling all overflow emails to the exact start of the next hour ($HH:00:00.000$), causes a severe thundering herd stampede and violates the minimum delay.

### The Correct Algorithm
To guarantee deterministic FIFO ordering, prevent stampedes, and respect both constraints across distributed workers:
1. **Window Boundaries**:
   - Discrete hourly windows are keyed by UTC hour: $W_0, W_1, W_2, \dots$ where $W_k = [T_{\text{start}}(k), T_{\text{end}}(k))$.
2. **Per-Window Quota Tracking**:
   - An atomic Redis counter tracks emails allocated to window $W_k$:
     $$\text{allocated}(W_k) \le Q$$
3. **Discrete Slot Reservation**:
   - The timestamp for the $n$-th email within window $W_k$ is computed as:
     $$T_{\text{slot}}(k, n) = T_{\text{start}}(k) + (n \times D)$$
   - Because $Q \times D \le 3,600\text{ seconds}$ (e.g., $200 \times 2\text{s} = 400\text{s} < 3,600\text{s}$), the first $Q$ emails fit safely inside window $W_k$.
4. **Window Overflow & Cascading**:
   - When $\text{allocated}(W_k)$ reaches quota $Q$, subsequent emails overflow into window $W_{k+1}$ starting at $T_{\text{start}}(k+1) = T_{\text{start}}(k) + 3,600\text{s}$.
   - The overflow emails take discrete slots:
     $$T_{\text{slot}}(k+1, m) = T_{\text{start}}(k+1) + (m \times D) \quad \text{for } 0 \le m < Q$$
5. **No Job Loss Guarantee**:
   - Emails exceeding current quota are never rejected or failed. They are rescheduled via BullMQ `moveToDelayed(T_slot)` and marked `RESCHEDULED` in MySQL.

---

## Idempotency & Duplicate-Send Mitigation

- **Application-Level Idempotency**:
  - `POST /api/v1/emails/schedule` accepts an `Idempotency-Key` header.
  - Replayed requests return the existing record and HTTP 200.
  - The `emails.idempotency_key` column is indexed with a `UNIQUE` constraint.
- **Queue Deduplication**: BullMQ jobs use deterministic IDs (`jobId = email.id`).
- **State Transition Guard**: Optimistic update `WHERE status IN ('PENDING', 'RESCHEDULED')` prevents duplicate executions.
- **External SMTP Boundary**: SMTP delivery lacks two-phase commit (2PC). If a network failure occurs after SMTP transmission but before MySQL status update, the system guarantees at-least-once delivery with deduplication on retry.

---

## Phase Status

- [x] **Phase 1: Foundation & Persistence Infrastructure** (MySQL, Redis, Elasticsearch, Express, React, TypeScript).
- [ ] **Phase 2: Authentication & Sessions** (Google OAuth 2.0, CSRF defense, Redis sessions).
- [ ] **Phase 3: Queues, Worker & Email Dispatch** (BullMQ, Nodemailer Ethereal SMTP, startup reconciliation).
- [ ] **Phase 4: Concurrency & Rate Limiting** (Atomic Lua rate limiter, slot reservation, rescheduling).
- [ ] **Phase 5: Email Scheduling & Ingestion API** (Single & batch CSV ingestion, Idempotency-Key).
- [ ] **Phase 6: Integrations** (Elasticsearch indexing & search, Slack OAuth & alerts).
- [ ] **Phase 7: Frontend Application** (React dashboard, tables, search bar, modals).
- [ ] **Phase 8: Verification & Hardening** (E2E simulation, load test, evaluator demo).
