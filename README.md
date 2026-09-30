# Fitness Social Platform

A production-grade, mobile-first social fitness platform built with NestJS, React Native, PostgreSQL, and Redis. Exercising becomes a social game with friend groups, GPS activity tracking, gamification, XP, levels, challenges, and real-time leaderboards.

## Architecture & Technology Stack

- **Backend**: [NestJS](https://nestjs.com/) (TypeScript)
  - Modular, domain-driven structure (`src/features`, `src/common`, `src/config`, `src/database`, `src/redis`)
  - Strict REST API with consistent envelope responses:
    - Success: `{ success: true, data: ... }`
    - Error: `{ success: false, error: { code, message, details? } }`
- **Database**: PostgreSQL 16
  - Relational modeling with Prisma ORM
  - Typed migrations (`prisma migrate dev`)
- **Cache & Realtime**: Redis 7
  - Temporary state, rate-limiting, and leaderboard acceleration
- **Mobile**: React Native + TypeScript
  - Modular feature-first layout (`mobile/src/features/`, `mobile/src/services/`, etc.)
  - React Navigation, TanStack Query, and Zustand
- **Containerization**: Docker Compose
  - Multi-stage Docker builds
  - Health checks for PostgreSQL, Redis, and Backend

---

## Getting Started with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Node.js v20+ (for local host development/testing)

### 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Start Services via Docker Compose

Spin up PostgreSQL, Redis, and the NestJS backend in development mode with live code reloading:

```bash
docker compose up -d --build
```

Check container status:

```bash
docker compose ps
```

View live logs:

```bash
docker compose logs -f backend
```

### 3. Verify Health Check

Query the running system diagnostic endpoint:

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-09-30T08:08:06.093Z",
    "uptime": 648.57,
    "environment": "development",
    "services": {
      "database": "connected",
      "redis": "connected"
    }
  }
}
```

---

## Database Migrations

Run database migrations inside the running backend container:

```bash
docker compose exec backend npx prisma migrate dev --name <migration_name>
```

Or from the host (if local `.env` is configured):

```bash
cd backend
npx prisma migrate dev
```

---

## Testing

Run unit tests and end-to-end integration tests:

```bash
cd backend

# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Build check
npm run build
```

---

## Mobile Application

To run the React Native client:

```bash
cd mobile
npm install
npm run start
```

To typecheck the mobile application:

```bash
npm run typecheck
```

---

## Development Roadmap & Feature Phases

Following `master-prompt.md` and `agents.md`:

- [x] **Feature 1: Foundation & Docker Infrastructure** (NestJS, PostgreSQL 16, Redis 7, Prisma ORM, Health Diagnostic, Mobile Skeleton)
- [ ] **Feature 2: Authentication & User Accounts** (JWT, Password Hashing, Secure storage, Profile)
- [ ] **Feature 3: User Profiles & Friend Relationships** (Follows/Friends, Social graph)
- [ ] **Feature 4: Friend Groups** (Group creation, membership, group feed)
- [ ] **Feature 5: Activity Tracking & GPS Route Processing** (Sampling, distance calculation, elevation)
- [ ] **Feature 6: Gamification Subsystem & Auditable XP Engine** (Rules, level progression, transaction log)
- [ ] **Feature 7: Leaderboards** (Global, friend, group, challenge leaderboards with Redis acceleration)
- [ ] **Feature 8: Challenges & Virtual Races** (Group missions, milestone tracks)
- [ ] **Feature 9: Social Feed, Kudos & Notifications**
- [ ] **Feature 10: Anti-Cheat & Privacy Zones** (Sensitive location masking, pace validation)
