# PPL 2026 — Pattan Premier League

Full-stack real-time cricket scoring PWA.

## Tech Stack
- **Backend**: NestJS + Prisma + PostgreSQL + Redis + Socket.io
- **Frontend**: React + Vite + Tailwind CSS + Socket.io-client
- **Deployment**: Render (backend + DB + Redis + frontend static)

## Project Structure
```
ppl2026/
├── backend/          # NestJS API
│   ├── prisma/       # Schema + migrations + seed
│   └── src/          # All modules
├── frontend/         # React PWA
│   ├── public/       # Icons, manifest, sw.js
│   └── src/          # Components, pages, hooks
└── README.md
```

## Quick Start (Local)

### Backend
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL and REDIS_URL
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

## Deploy to Render
1. Push repo to GitHub
2. Go to render.com → New → Blueprint
3. Point to `backend/render.yaml`
4. Set env vars (ADMIN_USER, ADMIN_PASS, VAPID keys)
5. Deploy frontend as Static Site pointing to `frontend/dist`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/bootstrap | — | All data in one shot |
| POST | /api/auth/login | — | Get JWT token |
| GET/PUT/DELETE | /api/live | PUT/DELETE=Admin | Live match state |
| POST | /api/live/ball/:matchId | Admin | Add ball event |
| GET/POST/PUT/DELETE | /api/matches | POST/PUT/DELETE=Admin | Matches CRUD |
| POST | /api/matches/:id/finish | Admin | End match + save highlights |
| POST | /api/matches/:id/status | Admin | Update status |
| POST | /api/matches/:id/inn1 | Admin | Save innings 1 |
| GET | /api/matches/:id/balls | — | Ball-by-ball events |
| GET/POST/PUT/DELETE | /api/teams | POST/PUT/DELETE=Admin | Teams CRUD |
| GET/POST/DELETE | /api/squads/:teamId | POST/DELETE=Admin | Squad management |
| GET/POST/PUT/DELETE | /api/players | POST/PUT/DELETE=Admin | Players CRUD |
| GET/POST/PUT/DELETE | /api/groups | POST/PUT/DELETE=Admin | Groups CRUD |
| GET/POST | /api/sentiment/:matchId | POST=public | Fan sentiment votes |
| GET/POST/PUT/DELETE | /api/ads | POST/PUT/DELETE=Admin | Ads slider |
| GET/POST/DELETE | /api/polls | POST/DELETE=Admin | Polls |
| POST | /api/polls/:id/vote | — | Vote on poll |
| GET/POST/PUT/DELETE | /api/orgs | POST/PUT/DELETE=Admin | Organisers |
| GET/POST/DELETE | /api/gallery | POST/DELETE=Admin | Gallery |
| GET/POST/DELETE | /api/rules | POST/DELETE=Admin | Tournament rules |
| GET/POST/DELETE | /api/ann | POST/DELETE=Admin | Announcements |
| POST | /api/notifications/send | Admin | Send push + WS notification |
| POST | /api/notifications/subscribe | — | Subscribe to push |

## WebSocket Events (Socket.io)

Connect to backend URL. Listen for these events:

| Event | Data | Description |
|-------|------|-------------|
| `live` | LiveState | Live match state updated |
| `ball` | BallEvent | New ball bowled |
| `matches` | Match[] | Matches list updated |
| `teams` | Team[] | Teams updated |
| `players` | Player[] | Players updated |
| `groups` | Group[] | Groups updated |
| `sentiment` | { matchId, team1, team2, total } | Vote update |
| `ads` | Ad[] | Ads updated |
| `polls` | Poll[] | Polls updated |
| `notification` | { title, body, icon } | Push notification |

## Admin Credentials (default)
- Username: `ppl2026`
- Password: `ppl@2620`
- **Change these in production via env vars**
