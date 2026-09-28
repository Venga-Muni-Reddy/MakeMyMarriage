# MakeMyMarriage
## API Design Document

**Version:** 1.0  
**API Style:** REST  
**API Version:** `/api/v1`  
**Authentication:** Server-side sessions + secure cookies  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Cache / Rate Limiting:** Redis  
**Media:** Cloudinary  
**Email:** Resend  
**Real-Time:** Server-Sent Events (SSE)  
**API Documentation:** OpenAPI 3.x + Swagger UI  
**Architecture:** Modular Monolith, future-service-ready  
**Primary Tenant:** Wedding

---

# 1. Purpose

This document defines the production-level API architecture for **MakeMyMarriage**.

The API provides the interface between:

- Web frontend
- Authenticated wedding owners
- Organizers
- Guest invitation experience
- Wedding website
- Wedding dashboard
- Event management
- Guest management
- RSVP
- Invitations
- Task planning
- Photo gallery
- Guest check-in
- Live streaming
- Notifications
- Real-time dashboard updates

The API is designed for the initial India-first product while keeping the architecture extensible for international expansion and future scale.

---

# 2. API Design Goals

The API should provide:

1. Strong authentication
2. Wedding-level tenant isolation
3. Role-based authorization
4. Guest account-free access
5. Secure invitation links
6. Consistent request/response formats
7. Standardized errors
8. Idempotent critical operations
9. Pagination
10. Filtering and sorting
11. Rate limiting
12. Asynchronous email processing
13. Real-time dashboard updates
14. Secure media uploads
15. OpenAPI documentation
16. Future API versioning
17. Observability
18. Easy frontend integration

---

# 3. High-Level API Architecture

```text
                    Browser
                       │
                       │ HTTPS
                       ▼
                ┌───────────────┐
                │  Web Frontend │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │   REST API    │
                │    /api/v1    │
                └───────┬───────┘
                        │
             ┌──────────┼──────────┐
             │          │          │
             ▼          ▼          ▼
          Session     Rate       Validation
          Auth        Limit
             │
             ▼
       Authorization
             │
             ▼
        Controllers
             │
             ▼
          Services
             │
       ┌─────┼─────┐
       │     │     │
       ▼     ▼     ▼
   Prisma  Redis  Outbox
       │           │
       ▼           ▼
 PostgreSQL      Worker
                   │
                   ▼
                 Resend
```

External media:

```text
Frontend
   │
   ▼
API → Upload Authorization
   │
   ▼
Cloudinary
   │
   ▼
API → Save Media Metadata
```

Real-time:

```text
Database / Domain Event
          ↓
       Event Bus
          ↓
         SSE
          ↓
       Browser
```

---

# 4. Base URL

All application APIs are versioned:

```text
/api/v1
```

Examples:

```text
/api/v1/auth/login
/api/v1/weddings
/api/v1/events
/api/v1/guests
```

Production:

```text
https://api.makemymarriage.com/api/v1
```

The exact production domain can be finalized during deployment.

---

# 5. API Versioning

Version is part of the URL.

```text
/api/v1
```

Future breaking API:

```text
/api/v2
```

Non-breaking changes should not require a new version.

Examples of non-breaking changes:

```text
Adding an optional response field
Adding an optional query parameter
Adding a new endpoint
```

Breaking changes require a new API version.

---

# 6. REST Conventions

Use standard HTTP methods.

| Method | Purpose |
|---|---|
| GET | Read |
| POST | Create/action |
| PUT | Full replacement |
| PATCH | Partial update |
| DELETE | Delete/archive |

Example:

```text
GET    /weddings
POST   /weddings
GET    /weddings/:weddingId
PATCH  /weddings/:weddingId
DELETE /weddings/:weddingId
```

---

# 7. Resource-Oriented Design

Prefer:

```text
GET /weddings/:weddingId/events
```

instead of:

```text
GET /getWeddingEvents
```

Use nouns rather than verbs where possible.

---

# 8. Action Endpoints

Some operations represent actions rather than CRUD.

Examples:

```text
POST /invitations/:id/send
POST /invitations/:id/resend
POST /guest-access/verify
POST /events/:id/check-in
POST /photos/:id/approve
POST /live-streams/:id/start
```

These are appropriate because the operation represents a business command.

---

# 9. Authentication Architecture

MakeMyMarriage uses server-side sessions.

```text
Browser
   │
   │ HTTPS
   ▼
POST /auth/login
   │
   ▼
Validate credentials
   │
   ▼
Create session
   │
   ▼
Set secure cookie
```

The browser does not need to manually manage JWT access tokens.

---

# 10. Session Cookie

Cookie properties:

```text
HttpOnly
Secure
SameSite
```

Example conceptually:

```text
mm_session=<opaque-session-id>
```

JavaScript cannot read the cookie when `HttpOnly` is enabled.

This reduces token exposure through client-side JavaScript.

---

# 11. Session Storage

Sessions can be stored in Redis or a persistent session store.

Recommended architecture:

```text
Browser
   ↓
Session Cookie
   ↓
API
   ↓
Redis Session
   ↓
User ID
```

PostgreSQL remains the source of truth for the user.

---

# 12. Session Lifecycle

```text
Login
 ↓
Create Session
 ↓
Set Cookie
 ↓
Authenticated Requests
 ↓
Logout
 ↓
Destroy Session
 ↓
Clear Cookie
```

---

# 13. Authentication Endpoints

```text
POST   /auth/signup
POST   /auth/login
POST   /auth/logout
GET    /auth/me
POST   /auth/verify-email
POST   /auth/resend-verification
POST   /auth/forgot-password
POST   /auth/reset-password
```

---

# 14. Signup

```text
POST /api/v1/auth/signup
```

Request:

```json
{
  "name": "Muni Reddy",
  "email": "muni@example.com",
  "password": "********"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Muni Reddy",
      "email": "muni@example.com"
    }
  },
  "message": "Account created successfully"
}
```

---

# 15. Login

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "muni@example.com",
  "password": "********"
}
```

Server:

```text
Validate credentials
        ↓
Create session
        ↓
Set HttpOnly cookie
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Muni Reddy",
      "email": "muni@example.com"
    }
  },
  "message": "Login successful"
}
```

---

# 16. Logout

```text
POST /api/v1/auth/logout
```

Authentication required.

Server:

```text
Destroy session
Clear cookie
```

Response:

```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

# 17. Current User

```text
GET /api/v1/auth/me
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Muni Reddy",
      "email": "muni@example.com",
      "preferredLanguage": "en"
    }
  }
}
```

---

# 18. Password Security

Passwords must never be stored directly.

```text
Password
   ↓
Argon2id / strong password hash
   ↓
password_hash
```

The API never returns `password_hash`.

---

# 19. Authentication Middleware

Protected routes use:

```text
requireAuth()
```

Conceptually:

```text
Request
 ↓
Read session cookie
 ↓
Find session
 ↓
Find user
 ↓
Attach user context
 ↓
Continue
```

Invalid session:

```text
401 UNAUTHORIZED
```

---

# 20. Wedding Authorization

Authentication only proves:

> Who is the user?

Authorization proves:

> What can this user do inside this wedding?

Flow:

```text
User
 ↓
Session
 ↓
Wedding Membership
 ↓
Role
 ↓
Permission
 ↓
Resource
```

---

# 21. Wedding Context

A protected request should establish:

```text
userId
weddingId
membership
role
permissions
```

before business logic executes.

---

# 22. Permission Middleware

Conceptual:

```text
requirePermission("guest:update")
```

Examples:

```text
wedding:read
wedding:update

event:create
event:update
event:delete

guest:read
guest:create
guest:update
guest:delete

invitation:send
invitation:resend

photo:approve

task:create
task:update

checkin:create
```

---

# 23. Owner vs Organizer

Initial roles:

```text
OWNER
ORGANIZER
```

Owner can manage the wedding.

Organizer receives delegated permissions.

The authorization system should not hardcode every route around role names.

Instead:

```text
Role
 ↓
Permissions
 ↓
Route authorization
```

---

# 24. Wedding APIs

```text
GET    /weddings
POST   /weddings
GET    /weddings/:weddingId
PATCH  /weddings/:weddingId
DELETE /weddings/:weddingId
```

---

# 25. List User Weddings

```text
GET /api/v1/weddings
```

Returns weddings accessible to the authenticated user.

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Muni & Priya",
        "slug": "muni-priya",
        "weddingDate": "2027-02-14",
        "role": "OWNER"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

# 26. Create Wedding

```text
POST /api/v1/weddings
```

Request:

```json
{
  "name": "Muni & Priya",
  "weddingDate": "2027-02-14",
  "timezone": "Asia/Kolkata",
  "countryCode": "IN",
  "defaultLanguage": "en"
}
```

Transaction:

```text
Create Wedding
 ↓
Create Owner Membership
 ↓
Create Website
 ↓
Create Default Guest Categories
```

---

# 27. Get Wedding

```text
GET /api/v1/weddings/:weddingId
```

Returns wedding summary and authorized metadata.

---

# 28. Update Wedding

```text
PATCH /api/v1/weddings/:weddingId
```

Example:

```json
{
  "name": "Muni & Priya Wedding",
  "weddingDate": "2027-02-14",
  "timezone": "Asia/Kolkata"
}
```

---

# 29. Delete Wedding

```text
DELETE /api/v1/weddings/:weddingId
```

Deletion should initiate a safe archive/deletion workflow rather than immediately destroying all records.

Response:

```json
{
  "success": true,
  "data": null,
  "message": "Wedding deletion requested"
}
```

---

# 30. Wedding Members

```text
GET    /weddings/:weddingId/members
POST   /weddings/:weddingId/members
PATCH  /weddings/:weddingId/members/:memberId
DELETE /weddings/:weddingId/members/:memberId
```

---

# 31. Invite Organizer

```text
POST /weddings/:weddingId/members
```

Request:

```json
{
  "email": "organizer@example.com",
  "role": "ORGANIZER"
}
```

The backend:

```text
Find/create invitation
 ↓
Create membership invitation
 ↓
Queue email
```

---

# 32. Events API

```text
GET    /weddings/:weddingId/events
POST   /weddings/:weddingId/events
GET    /weddings/:weddingId/events/:eventId
PATCH  /weddings/:weddingId/events/:eventId
DELETE /weddings/:weddingId/events/:eventId
```

---

# 33. Create Event

```text
POST /weddings/:weddingId/events
```

Request:

```json
{
  "name": "Wedding Ceremony",
  "description": "Main wedding ceremony",
  "startAt": "2027-02-14T04:30:00Z",
  "endAt": "2027-02-14T08:30:00Z",
  "timezone": "Asia/Kolkata",
  "venueId": "uuid",
  "visibility": "INVITED_GUESTS_ONLY"
}
```

---

# 34. Event Listing Filters

```text
GET /weddings/:weddingId/events
```

Optional:

```text
?status=SCHEDULED
&from=2027-01-01
&to=2027-03-01
&sortBy=startAt
&sortOrder=asc
```

---

# 35. Venues API

```text
GET    /weddings/:weddingId/venues
POST   /weddings/:weddingId/venues
GET    /weddings/:weddingId/venues/:venueId
PATCH  /weddings/:weddingId/venues/:venueId
DELETE /weddings/:weddingId/venues/:venueId
```

---

# 36. Guests API

```text
GET    /weddings/:weddingId/guests
POST   /weddings/:weddingId/guests
GET    /weddings/:weddingId/guests/:guestId
PATCH  /weddings/:weddingId/guests/:guestId
DELETE /weddings/:weddingId/guests/:guestId
```

---

# 37. Guest Listing

```text
GET /weddings/:weddingId/guests
```

Supports:

```text
?page=1
&limit=20
&search=rahul
&categoryId=uuid
&side=BRIDE
&sortBy=createdAt
&sortOrder=desc
```

---

# 38. Guest Search

Search should cover:

```text
displayName
email
phone
```

The search remains scoped to:

```text
weddingId
```

---

# 39. Create Guest

```text
POST /weddings/:weddingId/guests
```

Request:

```json
{
  "firstName": "Rahul",
  "lastName": "Reddy",
  "email": "rahul@example.com",
  "phone": "+91XXXXXXXXXX",
  "categoryId": "uuid",
  "side": "GROOM",
  "eventIds": [
    "event-uuid-1",
    "event-uuid-2"
  ]
}
```

Transaction:

```text
Create Guest
 ↓
Create GuestEvent relationships
```

---

# 40. Guest Categories API

```text
GET    /weddings/:weddingId/guest-categories
POST   /weddings/:weddingId/guest-categories
PATCH  /weddings/:weddingId/guest-categories/:categoryId
DELETE /weddings/:weddingId/guest-categories/:categoryId
```

---

# 41. Guest Event Assignment

```text
POST   /weddings/:weddingId/guests/:guestId/events
DELETE /weddings/:weddingId/guests/:guestId/events/:eventId
```

Request:

```json
{
  "eventId": "uuid"
}
```

---

# 42. Invitations API

```text
GET  /weddings/:weddingId/invitations
POST /weddings/:weddingId/invitations
GET  /weddings/:weddingId/invitations/:invitationId
```

Actions:

```text
POST /weddings/:weddingId/invitations/:invitationId/send
POST /weddings/:weddingId/invitations/:invitationId/resend
POST /weddings/:weddingId/invitations/:invitationId/revoke
```

---

# 43. Send Invitation

```text
POST /weddings/:weddingId/invitations/:invitationId/send
```

Flow:

```text
Validate invitation
 ↓
Generate secure token
 ↓
Hash token
 ↓
Store invitation access
 ↓
Create notification/outbox event
 ↓
Return response
 ↓
Worker sends email
```

The API should not wait for Resend.

---

# 44. Invitation Response

```json
{
  "success": true,
  "data": {
    "invitationId": "uuid",
    "status": "QUEUED"
  },
  "message": "Invitation queued for delivery"
}
```

---

# 45. Guest Invitation APIs

These endpoints are intentionally outside normal authenticated-user APIs.

```text
GET  /guest-access/:token
POST /guest-access/:token/verify
POST /guest-access/logout
GET  /guest-access/me
```

The token should be exchanged for a secure guest session.

---

# 46. Guest Access Flow

```text
Guest clicks email link
        ↓
GET /guest-access/:token
        ↓
Validate token hash
        ↓
Check expiry/revocation
        ↓
Create guest session
        ↓
Set secure cookie
        ↓
Redirect guest
```

---

# 47. Guest Session

After verification:

```text
mm_guest_session=<opaque-session>
```

The guest does not receive a user account.

---

# 48. Guest Current Session

```text
GET /guest-access/me
```

Response:

```json
{
  "success": true,
  "data": {
    "guest": {
      "id": "uuid",
      "displayName": "Rahul"
    },
    "wedding": {
      "id": "uuid",
      "name": "Muni & Priya"
    },
    "events": [
      {
        "id": "uuid",
        "name": "Reception"
      }
    ]
  }
}
```

No unnecessary guest private data should be exposed.

---

# 49. RSVP APIs

Authenticated owner/organizer:

```text
GET /weddings/:weddingId/rsvps
GET /weddings/:weddingId/rsvps/:rsvpId
```

Guest:

```text
GET   /guest/events
POST  /guest/events/:eventId/rsvp
PATCH /guest/events/:eventId/rsvp
```

---

# 50. Guest RSVP

```text
POST /api/v1/guest/events/:eventId/rsvp
```

Request:

```json
{
  "status": "ATTENDING",
  "attendeeCount": 2,
  "foodPreference": "VEG",
  "accommodationRequired": false,
  "transportationRequired": true,
  "message": "Looking forward to it!"
}
```

---

# 51. RSVP Upsert

Because:

```text
UNIQUE(guest_id, event_id)
```

the backend should use an upsert-like operation.

Conceptually:

```text
Existing RSVP?
 ├── Yes → Update
 └── No  → Create
```

---

# 52. RSVP Statistics

```text
GET /weddings/:weddingId/events/:eventId/rsvp-summary
```

Response:

```json
{
  "success": true,
  "data": {
    "totalInvited": 250,
    "pending": 80,
    "attending": 140,
    "notAttending": 30,
    "maybe": 0,
    "attendeeCount": 178
  }
}
```

---

# 53. Tasks API

```text
GET    /weddings/:weddingId/tasks
POST   /weddings/:weddingId/tasks
GET    /weddings/:weddingId/tasks/:taskId
PATCH  /weddings/:weddingId/tasks/:taskId
DELETE /weddings/:weddingId/tasks/:taskId
```

---

# 54. Create Task

```text
POST /weddings/:weddingId/tasks
```

Request:

```json
{
  "title": "Confirm wedding decorations",
  "description": "Finalize stage decorations",
  "eventId": "uuid",
  "assigneeId": "uuid",
  "priority": "HIGH",
  "dueAt": "2027-02-01T10:00:00Z"
}
```

---

# 55. Task Filters

```text
GET /weddings/:weddingId/tasks
```

Parameters:

```text
?status=TODO
&priority=HIGH
&assigneeId=uuid
&eventId=uuid
&sortBy=dueAt
&sortOrder=asc
```

---

# 56. Task Completion

Use:

```text
PATCH /weddings/:weddingId/tasks/:taskId
```

Request:

```json
{
  "status": "COMPLETED"
}
```

The service records an activity.

---

# 57. Media Upload Architecture

The backend should not proxy large image uploads.

Flow:

```text
Browser
   │
   │ POST upload authorization
   ▼
API
   │
   │ signed/upload configuration
   ▼
Browser
   │
   │ direct upload
   ▼
Cloudinary
   │
   │ asset information
   ▼
Browser
   │
   │ confirm upload
   ▼
API
   │
   ▼
PostgreSQL
```

---

# 58. Media Upload Endpoint

```text
POST /weddings/:weddingId/media/upload-session
```

Response:

```json
{
  "success": true,
  "data": {
    "uploadUrl": "...",
    "uploadParameters": {},
    "provider": "CLOUDINARY"
  }
}
```

Sensitive signing information must be generated server-side.

---

# 59. Confirm Media Upload

```text
POST /weddings/:weddingId/media
```

Request:

```json
{
  "provider": "CLOUDINARY",
  "publicId": "weddings/uuid/photo123",
  "secureUrl": "https://...",
  "resourceType": "image",
  "format": "jpg",
  "width": 1920,
  "height": 1080,
  "bytes": 345678
}
```

Backend validates the upload context and creates `media_assets`.

---

# 60. Photos API

```text
GET    /weddings/:weddingId/photos
POST   /weddings/:weddingId/photos
GET    /weddings/:weddingId/photos/:photoId
PATCH  /weddings/:weddingId/photos/:photoId
DELETE /weddings/:weddingId/photos/:photoId
```

---

# 61. Guest Photo Upload

Guest:

```text
POST /guest/photos/upload-session
POST /guest/photos
```

Guest-uploaded photo:

```text
moderationStatus = PENDING
```

unless the wedding settings explicitly allow automatic publishing.

---

# 62. Photo Approval

```text
POST /weddings/:weddingId/photos/:photoId/approve
POST /weddings/:weddingId/photos/:photoId/reject
```

Response:

```json
{
  "success": true,
  "data": {
    "photoId": "uuid",
    "moderationStatus": "APPROVED"
  }
}
```

---

# 63. Photo Listing Filters

```text
GET /weddings/:weddingId/photos
```

Parameters:

```text
?eventId=uuid
&visibility=PUBLIC
&moderationStatus=APPROVED
&page=1
&limit=30
```

---

# 64. Guest Check-In API

Authenticated staff:

```text
POST /weddings/:weddingId/events/:eventId/check-ins
```

Request:

```json
{
  "credential": "secure-qr-value"
}
```

Backend:

```text
Validate credential
 ↓
Find guest
 ↓
Validate event authorization
 ↓
Check existing entry
 ↓
Create guest entry
 ↓
Publish realtime event
```

---

# 65. Check-In Response

Success:

```json
{
  "success": true,
  "data": {
    "guest": {
      "id": "uuid",
      "displayName": "Rahul Reddy"
    },
    "event": {
      "id": "uuid",
      "name": "Reception"
    },
    "checkedInAt": "2027-02-14T15:00:00Z"
  },
  "message": "Guest checked in successfully"
}
```

Already checked in:

```text
409 CONFLICT
```

---

# 66. Guest Check-In Statistics

```text
GET /weddings/:weddingId/events/:eventId/check-ins/summary
```

Response:

```json
{
  "success": true,
  "data": {
    "totalInvited": 500,
    "checkedIn": 312,
    "remaining": 188
  }
}
```

---

# 67. Mobile Camera QR Scanning

The browser handles camera access.

```text
Mobile Browser
 ↓
Camera API
 ↓
QR Decoder
 ↓
Credential
 ↓
Check-In API
```

The backend does not need to access the camera.

---

# 68. Live Stream API

```text
GET    /weddings/:weddingId/live-streams
POST   /weddings/:weddingId/live-streams
GET    /weddings/:weddingId/live-streams/:streamId
PATCH  /weddings/:weddingId/live-streams/:streamId
DELETE /weddings/:weddingId/live-streams/:streamId
```

Actions:

```text
POST /weddings/:weddingId/live-streams/:streamId/start
POST /weddings/:weddingId/live-streams/:streamId/end
```

---

# 69. Live Stream Design

Initially:

```text
provider = YOUTUBE
```

The API stores the stream metadata.

The actual video infrastructure remains outside MakeMyMarriage.

---

# 70. Wedding Website APIs

Management APIs:

```text
GET   /weddings/:weddingId/website
PATCH /weddings/:weddingId/website
POST  /weddings/:weddingId/website/publish
POST  /weddings/:weddingId/website/unpublish
```

Sections:

```text
GET    /weddings/:weddingId/website/sections
POST   /weddings/:weddingId/website/sections
PATCH  /weddings/:weddingId/website/sections/:sectionId
DELETE /weddings/:weddingId/website/sections/:sectionId
POST   /weddings/:weddingId/website/sections/reorder
```

---

# 71. Public Wedding Website API

Public:

```text
GET /public/weddings/:slug
```

This endpoint does not require authentication.

It returns only public data.

---

# 72. Public Website Response

Conceptually:

```json
{
  "success": true,
  "data": {
    "wedding": {
      "name": "Muni & Priya",
      "date": "2027-02-14"
    },
    "events": [],
    "venues": [],
    "sections": [],
    "gallery": [],
    "liveStream": null
  }
}
```

No private guest data should be included.

---

# 73. Website Publication

Only published websites should be publicly accessible.

```text
Draft
 ↓
Publish
 ↓
Public
```

Unpublish:

```text
Public
 ↓
Unpublish
 ↓
Draft
```

---

# 74. Notifications API

Owner/organizer:

```text
GET /weddings/:weddingId/notifications
```

The frontend normally does not directly trigger Resend.

Instead:

```text
API
 ↓
Notification Service
 ↓
Outbox
 ↓
Worker
 ↓
Resend
```

---

# 75. Reminder API

```text
POST /weddings/:weddingId/reminders
GET  /weddings/:weddingId/reminders
```

Future reminder types:

```text
RSVP reminder
Event reminder
Task reminder
Wedding countdown
```

The exact reminder resource can evolve independently from notifications.

---

# 76. Asynchronous Email Architecture

Example:

```text
User
 ↓
POST /invitations/:id/send
 ↓
API
 ↓
Database transaction
 ├── Invitation = QUEUED
 └── Outbox Event
 ↓
HTTP 202
 ↓
Worker
 ↓
Resend
 ↓
Invitation = SENT
```

---

# 77. HTTP 202 for Async Operations

For operations that have been accepted but are not completed:

```text
202 ACCEPTED
```

Example:

```text
Invitation queued
Photo processing queued
Bulk email queued
```

---

# 78. Real-Time Dashboard

Use Server-Sent Events.

Endpoint:

```text
GET /weddings/:weddingId/events/stream
```

The authenticated user must have permission to access the wedding.

---

# 79. SSE Flow

```text
Browser
   │
   │ GET /events/stream
   ▼
API
   │
   │ Keep HTTP connection open
   ▼
SSE
   │
   ├── RSVP_UPDATED
   ├── GUEST_CHECKED_IN
   ├── TASK_UPDATED
   ├── PHOTO_APPROVED
   └── INVITATION_STATUS_UPDATED
```

---

# 80. SSE Event Format

Example:

```text
event: RSVP_UPDATED
data: {
  "weddingId": "...",
  "eventId": "...",
  "guestId": "...",
  "status": "ATTENDING"
}
```

---

# 81. Realtime Event Types

Initial:

```text
WEDDING_UPDATED
EVENT_CREATED
EVENT_UPDATED
GUEST_CREATED
GUEST_UPDATED
RSVP_UPDATED
TASK_CREATED
TASK_UPDATED
PHOTO_UPLOADED
PHOTO_APPROVED
PHOTO_REJECTED
GUEST_CHECKED_IN
INVITATION_STATUS_UPDATED
LIVE_STREAM_UPDATED
```

---

# 82. SSE Reconnection

Browsers can automatically reconnect.

The server should support event IDs where practical.

Conceptually:

```text
id: event-12345
event: GUEST_CHECKED_IN
data: {...}
```

This helps clients recover from temporary network interruptions.

---

# 83. API Response Convention

Successful response:

```json
{
  "success": true,
  "data": {},
  "message": null,
  "meta": {}
}
```

For list endpoints:

```json
{
  "success": true,
  "data": {
    "items": []
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

# 84. Error Response

```json
{
  "success": false,
  "error": {
    "code": "GUEST_NOT_FOUND",
    "message": "Guest not found",
    "details": null
  }
}
```

---

# 85. Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": [
        "Invalid email address"
      ],
      "name": [
        "Name is required"
      ]
    }
  }
}
```

---

# 86. HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 202 | Accepted for async processing |
| 204 | Success with no response body |
| 400 | Bad request |
| 401 | Authentication required |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict |
| 422 | Validation failure |
| 429 | Rate limited |
| 500 | Internal server error |
| 503 | Temporary service unavailable |

---

# 87. Error Code Categories

Authentication:

```text
AUTH_INVALID_CREDENTIALS
AUTH_SESSION_EXPIRED
AUTH_UNAUTHORIZED
AUTH_EMAIL_NOT_VERIFIED
```

Authorization:

```text
FORBIDDEN
INSUFFICIENT_PERMISSION
WEDDING_ACCESS_DENIED
```

Resources:

```text
WEDDING_NOT_FOUND
EVENT_NOT_FOUND
GUEST_NOT_FOUND
TASK_NOT_FOUND
PHOTO_NOT_FOUND
INVITATION_NOT_FOUND
```

Business conflicts:

```text
RSVP_CONFLICT
ALREADY_CHECKED_IN
INVITATION_REVOKED
INVITATION_EXPIRED
WEBSITE_ALREADY_PUBLISHED
```

---

# 88. Idempotency

Critical operations should support idempotency.

Examples:

```text
Send invitation
Create check-in
Create RSVP
Create payment
```

The client may send:

```text
Idempotency-Key: <unique-key>
```

---

# 89. Idempotency Flow

```text
Request
 ↓
Idempotency-Key
 ↓
Redis / DB
 ↓
Already processed?
 ├── Yes → Return previous result
 └── No  → Process
```

For important durable operations, database-backed idempotency records are preferable to relying only on Redis.

---

# 90. Invitation Idempotency

Suppose user double-clicks:

```text
Send Invitation
```

Without idempotency:

```text
Email 1
Email 2
```

With idempotency:

```text
Request A
Request B
   ↓
Same Idempotency-Key
   ↓
One operation
```

---

# 91. RSVP Idempotency

Guest double-click:

```text
Submit RSVP
```

The API should not create duplicate RSVP records.

Database uniqueness:

```text
UNIQUE(guest_id, event_id)
```

plus application-level idempotency provides protection.

---

# 92. Rate Limiting

Redis-backed rate limiting.

Sensitive endpoints receive stricter limits:

```text
/login
/signup
/password-reset
/guest-access
/check-in
```

Example conceptual policy:

```text
Login
5 attempts / minute / IP + identifier
```

Exact production thresholds should be tuned after observing real traffic.

---

# 93. Guest Access Rate Limiting

Invitation-token verification should be protected against brute-force attempts.

Rate-limit based on combinations such as:

```text
IP
Invitation token context
```

without exposing whether a token belongs to a valid guest.

---

# 94. QR Check-In Rate Limiting

Check-in endpoint should prevent abusive automated requests while still supporting legitimate rapid scanning.

Use:

```text
Authenticated staff
+
Wedding
+
Event
+
IP/device context
```

for rate-limit policy.

---

# 95. CORS

Only approved frontend origins should be allowed.

Development:

```text
http://localhost:5173
```

Production:

```text
https://makemymarriage.com
```

Do not use:

```text
Access-Control-Allow-Origin: *
```

for authenticated APIs.

---

# 96. CSRF Protection

Because authentication uses cookies, CSRF protection is required.

Use a combination of:

```text
SameSite cookies
+
CSRF token / origin validation
+
Strict CORS
```

for state-changing requests.

---

# 97. Secure Headers

API should use appropriate security headers.

Examples:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Strict-Transport-Security
```

Exact policy can be finalized during deployment.

---

# 98. Input Security

Never directly concatenate user input into SQL.

Prisma parameterization handles normal database queries safely.

Still validate:

```text
Strings
IDs
URLs
Dates
Enum values
JSON payloads
File metadata
```

---

# 99. File Upload Security

Validate:

```text
Content type
File size
Dimensions
Provider response
Wedding ownership
Uploader identity
```

Do not trust:

```text
filename
client-provided MIME type
client-provided dimensions
```

alone.

---

# 100. API Logging

Each request should have a request ID.

Example:

```text
X-Request-ID: 0198...
```

Logs should associate:

```text
requestId
userId
weddingId
endpoint
statusCode
duration
```

when available.

---

# 101. Sensitive Data Logging

Never log:

```text
Passwords
Session tokens
Invitation raw tokens
Guest private credentials
```

Use hashes or redacted values where necessary.

---

# 102. Observability

Important metrics:

```text
Request count
Latency
Error rate
Database latency
Redis latency
Email failures
Cloudinary failures
SSE connection count
Queue depth
```

---

# 103. API Layer Structure

Recommended backend structure:

```text
src/
├── modules/
│   ├── auth/
│   ├── weddings/
│   ├── events/
│   ├── guests/
│   ├── invitations/
│   ├── rsvp/
│   ├── tasks/
│   ├── media/
│   ├── checkins/
│   ├── livestream/
│   ├── website/
│   ├── notifications/
│   └── activities/
│
├── middleware/
├── shared/
│   ├── errors/
│   ├── validation/
│   ├── auth/
│   ├── pagination/
│   └── logging/
│
├── infrastructure/
│   ├── prisma/
│   ├── redis/
│   ├── cloudinary/
│   ├── resend/
│   └── realtime/
│
└── app/
```

---

# 104. Module Structure

Each domain module can follow:

```text
module/
├── controller
├── service
├── repository
├── schema
├── routes
├── types
└── tests
```

Example:

```text
guests/
├── guest.controller.ts
├── guest.service.ts
├── guest.repository.ts
├── guest.schema.ts
├── guest.routes.ts
└── guest.test.ts
```

---

# 105. Controller Responsibility

Controller should:

- Read HTTP request
- Validate request
- Call service
- Return HTTP response

Controller should not contain complex business logic.

Bad:

```text
Controller
 ├── database query
 ├── invitation logic
 ├── authorization logic
 └── email logic
```

Better:

```text
Controller
   ↓
Service
   ↓
Repository
```

---

# 106. Service Responsibility

Service owns business logic.

Example:

```text
InvitationService.sendInvitation()
```

handles:

```text
Validate invitation
Generate token
Create access
Create outbox event
Update invitation status
```

---

# 107. Repository Responsibility

Repository handles persistence.

Example:

```text
GuestRepository.findById()
GuestRepository.create()
GuestRepository.update()
GuestRepository.delete()
```

The repository should not decide whether the user is authorized.

---

# 108. Authorization Responsibility

Authorization layer determines:

```text
Can this user perform this operation?
```

Example:

```text
requireWeddingPermission(
  weddingId,
  "guest:update"
)
```

---

# 109. Transaction Boundary

Services determine transaction boundaries.

Example:

```text
GuestService.createGuest()
```

transaction:

```text
BEGIN
 ↓
Guest
 ↓
GuestEvent
 ↓
Activity
 ↓
COMMIT
```

External email sending happens outside the DB transaction.

---

# 110. Outbox Pattern

For reliable async operations:

```text
Database Transaction
 ├── Business Change
 └── Outbox Event
          ↓
       COMMIT
          ↓
       Worker
          ↓
      External API
```

This avoids:

```text
Database success
+
Email event lost
```

---

# 111. Outbox Events

Potential event types:

```text
USER_REGISTERED
WEDDING_CREATED
EVENT_CREATED
GUEST_CREATED
INVITATION_QUEUED
RSVP_UPDATED
PHOTO_UPLOADED
PHOTO_APPROVED
TASK_UPDATED
GUEST_CHECKED_IN
LIVE_STREAM_UPDATED
```

---

# 112. Background Workers

Worker responsibilities:

```text
Email
Invitation delivery
Reminder processing
Notification processing
Media processing
Cleanup
Future scheduled jobs
```

The API remains responsive.

---

# 113. Email Retry

If Resend fails:

```text
Attempt 1
 ↓
Failure
 ↓
Retry
 ↓
Failure
 ↓
Retry with backoff
 ↓
Permanent failure
```

The notification should eventually become:

```text
FAILED
```

with an error recorded for operational debugging.

---

# 114. Retry Strategy

Use exponential backoff with limits.

Conceptually:

```text
1st retry → short delay
2nd retry → longer delay
3rd retry → longer delay
```

Do not retry forever.

---

# 115. Public API Cache

Public wedding website data can be cached.

Example:

```text
GET /public/weddings/:slug
```

Flow:

```text
Request
 ↓
Redis
 ├── Hit → Return
 └── Miss
       ↓
   PostgreSQL
       ↓
     Cache
       ↓
    Response
```

---

# 116. Cache Invalidation

When website content changes:

```text
Update Section
 ↓
Invalidate
wedding:public:{weddingId}
 ↓
Next request rebuilds cache
```

---

# 117. ETag / HTTP Caching

For public resources, future optimization can use:

```text
ETag
Last-Modified
Cache-Control
```

This reduces unnecessary transfers.

---

# 118. Pagination Convention

Default:

```text
page = 1
limit = 20
```

Maximum:

```text
limit = 100
```

The backend must enforce maximum limits.

---

# 119. Cursor Pagination

High-volume resources:

```text
activities
photos
notifications
```

can support:

```text
?cursor=<opaque-cursor>
&limit=30
```

Response:

```json
{
  "success": true,
  "data": {
    "items": []
  },
  "meta": {
    "nextCursor": "..."
  }
}
```

---

# 120. Filtering Convention

Use query parameters.

Example:

```text
GET /weddings/:weddingId/guests
?search=rahul
&categoryId=uuid
&side=GROOM
```

Avoid deeply nested arbitrary filter syntax for MVP.

---

# 121. Sorting Convention

```text
?sortBy=createdAt
&sortOrder=desc
```

The backend should whitelist sortable fields.

Never directly interpolate arbitrary user-provided column names.

---

# 122. Bulk Operations

Guest management may eventually require:

```text
POST /weddings/:weddingId/guests/bulk
```

for:

- CSV import
- Bulk invitation
- Bulk event assignment

Bulk operations should be asynchronous when large.

---

# 123. CSV Import

Future endpoint:

```text
POST /weddings/:weddingId/guests/import
```

Flow:

```text
Upload CSV
 ↓
Validate
 ↓
Create import job
 ↓
202 Accepted
 ↓
Worker processes
 ↓
Import result
```

---

# 124. Bulk Invitations

Future:

```text
POST /weddings/:weddingId/invitations/bulk-send
```

Response:

```json
{
  "success": true,
  "data": {
    "jobId": "uuid"
  },
  "message": "Invitation delivery queued"
}
```

---

# 125. Job Status

Future:

```text
GET /jobs/:jobId
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "PROCESSING",
    "progress": 72
  }
}
```

---

# 126. API Security Boundary for Guest Website

Public:

```text
/public/weddings/:slug
```

Guest:

```text
/guest-access/*
```

Authenticated organizer:

```text
/weddings/:weddingId/*
```

These should be treated as three separate security contexts.

---

# 127. Security Contexts

```text
PUBLIC
   │
   └── Public wedding information

GUEST
   │
   └── Authorized guest information

AUTHENTICATED USER
   │
   └── Wedding management

SYSTEM/WORKER
   │
   └── Internal asynchronous operations
```

---

# 128. API Sequence — Login

```text
Browser
  │
  │ POST /auth/login
  ▼
Auth Controller
  │
  ▼
Auth Service
  │
  ├── Validate password
  │
  └── Create session
  │
  ▼
Redis
  │
  ▼
Set-Cookie
  │
  ▼
Browser
```

---

# 129. API Sequence — Create Wedding

```text
Browser
  │
  │ POST /weddings
  ▼
Auth Middleware
  │
  ▼
Wedding Service
  │
  ▼
Transaction
  ├── Wedding
  ├── Membership
  ├── Website
  └── Categories
  │
  ▼
Commit
  │
  ▼
Response
```

---

# 130. API Sequence — Invitation

```text
Organizer
   │
   │ POST /invitations/:id/send
   ▼
Invitation Service
   │
   ├── Validate
   ├── Generate token
   ├── Store hash
   ├── Update status
   └── Create outbox event
          │
          ▼
       Commit
          │
          ▼
        202
          │
          ▼
        Worker
          │
          ▼
       Resend
          │
          ▼
        Guest
```

---

# 131. API Sequence — Guest RSVP

```text
Guest
 │
 │ POST /guest/events/:id/rsvp
 ▼
Guest Session
 │
 ▼
Authorization
 │
 ▼
RSVP Service
 │
 ▼
Transaction
 ├── Validate event
 ├── Upsert RSVP
 └── Activity
 │
 ▼
Commit
 │
 ├── SSE → Dashboard
 │
 └── Optional notification
```

---

# 132. API Sequence — QR Check-In

```text
Staff Mobile
    │
    │ Scan QR
    ▼
QR Credential
    │
    │ POST /check-ins
    ▼
Check-In Service
    │
    ├── Validate staff
    ├── Validate QR
    ├── Validate event
    └── Insert check-in
            │
            ▼
       PostgreSQL
            │
            ▼
       SSE Event
            │
            ▼
       Dashboard
```

---

# 133. API Sequence — Guest Photo

```text
Guest
 │
 │ Request upload session
 ▼
API
 │
 ▼
Cloudinary authorization
 │
 ▼
Guest Browser
 │
 │ Upload
 ▼
Cloudinary
 │
 ▼
Confirm upload
 │
 ▼
API
 │
 ▼
Photo = PENDING
```

---

# 134. API Sequence — Dashboard Realtime

```text
Dashboard Browser
      │
      │ GET /events/stream
      ▼
     SSE
      │
      │
      │  Guest RSVP
      │
      ▼
Domain Event
      │
      ▼
SSE Publisher
      │
      ▼
Browser
      │
      ▼
Update dashboard
```

---

# 135. OpenAPI Structure

The API specification should be organized:

```text
openapi/
├── openapi.yaml
├── paths/
│   ├── auth.yaml
│   ├── weddings.yaml
│   ├── events.yaml
│   ├── guests.yaml
│   ├── invitations.yaml
│   ├── rsvp.yaml
│   ├── tasks.yaml
│   ├── media.yaml
│   ├── checkins.yaml
│   ├── livestream.yaml
│   ├── website.yaml
│   └── public.yaml
│
└── schemas/
    ├── user.yaml
    ├── wedding.yaml
    ├── guest.yaml
    ├── event.yaml
    └── common.yaml
```

---

# 136. Swagger UI

Development environment:

```text
/api/docs
```

OpenAPI JSON:

```text
/api/openapi.json
```

Production exposure can be restricted or protected depending on security policy.

---

# 137. API Contract Testing

Frontend and backend should agree on:

```text
Request schema
Response schema
Error schema
Enum values
Pagination
```

OpenAPI becomes the contract.

---

# 138. API Testing Layers

Tests should include:

### Unit

```text
Services
Validators
Permission functions
Utilities
```

### Integration

```text
API + PostgreSQL
API + Redis
```

### End-to-end

```text
Signup
Login
Create Wedding
Create Event
Add Guest
Send Invitation
Guest RSVP
Check-In
Photo Upload
Website Publishing
```

---

# 139. Authentication Test

Test:

```text
Correct credentials → 200
Wrong password → 401
Unknown user → 401
Expired session → 401
Logout → session invalid
```

---

# 140. Tenant Isolation Test

Critical test:

```text
User A owns Wedding A
User B owns Wedding B

User A requests:
GET /weddings/WeddingB/guests

Expected:
403
```

or an appropriately non-disclosing response according to the API security policy.

---

# 141. Guest Isolation Test

Guest A must not access:

```text
Guest B
```

even if:

```text
guestId
```

is known.

The guest session must establish identity server-side.

---

# 142. Invitation Security Tests

Test:

```text
Valid token → access
Expired token → reject
Revoked token → reject
Modified token → reject
Random token → reject
Reused revoked token → reject
```

---

# 143. Check-In Concurrency Test

Two requests:

```text
Scanner A
Scanner B
```

simultaneously.

Expected:

```text
One successful check-in
One conflict/already checked-in response
```

Database uniqueness is the final protection.

---

# 144. RSVP Concurrency Test

Two RSVP requests simultaneously.

Expected:

```text
One logical RSVP
Latest valid state retained
No duplicate database records
```

---

# 145. API Deprecation

If `/api/v1` eventually needs replacement:

```text
v1
 ↓
v2
```

During migration:

```text
v1 = maintained
v2 = recommended
```

After a documented deprecation period:

```text
v1 = retired
```

---

# 146. API Naming Rules

Use:

```text
/weddings
/events
/guests
/invitations
/tasks
/photos
```

Avoid:

```text
/getWeddings
/createGuest
/sendInvitation
```

for ordinary resource operations.

Use action endpoints only for true commands.

---

# 147. API URL Depth

Avoid excessive nesting.

Good:

```text
/weddings/:weddingId/events/:eventId
```

Avoid:

```text
/users/:userId/weddings/:weddingId/events/:eventId/guests/:guestId/photos
```

The authenticated session already establishes the user context.

---

# 148. Resource Ownership

The URL:

```text
/weddings/:weddingId/guests/:guestId
```

provides context.

The backend must verify:

```text
guest.wedding_id == weddingId
```

before operating.

---

# 149. No Trust in Client IDs

The frontend may send:

```text
weddingId
guestId
eventId
```

but the backend must validate relationships.

Never assume:

```text
client-provided ID = authorized resource
```

---

# 150. API Response DTOs

Do not directly expose Prisma database objects.

Instead:

```text
Database Model
 ↓
Service
 ↓
DTO
 ↓
API Response
```

Example:

```text
User database object
```

must not accidentally expose:

```text
password_hash
```

---

# 151. DTO Example

Database:

```text
User {
  id
  email
  password_hash
  created_at
}
```

API:

```json
{
  "id": "uuid",
  "email": "muni@example.com",
  "createdAt": "..."
}
```

---

# 152. API Data Transformation

Use explicit mapping:

```text
mapUserToResponse(user)
```

rather than returning raw database objects.

This creates a strong API security boundary.

---

# 153. API Performance Targets

Initial engineering targets:

```text
Simple GET:
< 300 ms application processing

Typical CRUD:
< 500 ms

Dashboard:
< 800 ms

Async operations:
202 quickly returned
```

These are engineering targets rather than hard SLAs.

Real production performance should be measured.

---

# 154. Database Query Rules

Avoid:

```text
N + 1 queries
```

Example bad:

```text
Fetch 100 guests
 ↓
100 event queries
```

Prefer:

```text
Fetch guests
 +
Batch related event data
```

using Prisma relations or optimized queries.

---

# 155. Transaction Rules

Use transactions for:

```text
Create wedding
Create guest + event associations
RSVP update + activity
Check-in + activity
Invitation state + outbox
```

Do not keep transactions open while calling external services.

Bad:

```text
BEGIN
 ↓
Database
 ↓
Resend
 ↓
Cloudinary
 ↓
COMMIT
```

Better:

```text
BEGIN
 ↓
Database changes
 ↓
Outbox
 ↓
COMMIT
 ↓
External services asynchronously
```

---

# 156. External Service Failure

If:

```text
Resend
```

is unavailable:

The API should still be able to commit:

```text
Invitation = QUEUED
```

and let the worker retry.

The same principle applies to other external providers.

---

# 157. Cloudinary Failure

If upload succeeds at Cloudinary but database confirmation fails:

A reconciliation process can detect orphaned media later.

If database creation succeeds but Cloudinary upload fails:

The media record should not be marked as successfully available.

Use explicit media states if required:

```text
UPLOADING
AVAILABLE
FAILED
DELETED
```

---

# 158. API Health Endpoints

Internal health:

```text
GET /health
```

Readiness:

```text
GET /health/ready
```

Possible checks:

```text
PostgreSQL
Redis
```

Do not expose sensitive infrastructure information.

---

# 159. Graceful Degradation

If Redis is temporarily unavailable:

- Core PostgreSQL-backed operations should remain available where safe.
- Caching can fail open.
- Rate limiting may use a safe fallback policy.
- Sessions must have an explicitly designed fallback rather than silently bypassing authentication.

If Resend is unavailable:

- Email jobs remain queued/retryable.

If Cloudinary is unavailable:

- New uploads fail gracefully while existing media remains accessible.

---

# 160. Future Service Extraction

The API starts as a modular monolith.

Potential future services:

```text
Auth Service
Wedding Service
Guest Service
Notification Service
Media Service
Realtime Service
```

The API contracts should remain domain-oriented so these modules can later be extracted.

---

# 161. Internal Module Communication

Initially:

```text
Module → Service → Service
```

Future:

```text
Service → Event Bus → Service
```

The API contract should not depend on the implementation being a monolith.

---

# 162. Complete Endpoint Map

## Authentication

```text
POST /auth/signup
POST /auth/login
POST /auth/logout
GET  /auth/me
POST /auth/verify-email
POST /auth/resend-verification
POST /auth/forgot-password
POST /auth/reset-password
```

## Weddings

```text
GET    /weddings
POST   /weddings
GET    /weddings/:weddingId
PATCH  /weddings/:weddingId
DELETE /weddings/:weddingId
```

## Members

```text
GET    /weddings/:weddingId/members
POST   /weddings/:weddingId/members
PATCH  /weddings/:weddingId/members/:memberId
DELETE /weddings/:weddingId/members/:memberId
```

## Events

```text
GET    /weddings/:weddingId/events
POST   /weddings/:weddingId/events
GET    /weddings/:weddingId/events/:eventId
PATCH  /weddings/:weddingId/events/:eventId
DELETE /weddings/:weddingId/events/:eventId
```

## Venues

```text
GET    /weddings/:weddingId/venues
POST   /weddings/:weddingId/venues
GET    /weddings/:weddingId/venues/:venueId
PATCH  /weddings/:weddingId/venues/:venueId
DELETE /weddings/:weddingId/venues/:venueId
```

## Guests

```text
GET    /weddings/:weddingId/guests
POST   /weddings/:weddingId/guests
GET    /weddings/:weddingId/guests/:guestId
PATCH  /weddings/:weddingId/guests/:guestId
DELETE /weddings/:weddingId/guests/:guestId
```

## Guest Categories

```text
GET    /weddings/:weddingId/guest-categories
POST   /weddings/:weddingId/guest-categories
PATCH  /weddings/:weddingId/guest-categories/:categoryId
DELETE /weddings/:weddingId/guest-categories/:categoryId
```

## Guest Events

```text
POST   /weddings/:weddingId/guests/:guestId/events
DELETE /weddings/:weddingId/guests/:guestId/events/:eventId
```

## Invitations

```text
GET  /weddings/:weddingId/invitations
POST /weddings/:weddingId/invitations
GET  /weddings/:weddingId/invitations/:invitationId

POST /weddings/:weddingId/invitations/:invitationId/send
POST /weddings/:weddingId/invitations/:invitationId/resend
POST /weddings/:weddingId/invitations/:invitationId/revoke
```

## Guest Access

```text
GET  /guest-access/:token
POST /guest-access/:token/verify
POST /guest-access/logout
GET  /guest-access/me
```

## RSVP

```text
GET   /weddings/:weddingId/rsvps
GET   /weddings/:weddingId/rsvps/:rsvpId

GET   /guest/events
POST  /guest/events/:eventId/rsvp
PATCH /guest/events/:eventId/rsvp
```

## Tasks

```text
GET    /weddings/:weddingId/tasks
POST   /weddings/:weddingId/tasks
GET    /weddings/:weddingId/tasks/:taskId
PATCH  /weddings/:weddingId/tasks/:taskId
DELETE /weddings/:weddingId/tasks/:taskId
```

## Media

```text
POST /weddings/:weddingId/media/upload-session
POST /weddings/:weddingId/media
```

## Photos

```text
GET    /weddings/:weddingId/photos
POST   /weddings/:weddingId/photos
GET    /weddings/:weddingId/photos/:photoId
PATCH  /weddings/:weddingId/photos/:photoId
DELETE /weddings/:weddingId/photos/:photoId

POST /weddings/:weddingId/photos/:photoId/approve
POST /weddings/:weddingId/photos/:photoId/reject
```

## Guest Photos

```text
POST /guest/photos/upload-session
POST /guest/photos
```

## Check-In

```text
POST /weddings/:weddingId/events/:eventId/check-ins
GET  /weddings/:weddingId/events/:eventId/check-ins/summary
```

## Live Stream

```text
GET    /weddings/:weddingId/live-streams
POST   /weddings/:weddingId/live-streams
GET    /weddings/:weddingId/live-streams/:streamId
PATCH  /weddings/:weddingId/live-streams/:streamId
DELETE /weddings/:weddingId/live-streams/:streamId

POST /weddings/:weddingId/live-streams/:streamId/start
POST /weddings/:weddingId/live-streams/:streamId/end
```

## Website

```text
GET  /weddings/:weddingId/website
PATCH /weddings/:weddingId/website
POST /weddings/:weddingId/website/publish
POST /weddings/:weddingId/website/unpublish

GET    /weddings/:weddingId/website/sections
POST   /weddings/:weddingId/website/sections
PATCH  /weddings/:weddingId/website/sections/:sectionId
DELETE /weddings/:weddingId/website/sections/:sectionId
POST   /weddings/:weddingId/website/sections/reorder
```

## Public

```text
GET /public/weddings/:slug
```

## Notifications

```text
GET /weddings/:weddingId/notifications
```

## Real-Time

```text
GET /weddings/:weddingId/events/stream
```

---

# 163. Final API Architecture

The complete request path is:

```text
                         HTTPS
                           │
                           ▼
                     ┌───────────┐
                     │ Frontend  │
                     └─────┬─────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   REST /api/v1  │
                  └────────┬────────┘
                           │
                    Middleware Layer
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
       Session          Rate Limit       Validation
          │                │                 │
          └────────────────┼─────────────────┘
                           ▼
                    Authorization
                           │
                           ▼
                      Controller
                           │
                           ▼
                       Service
                           │
              ┌────────────┼─────────────┐
              │            │             │
              ▼            ▼             ▼
         Repository      Redis        Outbox
              │                         │
              ▼                         ▼
         PostgreSQL                   Worker
                                        │
                         ┌──────────────┼──────────────┐
                         ▼              ▼              ▼
                      Resend       Cloudinary      SSE/Event
```

---

# 164. Final API Design Principles

The MakeMyMarriage API follows these principles:

1. **REST-first**
2. **Versioned APIs**
3. **Server-side sessions**
4. **Secure HttpOnly cookies**
5. **Wedding-level tenant isolation**
6. **RBAC**
7. **Account-free guest experience**
8. **Secure invitation credentials**
9. **Explicit DTOs**
10. **Consistent response format**
11. **Standard error codes**
12. **Backend validation**
13. **Database constraints**
14. **Hybrid pagination**
15. **Whitelisted filtering/sorting**
16. **Direct Cloudinary uploads**
17. **Asynchronous email**
18. **Outbox architecture**
19. **Redis-backed rate limiting**
20. **SSE for dashboard updates**
21. **Idempotent critical operations**
22. **OpenAPI documentation**
23. **Strong observability**
24. **Modular monolith**
25. **Future service extraction**

---

# 165. End-to-End Product Flow

The API supports the complete MakeMyMarriage journey:

```text
USER
 │
 ├── Signup
 │
 ├── Login
 │
 ▼
WEDDING
 │
 ├── Setup wedding
 │
 ├── Create events
 │
 ├── Add venues
 │
 ├── Customize website
 │
 └── Invite organizers
 │
 ▼
GUEST MANAGEMENT
 │
 ├── Add guests
 ├── Categorize guests
 ├── Assign events
 └── Generate invitations
 │
 ▼
INVITATION
 │
 ├── Secure link
 ├── Email
 └── Guest access
 │
 ▼
GUEST
 │
 ├── View wedding
 ├── View events
 ├── RSVP
 └── Upload photos
 │
 ▼
WEDDING MANAGEMENT
 │
 ├── Tasks
 ├── RSVP tracking
 ├── Gallery moderation
 ├── Live stream
 └── Dashboard
 │
 ▼
WEDDING DAY
 │
 ├── QR scanning
 ├── Guest check-in
 ├── Live dashboard updates
 └── Live stream
 │
 ▼
POST-WEDDING
 │
 ├── Gallery
 ├── Wedding website
 ├── Guest records
 └── Wedding archive
```

---

# 166. Final Decision

The MakeMyMarriage API should initially be implemented as a **versioned REST API inside a modular monolith**, backed by PostgreSQL and Prisma, with Redis for sessions/rate limiting/caching, Cloudinary for media, Resend for asynchronous email, and SSE for dashboard real-time updates.

The most important security boundary is:

```text
                    USER
                      │
                   SESSION
                      │
                 MEMBERSHIP
                      │
                    ROLE
                      │
                 PERMISSION
                      │
                   WEDDING
                      │
                   RESOURCE
```

For guests:

```text
                INVITATION
                     │
              SECURE CREDENTIAL
                     │
              GUEST SESSION
                     │
                  GUEST
                     │
              AUTHORIZED EVENT
                     │
                  ACTION
```

This gives MakeMyMarriage a relatively simple MVP implementation while preserving the architectural boundaries required for future growth into a large-scale wedding platform.

# End of API Design Document — Version 1.0