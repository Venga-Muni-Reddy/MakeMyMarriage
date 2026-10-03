# MakeMyMarriage — Project Status & Feature Roadmap

**Version:** 1.0  
**Current Phase:** Feature 11 Complete (Cloudinary Photo Vault & Guest Media Gallery) → Commencing Feature 12 (Real-Time QR Check-in & Banquet Access)  
**Architecture:** Modular Monolith (PostgreSQL + Prisma + Express + React + Tailwind + SSE)  
**Last Updated:** 2026-10-03  

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
| **2** | **Wedding Management & Tenancy** | `weddings` | ✅ **COMPLETED** | Auth |
| **3** | **Events & Sacred Ceremonies** | `events` + `venues` | ✅ **COMPLETED** | Weddings |
| **4** | **Guest Registry & Dietary Preferences** | `guests` + `groups` | ✅ **COMPLETED** | Events |
| **5** | **Digital Invitations & Access Tokens** | `invitations` + `access` | ✅ **COMPLETED** | Guests |
| **6** | **RSVP Collection & Attendance Tracking** | `rsvp` + `dietary` | ✅ **COMPLETED** | Invitations |
| **7** | **Public Wedding Website (`/w/:slug`)** | `website` + `public` | ✅ **COMPLETED** | RSVP |
| **8** | **Task Management & Wedding Planning Checklist** | `tasks` + `planning` | ✅ **COMPLETED** | Weddings |
| **9** | **Wedding Team & Collaborator Role Permissions** | `weddings` + `roles` | ✅ **COMPLETED** | Weddings |
| **10** | **Email/WhatsApp Notifications & Reminders** | `notifications` | ✅ **COMPLETED** | Weddings |
| **11** | **Cloudinary Photo Vault & Guest Media Gallery** | `media` + `photos` | ✅ **COMPLETED** | Weddings |
| **12** | **Real-Time QR Check-in & Banquet Access** | `checkins` + `access` | ✅ **COMPLETED** | Weddings |
| **13** | **YouTube Live Stream & Virtual Pheras Broadcast** | `livestream` + `broadcast` | 🟡 **NEXT UP** | Events |

---

## 🎯 Next Feature to Build: Feature 13 — YouTube Live Stream & Virtual Pheras Broadcast

### Why Live Streaming Next?
Now that the imperial gate check-in desk, guest seating allocation, and photo vault are operational, remote relatives and global guests who cannot travel to Udaipur need high-definition access to the live Vedic ceremonies (Pheras, Sangeet, Muhurtham). Feature 13 provides real-time YouTube/HLS live streaming, interactive guest blessings chat, and remote prayer shlokas.

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
| **2026-09-28** | **Feature 1: User Authentication** | Full user registration, session management, secure HTTP cookies, and protected routing. |
| **2026-09-29** | **Feature 2: Wedding Management** | Multi-wedding onboarding, tenancy isolation, roles, and wedding switching. |
| **2026-09-29** | **Feature 3: Events & Ceremonies** | Multi-ceremony itinerary, calendar timelines, venues, and conflict checking. |
| **2026-09-29** | **Feature 4: Guest Registry & Seating** | Household groupings, Mandap seating tags, dietary preferences, and archive/unarchive. |
| **2026-09-30** | **Feature 5: Digital Invitations & Tokens** | Royal Invitation Studio, 4 Heritage Themes, zero-password cryptographic magic tokens (`tok_...`), WhatsApp pass dispatch, live mobile simulator, and public guest unboxing page (`/invite/:token`). |
| **2026-10-01** | **Feature 6: RSVP Collection & Attendance** | Multi-event RSVP collection, dietary preferences, guest count, and attendance statistics. |
| **2026-10-01** | **Feature 7: Public Wedding Website** | `/w/:slug` public royal website with itinerary, story, countdown, dress code, and venue maps. |
| **2026-10-02** | **Feature 8: Task Management & Planning** | Comprehensive planning checklist, categories, due dates, assignments, and progress analytics. |
| **2026-10-02** | **Feature 9: Collaborator RBAC Suite** | Multi-user roles (Owner, Co-Planner, Coordinator, Viewer), email invitations, and permission enforcement. |
| **2026-10-02** | **Feature 10: Multi-Channel Notifications** | Royal Notification Hub, Resend email dispatch, WhatsApp simulation, countdown reminder triggers, top-bar interactive alert center, broadcast composer, and dispatch ledger. |
| **2026-10-03** | **Feature 11: Cloudinary Photo Vault** | Direct Cloudinary upload signature adapter, Shubh Smriti responsive masonry gallery, ritual albums carousel, banquet table QR stream banner, curator moderation desk, full-screen 4K lightbox, and mobile-first guest photo upload page. |

---

> [!NOTE]  
> **Status:** Features 1–11 completed, tested, and running cleanly on local dev servers. Proceeding to Feature 12 (Real-Time QR Check-in & Banquet Access).
