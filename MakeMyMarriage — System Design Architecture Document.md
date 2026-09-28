# MakeMyMarriage
## System Design Architecture Document

**Version:** 1.0  
**Product:** MakeMyMarriage  
**Architecture:** Modular Monolith  
**Initial Deployment:** Vercel  
**Primary Database:** PostgreSQL  
**Cache / Auxiliary Store:** Redis  
**Media:** Cloudinary  
**Email:** Resend  
**Realtime:** WebSocket  
**Initial Market:** India  
**Languages:** English, Hindi, Telugu

---

# 1. Architecture Vision

MakeMyMarriage is designed as a **complete digital wedding ecosystem**.

The architecture must support:

- Wedding creation
- Multiple events
- Digital invitations
- Guest management
- RSVP
- Organiser management
- Task planning
- Wedding websites
- Photo galleries
- Guest photo uploads
- QR-based guest entry
- Live-stream integration
- Email notifications
- Realtime wedding-day dashboards

The architecture must also support future growth toward:

- Multiple weddings per user
- Vendor marketplace
- Payments
- AI wedding assistant
- Additional notification channels
- International expansion
- Microservices

The key architectural principle is:

> **Start simple, but don't design ourselves into a corner.**

Therefore, MakeMyMarriage will initially use a **modular monolith**, while maintaining strong domain boundaries.

---

# 2. Architecture Decision Summary

| Area | Decision |
|---|---|
| Architecture | Modular Monolith |
| Frontend | React + TypeScript |
| Backend | API-based backend |
| Database | PostgreSQL |
| Cache | Redis |
| Media | Cloudinary |
| Email | Resend |
| Authentication | Cookie/session-based |
| Guest Authentication | Secure invitation token |
| Realtime | WebSocket |
| Public Website | SEO-friendly rendering |
| QR | Secure token-based QR |
| Queue | Abstract background-job system |
| Deployment | Vercel initially |
| Environments | Development / Staging / Production |
| CI/CD | Manual deployment |
| Vendors | Future |
| Microservices | Future extraction |
| Mobile App | Future |

---

# 3. High-Level Architecture

```text
                           INTERNET
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        Wedding Visitors               Wedding Owners
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      Vercel       │
                    │                   │
                    │ React Frontend    │
                    │ API / Backend     │
                    │ Public Website    │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
        PostgreSQL          Redis          Cloudinary
              │               │                │
              │               │                │
              ▼               ▼                ▼
        Source of Truth   Cache/Jobs       Images/Media

                              │
                              ▼
                          Resend
                              │
                              ▼
                           Email
```

External live streaming:

```text
MakeMyMarriage
       │
       ▼
YouTube Live
```

---

# 4. Why Modular Monolith?

We explicitly decided **not to use microservices initially**.

A wedding platform contains many domains, but they don't necessarily need separate infrastructure from day one.

A modular monolith gives us:

- Simple deployment
- Lower operational complexity
- Easier debugging
- Easier local development
- Lower cost
- Faster development
- Strong module boundaries
- Future microservice extraction

The architecture will look like:

```text
                    MakeMyMarriage Backend

 ┌──────────────────────────────────────────────────┐
 │                                                  │
 │  Auth                                            │
 │  Wedding                                         │
 │  Events                                          │
 │  Guests                                          │
 │  Invitations                                     │
 │  RSVP                                            │
 │  Organisers                                      │
 │  Tasks                                           │
 │  Notifications                                   │
 │  Gallery                                         │
 │  Guest Entry                                     │
 │  Live Stream                                     │
 │  Website                                         │
 │                                                  │
 └──────────────────────────────────────────────────┘
                         │
                         ▼
                    PostgreSQL
```

The modules communicate through clearly defined interfaces.

---

# 5. Module Boundaries

The backend should be divided into domain modules.

```text
src/
│
├── auth/
├── users/
├── weddings/
├── events/
├── guests/
├── invitations/
├── rsvp/
├── organizers/
├── tasks/
├── notifications/
├── gallery/
├── guest_entry/
├── livestream/
├── website/
├── media/
├── realtime/
├── activity/
└── shared/
```

Each module owns its:

- Business logic
- Validation
- Database operations
- API endpoints
- Domain events

---

# 6. Auth Module

Responsibilities:

- Signup
- Login
- Logout
- Password hashing
- Password reset
- Session management
- User identity

Example:

```text
POST /auth/signup
POST /auth/login
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
```

---

# 7. Wedding Module

Responsibilities:

- Create wedding
- Update wedding
- Wedding settings
- Wedding lifecycle
- Wedding owner
- Wedding visibility
- Wedding website configuration

Example:

```text
POST   /weddings
GET    /weddings/:id
PATCH  /weddings/:id
DELETE /weddings/:id
```

---

# 8. Event Module

Responsibilities:

- Create events
- Update events
- Delete events
- Event visibility
- Event schedules
- Venues
- Event-specific configuration

Example:

```text
POST   /weddings/:weddingId/events
GET    /weddings/:weddingId/events
GET    /events/:eventId
PATCH  /events/:eventId
DELETE /events/:eventId
```

---

# 9. Guest Module

Responsibilities:

- Guest CRUD
- Categories
- Bride/groom side
- Guest-event assignment
- Guest search
- Guest status

Example:

```text
POST /weddings/:weddingId/guests
GET  /weddings/:weddingId/guests
GET  /guests/:guestId
PATCH /guests/:guestId
DELETE /guests/:guestId
```

---

# 10. Guest/Event Relationship

A guest may attend multiple events.

Therefore:

```text
Guest
   │
   │ N:M
   │
Event
```

Use an intermediate entity:

```text
GuestEvent
```

Example:

```text
Guest: Rahul

GuestEvent:
    Haldi       → NOT_INVITED
    Sangeet     → INVITED
    Wedding     → INVITED
    Reception   → INVITED
```

This is one of the most important relationships in the system.

---

# 11. Invitation Module

Responsibilities:

- Invitation creation
- Template selection
- Customization
- Invitation generation
- Invitation tokens
- Invitation status
- QR generation

Example:

```text
Invitation
    │
    ├── Guest
    ├── Event
    ├── Template
    └── Secure Access Token
```

---

# 12. Invitation Lifecycle

```text
DRAFT
  │
  ▼
SENT
  │
  ▼
DELIVERED
  │
  ▼
OPENED
  │
  ▼
RSVP_COMPLETED
```

Possible alternative states:

```text
FAILED
REVOKED
EXPIRED
```

---

# 13. Secure Guest Access

Guests don't have accounts.

Instead:

```text
Email
 ↓
Secure Link
 ↓
Guest Invitation
```

Example:

```text
https://makemymarriage.com/invite/8f3a...
```

The token must be:

- Cryptographically random
- High entropy
- Non-sequential
- Revocable
- Optionally expirable

---

# 14. Token Storage

Never store the raw token in the database.

Instead:

```text
Raw Token
   ↓
SHA-256 / secure hashing
   ↓
Database
```

When the guest accesses:

```text
URL token
   ↓
Hash token
   ↓
Database lookup
   ↓
Validate
   ↓
Grant guest access
```

This protects the database if token data is exposed.

---

# 15. Guest Access Scope

A guest token should resolve to:

```text
Guest
   │
   └── Wedding
          │
          └── Authorized Events
```

The guest should never automatically gain access to every wedding resource.

Authorization should verify:

```text
Token
 ↓
Guest
 ↓
Wedding
 ↓
Event
 ↓
Requested Resource
```

---

# 16. RSVP Module

Responsibilities:

- RSVP form
- RSVP state
- Event RSVP
- Number of attendees
- Preferences
- RSVP updates
- RSVP confirmation

Example:

```text
Guest
 ↓
Invitation
 ↓
RSVP
 ↓
GuestEvent
```

---

# 17. RSVP Data Model

Conceptually:

```text
RSVP
├── guest_id
├── event_id
├── status
├── attendee_count
├── food_preference
├── accommodation_required
├── transportation_required
├── responded_at
└── updated_at
```

---

# 18. Organiser Module

Responsibilities:

- Invite organiser
- Organiser authentication
- Assign organiser to wedding
- Organiser access
- Organiser activity

MVP hierarchy:

```text
Wedding Owner
      │
      └── Organiser
```

Advanced RBAC can be introduced later.

---

# 19. Task Module

Responsibilities:

- Create tasks
- Assign tasks
- Event association
- Due dates
- Priority
- Status
- Notes

Example:

```text
Task
 ├── Wedding
 ├── Event
 ├── Assignee
 ├── Due Date
 ├── Priority
 └── Status
```

---

# 20. Notification Module

Notification logic should be independent of email.

Architecture:

```text
Business Event
       ↓
Notification Service
       ↓
Notification Provider
       ↓
Resend
       ↓
Email
```

Future:

```text
Notification Service
       ├── Email
       ├── SMS
       ├── WhatsApp
       └── Push
```

---

# 21. Background Job Architecture

Email sending should not block API requests.

Bad:

```text
POST /send-invitations

API
 ↓
Send 500 emails
 ↓
Response
```

Better:

```text
POST /send-invitations
       │
       ▼
Create Email Jobs
       │
       ▼
Return response
       │
       ▼
Background Worker
       │
       ▼
Resend
```

The queue implementation should remain abstract.

---

# 22. Queue Abstraction

Create an interface:

```text
JobQueue
   │
   ├── enqueue()
   ├── retry()
   ├── schedule()
   └── process()
```

The initial implementation can use a lightweight mechanism suitable for the Vercel environment.

Later:

```text
JobQueue
   ├── Redis Queue
   ├── AWS SQS
   ├── RabbitMQ
   └── Kafka
```

can be introduced without modifying domain modules.

---

# 23. Redis

Redis will not be the source of truth.

PostgreSQL remains authoritative.

Redis can handle:

- Cache
- Rate limiting
- Temporary tokens
- Background-job coordination
- Distributed locks
- Frequently accessed wedding data
- Realtime coordination

Example:

```text
PostgreSQL
     │
     ▼
Redis Cache
     │
     ▼
API
```

---

# 24. Cache Strategy

Potential cache candidates:

```text
Wedding public profile
Wedding website configuration
Event information
Invitation template metadata
Public gallery metadata
```

Avoid caching sensitive guest data unnecessarily.

Cache invalidation should happen when the underlying wedding data changes.

---

# 25. Cache Example

Request:

```text
GET /w/muni-and-priya
```

Flow:

```text
Request
  ↓
Redis?
  │
  ├── HIT → Return cached data
  │
  └── MISS
        ↓
    PostgreSQL
        ↓
    Redis SET
        ↓
    Response
```

---

# 26. PostgreSQL

PostgreSQL is the system's source of truth.

It stores:

- Users
- Weddings
- Events
- Guests
- Invitations
- RSVP
- Tasks
- Organisers
- Photos metadata
- Guest entries
- Notifications
- Activity records

Binary media should not be stored directly in PostgreSQL.

---

# 27. Core Database Model

```text
User
 │
 └── Wedding
      │
      ├── Event
      │    │
      │    ├── GuestEvent
      │    │
      │    ├── RSVP
      │    │
      │    ├── Task
      │    │
      │    └── LiveStream
      │
      ├── Guest
      │
      ├── Invitation
      │
      ├── Organizer
      │
      ├── Task
      │
      ├── Photo
      │
      └── Activity
```

---

# 28. Important Database Tables

## users

```text
id
email
password_hash
name
language
created_at
updated_at
```

## weddings

```text
id
owner_id
title
slug
description
wedding_date
timezone
status
visibility
created_at
updated_at
```

## events

```text
id
wedding_id
name
description
start_at
end_at
timezone
venue_id
status
visibility
created_at
updated_at
```

## guests

```text
id
wedding_id
name
email
category
side
priority
created_at
updated_at
```

## guest_events

```text
id
guest_id
event_id
invitation_status
created_at
```

## invitations

```text
id
guest_id
event_id
template_id
token_hash
status
sent_at
opened_at
created_at
updated_at
```

## rsvps

```text
id
guest_id
event_id
status
attendee_count
food_preference
accommodation_required
transportation_required
responded_at
updated_at
```

## organizers

```text
id
wedding_id
user_id
status
created_at
```

## tasks

```text
id
wedding_id
event_id
title
description
assignee_id
priority
status
due_date
created_at
updated_at
```

## photos

```text
id
wedding_id
event_id
uploaded_by
cloudinary_public_id
url
status
created_at
```

## guest_entries

```text
id
guest_id
event_id
checked_in_at
checked_in_by
```

---

# 29. Database Indexing

Important indexes:

```text
users.email
weddings.owner_id
weddings.slug
events.wedding_id
guests.wedding_id
guests.email
guest_events.guest_id
guest_events.event_id
invitations.token_hash
rsvps.guest_id
rsvps.event_id
tasks.wedding_id
tasks.assignee_id
photos.wedding_id
guest_entries.event_id
```

For public wedding websites:

```text
weddings.slug
```

must be highly optimized.

---

# 30. Database Constraints

Use database constraints where possible.

Examples:

```text
users.email → UNIQUE

weddings.slug → UNIQUE

guest_events
(guest_id, event_id) → UNIQUE

organizers
(wedding_id, user_id) → UNIQUE
```

This prevents duplicate relationships.

---

# 31. Transactions

Transactions are required for multi-step operations.

Example:

```text
Create Guest
+
Assign Guest to Event
+
Create Invitation
```

These should either all succeed or all fail.

```text
BEGIN

Create Guest
Create GuestEvent
Create Invitation

COMMIT
```

If anything fails:

```text
ROLLBACK
```

---

# 32. Cloudinary Architecture

Cloudinary handles:

- Image storage
- Image transformation
- CDN delivery
- Thumbnail generation
- Optimization

Architecture:

```text
Browser
   │
   ▼
Cloudinary Upload
   │
   ▼
Cloudinary
   │
   ├── Original
   ├── Thumbnail
   └── Optimized
```

The application stores metadata:

```text
cloudinary_public_id
secure_url
width
height
format
size
```

---

# 33. Direct Upload Strategy

For scalability, avoid:

```text
Browser
 ↓
Backend
 ↓
Cloudinary
```

for large images.

Prefer:

```text
Browser
 ↓
Backend requests signed upload
 ↓
Browser
 ↓
Cloudinary
```

The backend generates a secure upload signature.

Then:

```text
Browser → Cloudinary
```

directly.

This reduces backend bandwidth usage.

---

# 34. Image Processing

When guest uploads:

```text
Photo
 ↓
Cloudinary
 ↓
Transformations
 ├── Thumbnail
 ├── Medium
 └── Optimized
```

The frontend should use optimized versions.

Never send original 10–20 MB images to every visitor.

---

# 35. Photo Moderation

Flow:

```text
Upload
 ↓
Photo record = PENDING
 ↓
Owner reviews
 ├── Approve
 └── Reject
```

Only approved images appear publicly.

---

# 36. Wedding Website Architecture

Public wedding websites are a major product feature.

Architecture should prioritize:

- SEO
- Fast loading
- Social sharing
- Mobile experience
- CDN caching

Recommended conceptual architecture:

```text
Public URL
     ↓
SEO-friendly page rendering
     ↓
Wedding Data
     ↓
PostgreSQL / Cache
     ↓
HTML
     ↓
Browser
```

The implementation should use an SEO-friendly React framework/rendering strategy rather than relying exclusively on client-side rendering.

---

# 37. Public Website URL

Example:

```text
/w/muni-and-priya
```

The slug should be unique.

Potential future custom domains:

```text
muni-priya.com
```

can be supported later.

---

# 38. Website Data Strategy

Public website should retrieve only public data.

Example:

```text
Wedding
 ├── Public information
 ├── Public Events
 ├── Public Venue
 ├── Public Gallery
 └── Public Live Stream
```

Never send the complete wedding database record to the browser.

---

# 39. Public API

Conceptually:

```text
GET /public/weddings/:slug
```

Response:

```json
{
  "title": "Muni & Priya",
  "date": "...",
  "events": [],
  "venue": {},
  "story": {},
  "gallery": [],
  "liveStream": {}
}
```

Only public fields are returned.

---

# 40. QR Architecture

QR should represent a secure token.

Example:

```text
QR
 ↓
https://makemymarriage.com/checkin/TOKEN
```

The QR does not contain:

```text
guest_id
wedding_id
email
phone
```

---

# 41. QR Check-In Flow

```text
Entry Staff
     │
     ▼
Open Check-in Interface
     │
     ▼
Camera Scanner
     │
     ▼
Scan QR
     │
     ▼
Backend
     │
     ▼
Validate Token
     │
     ├── Invalid → Reject
     │
     └── Valid
          ↓
       Find Guest
          ↓
       Check RSVP
          ↓
       Record Entry
          ↓
       Return Success
```

---

# 42. Duplicate Check-In

If the same QR is scanned twice:

```text
First Scan
 ↓
CHECKED_IN
```

Second scan:

```text
Already Checked In
```

The system should show:

- Guest name
- Event
- Previous check-in time
- Checked-in status

It should not create duplicate entries.

---

# 43. Real-Time Dashboard

Wedding-day dashboard needs real-time updates.

Example:

```text
Guest scans QR
       ↓
Backend
       ↓
GuestEntry created
       ↓
Realtime event
       ↓
WebSocket
       ↓
Dashboard
       ↓
Checked-in count updates
```

No manual refresh.

---

# 44. WebSocket Architecture

Conceptually:

```text
Browser
   │
   │ WebSocket
   ▼
Realtime Layer
   │
   ▼
Application
   │
   ▼
Domain Event
```

Example event:

```text
guest.checked_in
```

Payload:

```json
{
  "event": "guest.checked_in",
  "eventId": "...",
  "guestCount": 251
}
```

Do not send sensitive guest information unnecessarily.

---

# 45. WebSocket Authentication

WebSocket connections must be authenticated.

Possible flow:

```text
Login
 ↓
Authenticated session
 ↓
Open WebSocket
 ↓
Server validates session
 ↓
Subscribe to wedding channel
```

A user must only subscribe to weddings they are authorized to access.

---

# 46. Wedding Realtime Channel

Conceptually:

```text
wedding:{wedding_id}
```

Events:

```text
guest.checked_in
guest.rsvp_updated
task.updated
photo.approved
event.updated
```

---

# 47. Realtime Authorization

Never allow:

```text
Client:
subscribe("wedding:123")
```

without backend verification.

Backend checks:

```text
Authenticated User
        ↓
Wedding Membership
        ↓
Allowed?
```

Only then subscribe.

---

# 48. Activity Module

Important wedding actions should generate activities.

Examples:

```text
Guest RSVP'd
Invitation sent
Task completed
Photo uploaded
Photo approved
Guest checked in
Event updated
```

Activity model:

```text
Activity
├── wedding_id
├── actor_id
├── action
├── entity_type
├── entity_id
├── metadata
└── created_at
```

---

# 49. Live Stream Architecture

MVP keeps this intentionally simple.

Wedding owner enters:

```text
YouTube Live URL
```

Database stores:

```text
LiveStream
├── event_id
├── provider
├── stream_url
├── visibility
└── status
```

Frontend renders the stream.

No video processing infrastructure is built by MakeMyMarriage.

---

# 50. YouTube Integration

Initial implementation:

```text
Owner
 ↓
Paste YouTube Live URL
 ↓
Save
 ↓
Website displays stream
```

Future:

```text
YouTube API
 ↓
Live status
 ↓
Thumbnail
 ↓
Title
 ↓
Stream metadata
```

---

# 51. Authentication Architecture

We selected **session/cookie-based authentication**.

Flow:

```text
Login
 ↓
Validate credentials
 ↓
Create server-side session
 ↓
Set secure HTTP-only cookie
```

Cookie should use:

```text
HttpOnly
Secure
SameSite
```

where appropriate.

---

# 52. Why Session Authentication?

For this web-first product:

- Better browser security model
- HTTP-only cookies prevent JavaScript access
- Easy logout/revocation
- No long-lived JWT stored in localStorage
- Works naturally with server-rendered pages

The architecture should still allow future API clients/mobile apps to use an appropriate token mechanism.

---

# 53. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Example:

```text
User A
 ↓
Wedding 123
 ↓
Owner
 ↓
Full Access
```

Guest:

```text
Guest Token
 ↓
Wedding 123
 ↓
Guest Event Access
 ↓
Limited Access
```

---

# 54. Authorization Rules

Examples:

### Owner

Can:

- Update wedding
- Manage events
- Manage guests
- Manage organisers
- Manage invitations
- Manage tasks
- Manage gallery
- Manage entry

### Organiser

Can:

- Access assigned wedding
- Manage permitted tasks
- Assist with guest entry
- Upload photos

### Guest

Can:

- View invitation
- RSVP
- View authorized events
- Upload photos
- Access permitted live stream

---

# 55. API Architecture

Use RESTful APIs initially.

Example:

```text
/api/v1/auth
/api/v1/weddings
/api/v1/events
/api/v1/guests
/api/v1/invitations
/api/v1/rsvps
/api/v1/tasks
/api/v1/gallery
/api/v1/entries
```

Versioning:

```text
/api/v1/
```

allows future:

```text
/api/v2/
```

---

# 56. API Response Format

Use consistent responses.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "GUEST_NOT_FOUND",
    "message": "Guest not found"
  }
}
```

---

# 57. API Error Codes

Examples:

```text
AUTH_INVALID_CREDENTIALS
AUTH_UNAUTHORIZED
WEDDING_NOT_FOUND
EVENT_NOT_FOUND
GUEST_NOT_FOUND
INVITATION_EXPIRED
INVITATION_REVOKED
RSVP_ALREADY_SUBMITTED
QR_INVALID
GUEST_ALREADY_CHECKED_IN
```

Frontend should use error codes rather than parsing human-readable messages.

---

# 58. Validation

Validation should happen at multiple layers.

```text
Frontend Validation
        ↓
API Validation
        ↓
Domain Validation
        ↓
Database Constraints
```

Never rely only on frontend validation.

---

# 59. Rate Limiting

Rate limiting should protect:

- Login
- Signup
- Password reset
- Invitation access
- RSVP
- QR check-in
- Photo upload initiation
- Public APIs

Redis can be used for distributed rate limiting.

Example:

```text
IP
 ↓
Redis counter
 ↓
Threshold
 ↓
Allow / Reject
```

---

# 60. Security Threats

Important threats:

### Brute force

Protect authentication endpoints.

### Token guessing

Use high-entropy random tokens.

### IDOR

Always verify resource ownership.

### Malicious uploads

Validate and process files safely.

### XSS

Sanitize user-generated wedding content.

### CSRF

Use secure cookie and CSRF protections where required.

### Spam

Rate-limit invitations and public endpoints.

### Enumeration

Avoid revealing whether arbitrary guest/email records exist.

---

# 61. Wedding Website Security

Public website endpoints must never expose:

- Guest lists
- Guest emails
- RSVP details
- Organiser information
- Internal IDs where unnecessary
- Private gallery images
- Invitation tokens

---

# 62. Invitation Security

A guest invitation URL is effectively a credential.

Therefore:

- Don't log raw tokens
- Don't expose tokens in API responses unnecessarily
- Hash stored tokens
- Support revocation
- Use HTTPS
- Rate-limit access
- Don't use predictable tokens

---

# 63. Email Security

Emails should not contain unnecessary sensitive information.

Invitation:

```text
Open Your Invitation
```

rather than:

```text
Your guest database details...
```

---

# 64. Email Architecture with Resend

```text
Application
    │
    ▼
Notification Service
    │
    ▼
Email Job
    │
    ▼
Resend
    │
    ▼
Guest Inbox
```

Templates should be managed separately from business logic.

---

# 65. Email Template Architecture

Example:

```text
emails/
├── invitation
├── rsvp_confirmation
├── rsvp_reminder
├── organizer_invitation
├── task_assignment
└── event_reminder
```

Each template should support:

```text
English
Hindi
Telugu
```

---

# 66. Development / Staging / Production

Three environments:

```text
Development
     ↓
Staging
     ↓
Production
```

Each should have separate:

- Database
- Redis configuration
- Cloudinary configuration
- Resend configuration
- Secrets
- Environment variables

---

# 67. Environment Variables

Example:

```text
DATABASE_URL
REDIS_URL

SESSION_SECRET

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

RESEND_API_KEY
RESEND_FROM_EMAIL

APP_URL
API_URL
ENVIRONMENT
```

Secrets must never be committed to Git.

---

# 68. Vercel Deployment

Initial deployment:

```text
Developer
    │
    ▼
Git Repository
    │
    ▼
Vercel
    │
    ├── Frontend
    └── Backend/API
```

Manual deployment is acceptable for MVP.

No CI/CD pipeline is required initially.

---

# 69. Important Vercel Consideration

Vercel is excellent for the initial web deployment, but some backend workloads are not naturally suited to short-lived/serverless execution.

Potential future challenges:

- Long-running workers
- Heavy image processing
- Persistent WebSocket workloads
- Large background queues

Therefore:

> The application should not tightly couple domain logic to Vercel-specific APIs.

Keep infrastructure adapters replaceable.

---

# 70. Future Runtime Migration

If scale grows significantly:

```text
Current

Vercel
  │
  └── Application
```

can evolve into:

```text
CDN
 │
 ├── Frontend
 │
 └── Load Balancer
        │
        ▼
     Backend
        │
 ┌──────┼──────────┐
 ▼      ▼          ▼
Postgres Redis   Workers
```

Eventually:

```text
Wedding Service
Guest Service
Invitation Service
Notification Service
Media Service
Realtime Service
```

can be extracted.

---

# 71. Microservice Extraction Strategy

Do not extract services based only on module names.

Extract when there is a genuine reason.

Potential candidates:

### Notification Service

High-volume email processing.

### Media Service

Image processing and storage.

### Realtime Service

Large-scale WebSocket infrastructure.

### Invitation Service

High-volume invitation generation/delivery.

### Guest Service

Potentially large guest operations.

---

# 72. Domain Event Architecture

Even inside the monolith, use domain events conceptually.

Example:

```text
Guest Checked In
       ↓
Domain Event
       ├── Update Dashboard
       ├── Activity Log
       └── Realtime Broadcast
```

Another:

```text
RSVP Submitted
       ↓
Domain Event
       ├── Update Statistics
       ├── Activity Log
       └── Send Confirmation
```

This reduces coupling between modules.

---

# 73. Example RSVP Flow

```text
Guest
 │
 ▼
Secure Invitation
 │
 ▼
RSVP Form
 │
 ▼
POST /rsvps
 │
 ▼
RSVP Module
 │
 ├── Validate guest
 ├── Validate event
 ├── Save RSVP
 └── Create domain event
          │
          ├── Activity
          ├── Notification
          └── Realtime update
```

---

# 74. Example Invitation Flow

```text
Owner
 │
 ▼
Select Guests
 │
 ▼
Create Invitations
 │
 ▼
Generate Secure Tokens
 │
 ▼
Store Token Hash
 │
 ▼
Create Email Jobs
 │
 ▼
Background Processing
 │
 ▼
Resend
 │
 ▼
Guest Email
```

---

# 75. Example Photo Flow

```text
Guest
 │
 ▼
Secure Guest Link
 │
 ▼
Request Upload Signature
 │
 ▼
Backend validates access
 │
 ▼
Cloudinary Signature
 │
 ▼
Direct Upload
 │
 ▼
Cloudinary
 │
 ▼
Backend receives metadata
 │
 ▼
Photo = PENDING
 │
 ▼
Owner Approval
 │
 ▼
Photo = APPROVED
 │
 ▼
Public Gallery
```

---

# 76. Example Guest Check-In Flow

```text
Guest
 │
 ▼
QR
 │
 ▼
Scanner
 │
 ▼
POST /entries/check-in
 │
 ▼
Validate Token
 │
 ▼
Validate Event
 │
 ▼
Check Existing Entry
 │
 ├── Already checked in
 │
 └── Not checked in
        │
        ▼
     Create Entry
        │
        ▼
     Domain Event
        │
        ├── Dashboard
        ├── Activity
        └── WebSocket
```

---

# 77. Wedding Website Request Flow

```text
Browser
   │
   ▼
/w/muni-and-priya
   │
   ▼
Rendering Layer
   │
   ▼
Cache
   │
   ├── HIT → Render
   │
   └── MISS
        │
        ▼
     PostgreSQL
        │
        ▼
      Cache
        │
        ▼
      Render
```

---

# 78. Guest Search Flow

For MVP:

```text
Search
 ↓
PostgreSQL
 ↓
Indexed columns
 ↓
Results
```

No Elasticsearch/OpenSearch initially.

Future:

```text
PostgreSQL
      ↓
Search Infrastructure
      ↓
OpenSearch / Elasticsearch
```

only if needed.

---

# 79. Scalability Strategy

Scale horizontally where possible.

Application:

```text
Instance 1
Instance 2
Instance 3
```

All instances should share:

```text
PostgreSQL
Redis
Cloudinary
```

No important application state should live only in memory.

---

# 80. Stateless Application Principle

Backend instances should be stateless.

Avoid:

```text
Instance memory
 ↓
Critical application state
```

Instead:

```text
PostgreSQL
Redis
Cloudinary
```

hold shared state.

This makes horizontal scaling possible.

---

# 81. Large Wedding Consideration

Suppose:

```text
Wedding
 ├── 10,000 guests
 ├── 50,000 photos
 ├── 20 events
 └── thousands of RSVP operations
```

The architecture should still work.

Important strategies:

- Pagination
- Database indexing
- Lazy loading
- CDN
- Object storage
- Async processing
- Caching
- Rate limiting
- Background jobs
- Bulk operations

---

# 82. Pagination

Never return thousands of guests at once.

Bad:

```text
GET /guests
```

returns:

```text
20,000 guests
```

Better:

```text
GET /guests?page=1&limit=50
```

or cursor-based pagination for large datasets.

---

# 83. Bulk Guest Import

A useful future feature is CSV guest import.

Architecture:

```text
CSV
 ↓
Upload
 ↓
Validate
 ↓
Background Processing
 ↓
Create Guests
 ↓
Create GuestEvent relationships
```

This should be considered when implementing the Guest module even if not included in the first UI.

---

# 84. Database Transaction Boundaries

Each business operation should define its transaction boundary.

Example:

```text
Create Invitation
 ├── Invitation record
 ├── Token
 └── Email Job
```

Database state must be consistent before a job is published.

For higher reliability later, an **outbox pattern** can be introduced.

---

# 85. Future Outbox Pattern

Eventually:

```text
Business Transaction
        │
        ├── Database changes
        │
        └── Outbox Event
                │
                ▼
          Event Processor
                │
                ▼
        Email / WebSocket / etc.
```

This prevents lost events.

Not required for MVP, but the architecture should leave room for it.

---

# 86. Observability

Heavy observability infrastructure is not required for MVP.

However, the application should produce structured logs.

Example:

```json
{
  "timestamp": "...",
  "level": "INFO",
  "action": "guest.checked_in",
  "weddingId": "...",
  "eventId": "...",
  "requestId": "..."
}
```

This makes future monitoring easier.

---

# 87. Request IDs

Every API request should have a request ID.

```text
Client
 ↓
request-id
 ↓
API
 ↓
Logs
```

If something fails:

```text
Request ID: abc-123
```

can be used to trace the request.

---

# 88. Health Checks

Backend should provide:

```text
GET /health
```

and potentially:

```text
GET /health/ready
```

Health checks can verify:

- Application
- Database
- Redis

---

# 89. Disaster Recovery Considerations

You explicitly chose not to make a heavy DR implementation part of MVP.

Nevertheless:

> Wedding data and photos are valuable user data.

Therefore, the architecture should keep recovery options open.

PostgreSQL:

- Automated backups later
- Point-in-time recovery later

Cloudinary:

- Media stored independently from application database

Database should store Cloudinary identifiers rather than assuming the application server owns media.

---

# 90. Data Deletion

Users should eventually be able to delete wedding data.

Deletion needs to consider:

```text
Wedding
 ├── Events
 ├── Guests
 ├── Invitations
 ├── RSVP
 ├── Tasks
 ├── Photos
 └── Activities
```

Media deletion from Cloudinary should happen separately from database deletion.

For large deletions, use asynchronous processing.

---

# 91. Auditability

Sensitive actions should be recorded.

Examples:

```text
Invitation revoked
Guest deleted
Photo rejected
Photo approved
Wedding settings changed
Organiser removed
Guest checked in
```

This creates an audit trail.

---

# 92. API Security Boundary

Frontend should never directly access:

- PostgreSQL
- Redis
- Cloudinary API secret
- Resend API key

Only the backend/server environment can access secrets.

Cloudinary browser uploads should use signed uploads generated by the backend.

---

# 93. Frontend Architecture

Recommended structure:

```text
src/
│
├── app/
├── routes/
├── components/
├── features/
│   ├── auth/
│   ├── wedding/
│   ├── events/
│   ├── guests/
│   ├── invitations/
│   ├── rsvp/
│   ├── tasks/
│   ├── gallery/
│   └── checkin/
│
├── services/
├── hooks/
├── i18n/
├── utils/
└── types/
```

Frontend should also follow domain boundaries.

---

# 94. Frontend State Management

Not everything should go into global state.

Use:

### Server state

For:

- Weddings
- Guests
- Events
- RSVP
- Tasks

Use a server-state library such as TanStack Query.

### Local state

For:

- Modal open/close
- Form fields
- UI preferences

### Realtime state

WebSocket events should invalidate/update relevant cached queries.

---

# 95. Realtime + Server State

Example:

```text
Guest checked in
       ↓
WebSocket
       ↓
Frontend receives event
       ↓
Invalidate guest-entry query
       ↓
Fetch latest statistics
       ↓
Dashboard updates
```

This prevents the WebSocket payload from becoming the application's source of truth.

---

# 96. Error Handling

Every module should have consistent error handling.

Frontend:

```text
API Error
 ↓
Error Boundary / Query Error
 ↓
User-friendly message
```

Backend:

```text
Domain Error
 ↓
API Error Mapper
 ↓
HTTP Response
```

---

# 97. Testing Architecture

Testing layers:

```text
Unit Tests
     ↓
Integration Tests
     ↓
API Tests
     ↓
End-to-End Tests
```

Important test areas:

- Authentication
- Authorization
- Invitation token security
- RSVP
- Guest-event relationships
- QR check-in
- Duplicate check-in
- Photo permissions
- Wedding website visibility
- Organiser permissions

---

# 98. Critical Security Tests

Test cases:

```text
Guest A cannot access Guest B's invitation.

Wedding A owner cannot access Wedding B.

Organiser cannot perform owner-only actions.

Revoked invitation cannot be used.

Expired token cannot be used.

Duplicate QR scan doesn't create duplicate entry.

Public website doesn't expose private guest data.
```

These are more important than merely testing CRUD operations.

---

# 99. Performance Targets

Initial targets:

### Public Wedding Website

Aim for:

- Fast first render
- Optimized images
- CDN delivery
- Minimal JavaScript

### API

Common API operations should ideally respond within a few hundred milliseconds under normal load.

### QR Check-In

The check-in workflow should feel nearly instantaneous.

Target:

```text
Scan
 ↓
Verification
 ↓
Success
```

within approximately 1–2 seconds under normal conditions.

---

# 100. Cost Philosophy

The initial architecture should minimize mandatory paid infrastructure.

Development stack:

```text
Frontend
   ↓
Vercel

Database
   ↓
Free/low-cost PostgreSQL provider

Cache
   ↓
Free/low-cost Redis provider

Images
   ↓
Cloudinary Free

Email
   ↓
Resend Free

Live Stream
   ↓
YouTube
```

Actual provider limits should be checked before production launch because free-tier limits and pricing can change.

---

# 101. Technology Abstraction

Third-party services should be accessed through adapters.

Example:

```text
MediaService
     │
     └── CloudinaryAdapter
```

Later:

```text
MediaService
     ├── CloudinaryAdapter
     ├── S3Adapter
     └── R2Adapter
```

Similarly:

```text
EmailService
     ├── ResendAdapter
     ├── SESAdapter
     └── SendGridAdapter
```

This avoids vendor lock-in.

---

# 102. Infrastructure Abstraction

Same principle for:

```text
CacheService
QueueService
MediaService
EmailService
RealtimeService
```

The business modules should depend on interfaces, not providers.

Example:

```text
Invitation Module
       │
       ▼
EmailService
       │
       ▼
ResendAdapter
```

not:

```text
Invitation Module
       │
       ▼
Resend SDK everywhere
```

---

# 103. Architecture Dependency Direction

Recommended:

```text
                    API Layer
                       │
                       ▼
                Application Layer
                       │
                       ▼
                  Domain Layer
                       │
                       ▼
              Infrastructure Layer
```

Infrastructure should not control business logic.

---

# 104. Domain Layer Example

Instead of:

```text
Controller
 ↓
Database
```

prefer:

```text
Controller
 ↓
Use Case
 ↓
Domain Logic
 ↓
Repository
 ↓
Database
```

Example:

```text
CheckInGuestUseCase
        ↓
Validate Guest
        ↓
Validate Event
        ↓
Validate RSVP
        ↓
Check Existing Entry
        ↓
Create Entry
        ↓
Publish Event
```

---

# 105. Future Vendor Marketplace

Not part of MVP.

But architecture can eventually become:

```text
MakeMyMarriage
│
├── Wedding
├── Guests
├── Invitations
├── Planning
│
└── Marketplace
      ├── Vendors
      ├── Services
      ├── Bookings
      ├── Payments
      └── Reviews
```

This should remain isolated from the wedding core.

---

# 106. Future Payment Architecture

If monetization is introduced:

```text
Frontend
 ↓
Payment Service
 ↓
Payment Provider
 ↓
Webhook
 ↓
Payment Service
 ↓
Order/Subscription
```

Payment status should always be confirmed by backend/webhook rather than trusting the browser.

---

# 107. Future AI Architecture

AI should eventually be a separate application module.

```text
Wedding Data
     ↓
AI Assistant
     ↓
LLM
     ↓
Recommendations
```

Potential capabilities:

- Planning
- Invitation generation
- Task generation
- Timeline generation
- Guest insights

AI should not directly modify important wedding data without explicit user confirmation.

---

# 108. International Expansion

Current:

```text
India
English
Hindi
Telugu
```

Future:

```text
Country
Locale
Timezone
Currency
Language
Date Format
Address Format
```

The architecture should avoid assumptions such as:

```text
DD-MM-YYYY
₹
+91
```

being globally universal.

---

# 109. Multi-Wedding Future

Current:

```text
User
 ↓
Wedding
```

Future:

```text
User
 ├── Wedding 1
 ├── Wedding 2
 └── Wedding 3
```

Therefore every business query should be scoped by:

```text
wedding_id
```

rather than relying on user identity alone.

---

# 110. Failure Scenarios

## Resend unavailable

```text
Invitation created
 ↓
Email job
 ↓
Resend failure
 ↓
Retry
 ↓
Mark failed after retry limit
```

Invitation itself should remain valid.

---

## Cloudinary unavailable

```text
Upload fails
 ↓
Photo remains incomplete/pending
 ↓
Retry upload
```

Wedding management should continue functioning.

---

## Redis unavailable

Application should degrade gracefully where possible.

PostgreSQL remains source of truth.

---

## WebSocket unavailable

The dashboard should still function using normal HTTP requests.

Realtime is an enhancement, not the source of truth.

---

## YouTube unavailable

Wedding website should continue functioning.

Live-stream section can display unavailable status.

---

# 111. Graceful Degradation Principle

External dependencies should not bring down the entire platform.

For example:

```text
Resend ❌
    ↓
Wedding still works

Cloudinary ❌
    ↓
Wedding management still works

WebSocket ❌
    ↓
Dashboard can refresh normally

YouTube ❌
    ↓
Wedding website still works
```

This is a major architectural principle.

---

# 112. System-Level Data Flow

Complete wedding lifecycle:

```text
                    ┌───────────────┐
                    │ Wedding Owner │
                    └───────┬───────┘
                            │
                            ▼
                     Create Wedding
                            │
                            ▼
                     Create Events
                            │
                            ▼
                      Add Guests
                            │
                            ▼
                  Create Invitations
                            │
                            ▼
                     Email Guests
                            │
                            ▼
                    Guest Opens Link
                            │
                            ▼
                         RSVP
                            │
                            ▼
                  Owner Dashboard
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
           Tasks          Gallery       Organisers
              │             │              │
              └─────────────┼──────────────┘
                            ▼
                       Wedding Day
                            │
                 ┌──────────┼──────────┐
                 ▼          ▼          ▼
              QR Entry   Live Stream  Photos
                 │          │          │
                 └──────────┼──────────┘
                            ▼
                    Wedding Experience
```

---

# 113. Complete Architecture

```text
                         INTERNET
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       Wedding Owner                     Guest
              │                             │
              └──────────────┬──────────────┘
                             ▼
                       ┌───────────┐
                       │  Vercel   │
                       │           │
                       │ Frontend  │
                       │ API       │
                       │ Website   │
                       └─────┬─────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
        PostgreSQL         Redis          Cloudinary
             │               │                │
             │               │                │
             └───────────────┼────────────────┘
                             │
                 ┌───────────┴────────────┐
                 │                        │
                 ▼                        ▼
             Resend                  WebSocket
                 │                        │
                 ▼                        ▼
              Email                   Dashboard
                                          │
                                          ▼
                                    Live Updates

                         External
                            │
                            ▼
                       YouTube Live
```

---

# 114. Final Architecture Principles

MakeMyMarriage should follow these principles:

### 1. Modular Monolith First

Don't introduce microservices before they are necessary.

### 2. PostgreSQL Is the Source of Truth

Redis and external services are supporting infrastructure.

### 3. Guests Don't Need Accounts

Secure invitation access provides frictionless guest experience.

### 4. Security by Design

Invitation tokens and QR codes are credentials and must be treated accordingly.

### 5. Async for Expensive Work

Email, image processing and large operations should not block user requests.

### 6. Public vs Private Data Must Be Explicit

Never accidentally expose guest information through public wedding APIs.

### 7. Realtime Is an Enhancement

WebSocket improves the wedding-day dashboard but must never become the source of truth.

### 8. External Providers Are Replaceable

Cloudinary, Resend, Redis, and future providers should be accessed through abstractions.

### 9. Vercel First, Portable Architecture

Use Vercel for simplicity now without coupling the entire system to it.

### 10. Scale Horizontally

Avoid application-instance state.

### 11. Design Around Wedding and Event

The fundamental domain model remains:

```text
Wedding
   ↓
Events
   ↓
Guests
   ↓
Invitations
   ↓
RSVP
   ↓
Wedding Experience
```

---

# 115. Final Architecture Summary

The initial MakeMyMarriage architecture is:

```text
                    MAKE MY MARRIAGE
                           │
                           ▼
                   MODULAR MONOLITH
                           │
        ┌──────────────────┼───────────────────┐
        │                  │                   │
        ▼                  ▼                   ▼
     Frontend             API               Website
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
 PostgreSQL              Redis             Cloudinary
       │                   │                    │
       │                   │                    │
       └───────────────────┼────────────────────┘
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
               Resend           WebSocket
                  │                 │
                  ▼                 ▼
                Email          Live Dashboard

                           +
                           │
                           ▼
                      YouTube Live
```

The architecture deliberately gives us:

**Simple MVP → Strong domain boundaries → Low initial infrastructure complexity → Scalable future → Microservice extraction when justified.**

---

# 116. Recommended Build Order After SDA

The logical implementation sequence is:

```text
1. Project Foundation
        ↓
2. Authentication
        ↓
3. Wedding
        ↓
4. Events
        ↓
5. Guests
        ↓
6. Invitations
        ↓
7. RSVP
        ↓
8. Wedding Website
        ↓
9. Organisers
        ↓
10. Tasks
        ↓
11. Email/Notifications
        ↓
12. Cloudinary Gallery
        ↓
13. QR Check-in
        ↓
14. WebSocket Dashboard
        ↓
15. YouTube Live
        ↓
16. Security Hardening
        ↓
17. Testing
        ↓
18. Staging
        ↓
19. Production
```

This sequence allows us to build the **core wedding domain first**, then progressively add the wedding-day experience.

---

# 117. Architectural End State

The long-term evolution can look like:

```text
                    MAKE MY MARRIAGE
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
          Wedding       Guest        Planning
          Platform      Platform      Platform
              │            │            │
              └────────────┼────────────┘
                           │
                    Experience Layer
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          Website        Gallery      Live Stream
             │             │             │
             └─────────────┼─────────────┘
                           │
                     Future Ecosystem
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
       Vendors           Payments           AI
       Marketplace       Platform          Assistant
```

The initial architecture therefore isn't just designed to **launch MakeMyMarriage**.

It is designed so that the product can evolve from a wedding-management SaaS into a **complete digital wedding ecosystem without requiring a fundamental rewrite of the core domain model**.

---

## End of System Design Architecture Document — Version 1.0