# MakeMyMarriage — Project Scaffold

A complete, production-grade digital wedding ecosystem structured as a **modular monolith**.

This scaffold was designed and prepared based on the project's foundational specifications:
- **Product Requirements Document (PRD)**
- **System Design Architecture Document (SDA)**
- **Database Design Document (DDD)**
- **API Design Document (ADD)**

---

## 🏛️ System Architecture Overview

```text
                                  MakeMyMarriage
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 │                                             │
                 ▼                                             ▼
        Frontend (React/Vite)                        Backend (Express API)
  Tailwind CSS + TanStack Query               Modular Monolith + TypeScript
  i18n (English, Hindi, Telugu)               Server-Sent Events (SSE) + OpenAPI
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
        PostgreSQL (Prisma)           Redis               Cloudinary
         (Source of Truth)     (Sessions / Caching)     (Media Storage)
```

---

## 📁 Repository Structure

```text
MakeMyMarriage/
├── .env.example                     # Unified environment template
├── .gitignore                       # Root gitignore
├── package.json                     # Root workspaces configuration
├── tsconfig.base.json               # Shared TypeScript base configuration
├── README.md                        # Project documentation
│
├── backend/                         # Express + TypeScript Modular Monolith
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma            # 21 PostgreSQL domain models (UUIDv7 keys)
│   │   └── seed.ts                  # System roles & categories seed script
│   └── src/
│       ├── config/                  # Validated environment configuration
│       ├── infrastructure/          # External adapter wrappers
│       │   ├── prisma/              # Database connection singleton
│       │   ├── redis/               # Redis cache & session client
│       │   ├── cloudinary/          # Cloudinary signed upload helpers
│       │   ├── resend/              # Transactional email service
│       │   └── realtime/            # Server-Sent Events (SSE) streaming
│       ├── middleware/              # Auth, validation, wedding-guard, error, rate-limit
│       ├── shared/                  # Errors, envelopes, Swagger doc specs, types
│       ├── modules/                 # 13 Domain Modules (Controller/Route/Service/Repo stubs)
│       │   ├── auth/                # User authentication & sessions
│       │   ├── weddings/            # Wedding tenancy & settings
│       │   ├── events/              # Event management (Haldi, Sangeet, Ceremony, etc.)
│       │   ├── guests/              # Guest directory & categorization
│       │   ├── invitations/         # Digital invitation generation & token dispatch
│       │   ├── rsvp/                # Event attendance & plus-ones
│       │   ├── tasks/               # Wedding planning checklist & assignments
│       │   ├── media/               # Media upload signatures & asset tracking
│       │   ├── checkins/            # QR guest entry validation
│       │   ├── livestream/          # YouTube live-stream embedding
│       │   ├── website/             # Wedding website customization (/w/:slug)
│       │   ├── notifications/       # Outbox email dispatch
│       │   └── activities/          # Activity feed & audit records
│       ├── routes.ts                # Master router mounting /api/v1/*
│       ├── app.ts                   # Express app factory (helmet, cors, morgan, docs)
│       └── server.ts                # Server bootstrap with graceful shutdown
│
└── frontend/                        # React 18 + Vite + Tailwind CSS Frontend
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js           # Wedding palette (gold, rose, champagne)
    ├── postcss.config.js
    ├── index.html                   # HTML entry with Playfair Display & Inter
    └── src/
        ├── app/                     # App shell and providers
        ├── components/
        │   ├── ui/                  # Button, Card, Input, etc.
        │   └── layout/              # Navbar, Sidebar, DashboardLayout
        ├── features/                # Domain views (auth, wedding, events, guests, etc.)
        ├── hooks/                   # useAuth, useRealtimeSSE
        ├── i18n/                    # i18next (en, hi, te)
        ├── routes/                  # React Router configuration
        ├── services/                # Axios API client
        ├── types/                   # Frontend domain models
        └── utils/                   # ClassNames merger (clsx + tailwind-merge)
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v25)
- **npm**: v9+
- **PostgreSQL**: Local or hosted (Supabase, Neon, Railway)
- **Redis** (optional in dev, gracefully handled)

### 2. Install Dependencies
From the repository root:
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your `DATABASE_URL` with your PostgreSQL credentials.

### 4. Database Setup (Prisma)
Generate the Prisma client:
```bash
npm run prisma:generate
```

Apply migrations and seed initial data:
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 5. Running in Development
Run both frontend and backend concurrently:
```bash
npm run dev
```
Or run separately:
- **Backend API**: `npm run dev:backend` (runs on `http://localhost:5000`)
- **Frontend App**: `npm run dev:frontend` (runs on `http://localhost:5173`)

### 6. Interactive API Documentation
With the backend running, open:
- **Swagger UI**: `http://localhost:5000/docs`
- **OpenAPI JSON**: `http://localhost:5000/api-docs/openapi.json`
- **API Health Check**: `http://localhost:5000/health`
