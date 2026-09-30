# AGENTS.md

## Project

This repository contains a production-grade social fitness platform built with:

* React Native + TypeScript
* NestJS + TypeScript
* PostgreSQL
* Redis
* BullMQ where background jobs are required

The product combines fitness/activity tracking with social interaction and gamification.

Core product concepts:

* Activities
* GPS tracking
* Friends
* Groups
* Challenges
* XP
* Levels
* Achievements
* Badges
* Streaks
* Leaderboards
* Notifications
* Social feed
* Virtual races
* Rewards

---

# 1. Golden Rule

**Implement one feature at a time.**

Never attempt to build the entire application in one operation.

Every feature follows:

```text
Inspect
  ↓
Understand
  ↓
Plan
  ↓
Implement
  ↓
Test
  ↓
Review
  ↓
Document
```

A feature is not complete merely because the application compiles.

---

# 2. Before Coding

Before modifying code:

1. Inspect the repository.
2. Understand the existing architecture.
3. Find related modules/components.
4. Inspect database models and migrations.
5. Inspect API conventions.
6. Inspect shared utilities.
7. Inspect existing tests.
8. Identify dependencies.
9. Identify potential security/privacy implications.
10. Produce a concise implementation plan.

Do not assume architecture.

Do not rewrite existing architecture without a strong reason.

---

# 3. Feature Planning

Every feature plan must cover:

```text
Goal
Scope
Non-goals
User flow
Database changes
API changes
Mobile changes
State management
Authorization
Validation
Edge cases
Testing
Documentation
```

If a requirement is materially ambiguous and could cause significant rework, ask for clarification.

For minor ambiguity, make a sensible engineering assumption and document it.

---

# 4. Architecture

Use feature/domain-oriented architecture.

Avoid organizing the entire application only by generic file types.

Prefer:

```text
features/
  activity/
  groups/
  challenges/
  gamification/
  leaderboard/
  social/
  profile/
```

Keep domain logic close to its feature.

Shared utilities should remain genuinely shared.

Avoid dumping unrelated functionality into:

```text
utils/
helpers/
services/
common/
```

---

# 5. React Native

Use:

* TypeScript
* React Navigation
* TanStack Query for server state
* Zustand for appropriate client state

Do not duplicate server state unnecessarily in Zustand.

Keep components focused.

Prefer:

```text
Screen
 ↓
Feature Components
 ↓
Hooks
 ↓
Services/API
```

Do not:

* place large business logic inside components;
* put API calls directly throughout UI components;
* put GPS tracking logic inside visual components;
* create giant screen components.

For activity tracking, isolate:

```text
tracking/
  location
  route
  distance
  pace
  activity state
```

from presentation.

---

# 6. NestJS

Use:

```text
Controller
 ↓
Application Service
 ↓
Domain/Business Logic
 ↓
Data Access
```

Controllers should remain thin.

Use DTOs and validation.

Use guards for authorization.

Use dependency injection.

Do not put substantial business logic inside controllers.

Do not make database entities responsible for the entire application's business logic.

---

# 7. Database

PostgreSQL is the primary database.

Prefer relational modeling for:

* users;
* friendships;
* groups;
* group members;
* activities;
* challenges;
* challenge participants;
* achievements;
* XP transactions;
* rewards;
* notifications.

Use:

* foreign keys;
* unique constraints;
* indexes;
* transactions;
* migrations;
* appropriate cascading behavior.

Do not use JSONB as a replacement for proper relational modeling.

Use JSONB only when the data is genuinely flexible/document-like.

---

# 8. GPS Data

GPS/activity data is potentially very large.

Never blindly store an unlimited number of GPS points.

Consider:

* sampling;
* route simplification;
* compression;
* encoded polylines;
* storage size;
* rendering performance;
* battery usage;
* background tracking;
* privacy.

Never expose raw GPS data to unauthorized users.

Avoid unnecessarily exposing exact home/work locations.

---

# 9. Gamification

Gamification is a dedicated domain.

Do not scatter gamification logic across activity controllers/services.

Use event-driven boundaries where appropriate.

Example:

```text
ActivityCompleted
       ↓
 ┌─────┼────────┬──────────┐
 ↓     ↓        ↓          ↓
XP   Badge   Challenge   Streak
       │
       ↓
Leaderboard
       │
       ↓
Notification
```

Gamification should be extensible.

Do not hardcode every game rule into unrelated business logic.

---

# 10. XP

Never blindly do:

```ts
user.xp += 100;
```

without knowing why.

Prefer auditable XP transactions:

```text
XP Transaction
- user
- amount
- reason/type
- source
- sourceId
- timestamp
```

Examples:

```text
RUN_COMPLETED
DISTANCE_COMPLETED
PERSONAL_RECORD
STREAK_COMPLETED
CHALLENGE_COMPLETED
GROUP_GOAL_COMPLETED
SOCIAL_ACTION
```

XP should be server-authoritative.

Never trust client-provided XP.

---

# 11. Leaderboards

Leaderboards may include:

* global;
* friends;
* groups;
* challenges;
* weekly;
* monthly;
* seasonal.

Do not perform expensive full-table calculations on every request if the system grows.

Consider:

* indexes;
* cached results;
* Redis;
* background aggregation;
* materialized data.

Correctness comes before premature optimization.

---

# 12. Security

Never trust the client for:

* user identity;
* XP;
* distance;
* pace;
* challenge progress;
* achievement completion;
* reward eligibility.

The server must validate authoritative business data.

Always consider:

* authentication;
* authorization;
* ownership;
* input validation;
* rate limiting;
* abuse prevention;
* privacy;
* secure storage;
* sensitive data exposure.

---

# 13. Privacy

Fitness and GPS information is sensitive.

Support activity visibility concepts such as:

```text
PUBLIC
FRIENDS
GROUP
PRIVATE
```

Do not expose exact GPS routes to unauthorized users.

Consider privacy zones for frequently visited private locations.

Privacy rules must be enforced server-side.

---

# 14. API Conventions

Use predictable REST APIs.

Examples:

```text
POST   /activities
GET    /activities
GET    /activities/:id
DELETE /activities/:id

POST   /groups
GET    /groups/:id
POST   /groups/:id/members

POST   /challenges
GET    /challenges/:id
POST   /challenges/:id/join
```

Use consistent:

* naming;
* status codes;
* validation;
* pagination;
* authorization;
* errors.

Never return unlimited collections.

---

# 15. Error Format

Use a consistent API error structure.

Example:

```json
{
  "success": false,
  "error": {
    "code": "GROUP_NOT_FOUND",
    "message": "Group not found"
  }
}
```

Never expose:

* stack traces;
* SQL/database errors;
* secrets;
* internal infrastructure details.

---

# 16. Performance

Always consider:

* N+1 queries;
* missing indexes;
* unbounded queries;
* large GPS payloads;
* unnecessary React renders;
* unnecessary API calls;
* expensive leaderboard calculations;
* oversized feed responses.

Use pagination for lists.

Avoid premature optimization.

---

# 17. Redis / Background Jobs

Redis may be used for:

* caching;
* leaderboards;
* rate limiting;
* temporary state;
* distributed coordination.

BullMQ may be used for:

* activity processing;
* notifications;
* gamification processing;
* leaderboard updates;
* scheduled challenges;
* reward processing.

Do not use background jobs when a simple synchronous operation is sufficient.

---

# 18. Testing

Every meaningful feature requires tests.

Backend:

* unit tests;
* service tests;
* authorization tests;
* integration/API tests.

Mobile:

* important utility tests;
* hook tests where valuable;
* component tests for important behavior;
* critical user-flow tests.

Always test:

```text
Happy path
Validation
Unauthorized access
Missing resource
Duplicate operation
Boundary cases
Failure states
```

---

# 19. Definition of Done

A feature is complete only when:

* code is implemented;
* TypeScript passes;
* lint passes;
* database migrations are complete;
* validation exists;
* authorization exists;
* API works;
* UI works;
* loading states exist;
* error states exist;
* empty states exist;
* tests pass;
* existing functionality remains intact;
* security implications were considered;
* documentation is updated.

---

# 20. Dependencies

Before installing a package:

1. Check whether existing dependencies solve the problem.
2. Confirm React Native/NestJS compatibility.
3. Consider maintenance.
4. Consider bundle size.
5. Consider security.
6. Explain why the dependency is necessary.

Avoid dependency sprawl.

---

# 21. Code Quality

Prefer:

* small modules;
* explicit types;
* readable code;
* meaningful names;
* single responsibility;
* composition;
* reusable abstractions only when justified.

Avoid:

* `any`;
* giant components;
* giant services;
* duplicated business logic;
* premature abstractions;
* unnecessary patterns;
* circular dependencies;
* magic numbers;
* unexplained constants.

---

# 22. Git

Keep features isolated.

Prefer branches such as:

```text
feature/authentication
feature/groups
feature/activity-tracking
feature/gamification
feature/challenges
feature/leaderboards
```

Use meaningful commits:

```text
feat(auth): add authentication
feat(groups): add group creation
feat(activity): add GPS activity tracking
feat(gamification): add XP transactions
test(groups): add authorization tests
```

Do not mix unrelated features in one commit.

---

# 23. Documentation

For every significant feature, document:

* purpose;
* architecture;
* database changes;
* API changes;
* important decisions;
* configuration;
* known limitations.

Use ADRs for significant architectural decisions.

---

# 24. Agent Output

After implementing a feature, provide:

```text
## Feature
<name>

## Implemented
<summary>

## Database
<changes>

## API
<endpoints>

## Mobile
<screens/components/hooks>

## Tests
<tests and results>

## Security
<important considerations>

## Performance
<important considerations>

## Files Changed
<important files>

## Deferred
<intentionally skipped work>

## Next Feature
<recommended next logical feature>
```

Do not claim tests passed unless they were actually run.

Do not claim functionality works unless it was verified.

---

# 25. Important Rule

You are modifying a real production-oriented codebase.

Do not optimize for the amount of code generated.

Optimize for:

```text
Correctness
Maintainability
Security
Scalability
Testability
Developer Experience
User Experience
```

The smallest clean implementation that satisfies the requirement is preferred over a large speculative implementation.

**One feature. One coherent change. Fully tested. Then move to the next feature.**
