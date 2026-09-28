# MakeMyMarriage — Project Status & Feature Roadmap

**Version:** 1.0  
**Current Phase:** Feature 1 (Authentication) Complete → Ready for Feature 2 (Wedding Management)  
**Architecture:** Modular Monolith (PostgreSQL + Prisma + Express + React + Tailwind + SSE)  
**Last Updated:** 2026-09-28  

---

## 📊 High-Level Feature Roadmap

Following **Section 116 (Recommended Build Order)** of the System Design Architecture Document, the platform is developed incrementally feature-by-feature:

| # | Feature / Milestone | Domain Module | Status | Dependencies |
|---|---|---|---|---|
| **0** | **Project Scaffold & Foundation** | Core Workspace | ✅ **COMPLETED** | — |
| **0.5** | **Luxury Homepage (Stitch Design)** | `frontend/home` | ✅ **COMPLETED** | Scaffold |
| **0.6** | **Royal Login Portal (Stitch Design)** | `frontend/auth` | ✅ **COMPLETED** | Scaffold |
| **0.7** | **Royal Sign Up Suite (Stitch Design)** | `frontend/auth` | ✅ **COMPLETED** | Scaffold |
| **0.8** | **Imperial Command Dashboard (Stitch Design)** | `frontend/wedding` | ✅ **COMPLETED** | Scaffold |
| **1** | **User Authentication & Sessions** | `auth` + `users` | ✅ **COMPLETED** | Scaffold |
| **2** | **Wedding Management & Tenancy** | `weddings` | 🟡 **NEXT UP (Awaiting Approval)** | Auth |

---

## 🎯 Next Feature to Build: Feature 2 — Wedding Management & Tenancy

### Why Wedding Management Next?
In our system architecture, the **Wedding is the central tenant boundary**. Events, Guests, Invitations, RSVPs, Photo Vault, and Check-in desks all belong to a Wedding. After authenticating users in Feature 1, Feature 2 allows couples and hosts to create, configure, update, and manage their wedding workspace.


---

### Proposed Scope for Feature 1 (Authentication)

#### 1. Backend Implementation (`backend/src/modules/auth/`):
- **Database Schema**:
  - Connect to PostgreSQL and apply migration for the `users` table:
    - `id` (UUIDv7 / UUID)
    - `email` (Case-insensitive unique)
    - `password_hash` (bcryptjs hashed with salt factor 12)
    - `name` (User full name)
    - `preferred_language` (`en`, `hi`, `te`)
    - `email_verified_at`, `created_at`, `updated_at`, `deleted_at`
- **Validation Schemas (Zod)**:
  - `signupSchema`: Validates email format, strong password (min 8 characters), name, preferred language.
  - `loginSchema`: Validates email and password.
- **Service & Repository Logic**:
  - Password hashing via `bcryptjs` on signup.
  - Credential verification and timing-safe password comparison on login.
  - Safe user projection (never returns `password_hash` in API responses).
- **Session Management**:
  - Secure HTTP-only cookie (`mmm_session`) handling.
  - Configurable for development (`secure: false`) and production (`secure: true`, `SameSite: 'lax'`).
- **REST Endpoints (`/api/v1/auth`)**:
  - `POST /api/v1/auth/signup` — Register new user account & set session cookie.
  - `POST /api/v1/auth/login` — Authenticate user credentials & set session cookie.
  - `POST /api/v1/auth/logout` — Clear session cookie.
  - `GET /api/v1/auth/me` — Return current authenticated user profile.
- **Middleware Integration**:
  - Activate `requireAuth` middleware to protect downstream routes.

#### 2. Frontend Implementation (`frontend/src/features/auth/`):
- **Auth Forms**:
  - Clean, elegant **Sign Up Form** (Name, Email, Password, Language selection: English/Hindi/Telugu).
  - Clean, elegant **Log In Form** (Email, Password).
  - Form validation and clear inline error messaging.
- **State & Session Persistence**:
  - Integration with TanStack React Query (`useAuth` hook).
  - Auto-login upon successful registration.
  - Seamless redirection to `/dashboard` upon authentication.
  - Protected route guard component (`ProtectedRoute`) redirecting unauthenticated visitors to `/login`.

---

## 📋 Progress Log

| Date | Milestone | Details |
|---|---|---|
| **2026-09-28** | **Project Scaffold Completed** | Initialized root monorepo, Prisma schema with 21 models, Express backend skeleton, React + Vite frontend skeleton, and aligned SSE real-time architecture across documents. |
| **2026-09-28** | **Roadmap & Status Document Created** | Established build order and detailed plan for Feature 1 (Authentication). |

---

> [!NOTE]  
> **Status:** Waiting for user approval before beginning Feature 1 implementation.
