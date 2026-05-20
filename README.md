# EduThrive360 Backend

Node.js + Express + MongoDB API for the dynamic psychological quiz engine.

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGINS` (Admin and User dev URLs).
2. Start MongoDB locally or use Docker: `docker compose up -d` (if `docker-compose.yml` is present).
3. Install and run:

```bash
npm install
npm run seed          # optional: super admin
npm run dev
```

API base: `http://localhost:3000`

## Key routes

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `/login`, `/forgot-password`, `/reset-password`, `GET /auth/profile` |
| Organizations | `POST/GET/PATCH /organizations`, members CRUD |
| Quizzes | `POST/GET/PATCH /quizzes`, groups, questions, quotes |
| Attempts | `POST /attempts/start`, `PATCH .../answers`, `POST .../submit`, `GET .../result` |
| Results | `GET /results/me`, `/results/:id`, `/results/org/:organizationId` |
| Analytics | `GET /analytics/overall`, `/group-wise`, `/high-risk-users` |

## Scripts

- `npm run dev` — watch mode
- `npm run test` — scoring engine + quote tests
- `npm run seed:demo` — demo org, quiz, and end-user (see script output)

## Roles

`super_admin`, `org_admin`, `org_counselor`, `user` — staff use the User app; platform super admin uses the Admin app.
