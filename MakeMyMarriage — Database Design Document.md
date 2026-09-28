# MakeMyMarriage
## Database Design Document

**Version:** 1.0  
**Database:** PostgreSQL  
**Architecture:** Modular Monolith  
**Primary Tenant Boundary:** Wedding  
**Primary Key Strategy:** UUIDv7  
**ORM:** Prisma ORM  
**Cache:** Redis  
**Media Metadata:** PostgreSQL  
**Media Storage:** Cloudinary  
**Initial Market:** India  
**Supported Languages:** English, Hindi, Telugu

---

# 1. Purpose

This document defines the database architecture for MakeMyMarriage.

It translates the System Design Architecture into an implementation-ready PostgreSQL model covering:

- Users
- Weddings
- Wedding memberships
- Roles
- Events
- Venues
- Guests
- Guest-event relationships
- Invitations
- RSVP
- Tasks
- Photos
- QR check-ins
- Notifications
- Activities
- Wedding websites
- Website customization
- Live streams
- Media
- Audit-related information
- Soft deletion
- Indexing
- Constraints
- Transactions
- Multi-tenancy
- Future scalability

The database should support the current MVP while avoiding architectural decisions that would make future expansion difficult.

---

# 2. Database Philosophy

The database follows five major principles.

## Principle 1 — PostgreSQL is the source of truth

Redis is not authoritative.

Cloudinary is not authoritative for business metadata.

The database remains the source of truth for application state.

---

## Principle 2 — Wedding is the tenant boundary

Most business data belongs to a wedding.

Conceptually:

```text
User
  │
  └── Wedding
        │
        ├── Events
        ├── Guests
        ├── Invitations
        ├── RSVPs
        ├── Tasks
        ├── Photos
        ├── Check-ins
        └── Website
```

This is important for:

- Authorization
- Data isolation
- Future multi-wedding support
- Query performance
- Future tenant-level scaling

---

## Principle 3 — Relational core + JSONB flexibility

Use normal relational tables for important relationships.

Use JSONB where the data is naturally flexible.

For example:

```text
Wedding
   ├── owner_id        → relational
   ├── wedding_date    → relational
   ├── timezone        → relational
   └── settings        → JSONB
```

Do not turn the entire database into JSON.

---

## Principle 4 — UUIDv7 identifiers

Primary keys will use UUIDv7.

Example:

```text
0198c3f0-7c1a-7abc-9a3e-...
```

Benefits:

- Globally unique
- Suitable for distributed systems
- Better index locality than purely random UUIDs
- Useful if modules become services later
- Avoids exposing sequential record counts

---

## Principle 5 — Soft deletion where business recovery matters

Not every table needs `deleted_at`.

Soft deletion is appropriate for important user-managed entities such as:

- Weddings
- Events
- Guests
- Tasks
- Photos
- Venues

Ephemeral/operational records don't necessarily need it.

---

# 3. High-Level Entity Model

```text
                         ┌──────────────┐
                         │    USERS     │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
              OWNERSHIP                MEMBERSHIP
                    │                       │
                    └───────────┬───────────┘
                                ▼
                         ┌──────────────┐
                         │   WEDDINGS   │
                         └──────┬───────┘
                                │
          ┌─────────────┬───────┼──────────┬─────────────┐
          │             │       │          │             │
          ▼             ▼       ▼          ▼             ▼
       EVENTS        GUESTS   TASKS      PHOTOS       WEBSITE
          │             │
          │             │
          └──────┬──────┘
                 ▼
           GUEST_EVENTS
                 │
        ┌────────┴────────┐
        ▼                 ▼
   INVITATIONS          RSVPS
        │
        ▼
 INVITATION_ACCESS

EVENTS
  │
  ├── VENUE
  ├── LIVE_STREAM
  └── GUEST_EVENTS
           │
           ▼
      GUEST_ENTRIES

WEDDING
  │
  ├── NOTIFICATIONS
  ├── ACTIVITIES
  └── MEDIA
```

---

# 4. Complete Table Inventory

The initial database contains these major tables:

```text
users
weddings
wedding_members
roles

events
venues

guests
guest_events

invitations
invitation_access

rsvps

tasks

photos
media_assets

guest_entries

live_streams

wedding_websites
website_sections

notifications

activities
```

Some implementation details can be consolidated depending on the ORM implementation, but the logical boundaries should remain.

---

# 5. users

Stores authenticated application users.

## Columns

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| email | CITEXT | NOT NULL |
| password_hash | TEXT | NOT NULL |
| name | VARCHAR(150) | NOT NULL |
| preferred_language | VARCHAR(10) | NOT NULL |
| email_verified_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL |

---

## Notes

Use PostgreSQL `citext` or an equivalent case-insensitive uniqueness strategy for email.

Therefore:

```text
Muni@Example.com
muni@example.com
MUNI@example.com
```

should be treated as the same account email.

---

# 6. User Email Constraint

```text
UNIQUE(email)
```

A user account represents an authenticated identity.

Guests are different from users.

A guest does **not** need a row in `users`.

---

# 7. weddings

The central tenant entity.

## Columns

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| owner_id | UUID | FK → users.id |
| name | VARCHAR(200) | NOT NULL |
| slug | VARCHAR(200) | UNIQUE |
| description | TEXT | NULL |
| wedding_date | DATE | NULL |
| timezone | VARCHAR(100) | NOT NULL |
| country_code | CHAR(2) | NOT NULL |
| default_language | VARCHAR(10) | NOT NULL |
| status | ENUM | NOT NULL |
| visibility | ENUM | NOT NULL |
| settings | JSONB | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL |

---

# 8. Wedding Status

```text
DRAFT
ACTIVE
COMPLETED
ARCHIVED
DELETED
```

Possible lifecycle:

```text
DRAFT
  ↓
ACTIVE
  ↓
COMPLETED
  ↓
ARCHIVED
```

---

# 9. Wedding Visibility

```text
PRIVATE
PUBLIC
```

The wedding can be private while still allowing invitation-based guest access.

---

# 10. Wedding Settings JSONB

Example:

```json
{
  "dateFormat": "DD/MM/YYYY",
  "showCountdown": true,
  "allowGuestPhotoUploads": true,
  "requirePhotoApproval": true,
  "allowGuestMessages": false,
  "showVenueMap": true
}
```

Only genuinely flexible settings should live here.

Core business data remains relational.

---

# 11. Wedding Membership

A user may eventually participate in multiple weddings.

Therefore we should not model access exclusively through:

```text
weddings.owner_id
```

We also create:

```text
wedding_members
```

This makes the architecture future-ready.

---

# 12. wedding_members

## Columns

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| wedding_id | UUID | FK |
| user_id | UUID | FK |
| role_id | UUID | FK |
| status | ENUM | NOT NULL |
| invited_at | TIMESTAMPTZ | NULL |
| joined_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

---

# 13. Membership Status

```text
INVITED
ACTIVE
SUSPENDED
REMOVED
```

---

# 14. Membership Constraint

```text
UNIQUE(wedding_id, user_id)
```

A user should have only one membership record for a particular wedding.

---

# 15. roles

Future-ready RBAC.

## Columns

| Column | Type |
|---|---|
| id | UUID |
| name | VARCHAR |
| description | TEXT |
| permissions | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Initial roles:

```text
OWNER
ORGANIZER
```

Future:

```text
EVENT_MANAGER
RECEPTION_STAFF
PHOTOGRAPHER
```

---

# 16. Why Roles Are Separate

Avoid hardcoding:

```text
if user.role == "organizer"
```

throughout the application.

Instead:

```text
User
 ↓
WeddingMembership
 ↓
Role
 ↓
Permissions
```

This allows future RBAC expansion.

---

# 17. events

Represents individual wedding events.

Examples:

```text
Haldi
Mehendi
Sangeet
Wedding Ceremony
Reception
```

## Columns

| Column | Type |
|---|---|
| id | UUID PK |
| wedding_id | UUID FK |
| venue_id | UUID FK NULL |
| name | VARCHAR(200) |
| description | TEXT |
| start_at | TIMESTAMPTZ |
| end_at | TIMESTAMPTZ |
| timezone | VARCHAR(100) |
| status | ENUM |
| visibility | ENUM |
| settings | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ |

---

# 18. Event Status

```text
DRAFT
SCHEDULED
LIVE
COMPLETED
CANCELLED
```

---

# 19. Event Visibility

```text
PUBLIC
INVITED_GUESTS_ONLY
PRIVATE
```

This is independent of the wedding's overall visibility.

---

# 20. Event Settings

Example:

```json
{
  "showOnWebsite": true,
  "allowRsvp": true,
  "allowGuestPhotos": true,
  "showMap": true,
  "showCountdown": true
}
```

---

# 21. Event Timezone

Events store a timezone even though timestamps are stored in UTC.

Example:

```text
start_at = 2027-02-14T10:30:00Z
timezone = Asia/Kolkata
```

This allows correct display and future internationalization.

---

# 22. venues

Reusable venue information.

## Columns

| Column | Type |
|---|---|
| id | UUID PK |
| wedding_id | UUID FK |
| name | VARCHAR(200) |
| address_line_1 | TEXT |
| address_line_2 | TEXT NULL |
| city | VARCHAR(100) |
| state | VARCHAR(100) |
| postal_code | VARCHAR(30) |
| country_code | CHAR(2) |
| latitude | DECIMAL(10,7) NULL |
| longitude | DECIMAL(10,7) NULL |
| maps_url | TEXT NULL |
| contact_phone | VARCHAR(30) NULL |
| metadata | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ |

---

# 23. Venue Relationship

```text
Wedding
   │
   └── Venues
          │
          ├── Event 1
          ├── Event 2
          └── Event 3
```

Multiple events can use the same venue.

---

# 24. guests

Guests are wedding-scoped contacts.

They do not need application accounts.

## Columns

| Column | Type |
|---|---|
| id | UUID PK |
| wedding_id | UUID FK |
| first_name | VARCHAR(100) |
| last_name | VARCHAR(100) NULL |
| display_name | VARCHAR(200) |
| email | CITEXT NULL |
| phone | VARCHAR(30) NULL |
| category_id | UUID FK NULL |
| side | ENUM |
| notes | TEXT NULL |
| metadata | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ |

---

# 25. Guest Identity

We deliberately do **not** create:

```text
people
contacts
global_guests
```

for MVP.

Instead:

```text
Wedding A
 └── Guest Rahul

Wedding B
 └── Guest Rahul
```

are independent records.

This avoids unnecessary complexity.

A future contact model can be added later.

---

# 26. Guest Side

```text
BRIDE
GROOM
BOTH
NEUTRAL
```

---

# 27. Guest Categories

Create:

```text
guest_categories
```

## Columns

| Column | Type |
|---|---|
| id | UUID |
| wedding_id | UUID |
| name | VARCHAR(100) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Default categories can include:

```text
Family
Friend
Relative
Colleague
Other
```

The wedding owner can customize them.

---

# 28. Guest Category Design

This gives us:

```text
System defaults
      +
Wedding-specific customization
```

Instead of hardcoding categories in the application.

---

# 29. Guest Email Rule

Multiple guests may share the same email.

Example:

```text
Guest A → family@example.com
Guest B → family@example.com
Guest C → family@example.com
```

Therefore:

```text
UNIQUE(wedding_id, email)
```

should **not** be enforced.

Invitation ownership is handled through the invitation record.

---

# 30. guest_events

Many-to-many relationship:

```text
Guest
  N
  │
  │
  N
Event
```

## Columns

| Column | Type |
|---|---|
| id | UUID PK |
| guest_id | UUID FK |
| event_id | UUID FK |
| invitation_status | ENUM |
| access_status | ENUM |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

# 31. Guest Event Constraint

```text
UNIQUE(guest_id, event_id)
```

A guest should only be associated with an event once.

---

# 32. Invitation Model

The invitation system is split conceptually into:

```text
Invitation
     │
     └── Access Credential
```

This separates invitation business state from secure guest access.

---

# 33. invitations

## Columns

| Column | Type |
|---|---|
| id | UUID PK |
| wedding_id | UUID FK |
| guest_id | UUID FK |
| template_id | UUID NULL |
| status | ENUM |
| sent_at | TIMESTAMPTZ NULL |
| delivered_at | TIMESTAMPTZ NULL |
| opened_at | TIMESTAMPTZ NULL |
| last_sent_at | TIMESTAMPTZ NULL |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

# 34. Invitation Status

```text
DRAFT
QUEUED
SENT
DELIVERED
OPENED
REVOKED
FAILED
```

---

# 35. Invitation Access

Secure guest access is stored separately.

## invitation_access

| Column | Type |
|---|---|
| id | UUID |
| invitation_id | UUID FK |
| token_hash | CHAR(64) |
| expires_at | TIMESTAMPTZ NULL |
| last_used_at | TIMESTAMPTZ NULL |
| revoked_at | TIMESTAMPTZ NULL |
| created_at | TIMESTAMPTZ |

---

# 36. Invitation Token

The raw token:

```text
https://makemymarriage.com/invite/abc123...
```

is never stored.

Instead:

```text
raw token
    ↓
SHA-256
    ↓
token_hash
```

Database stores only the hash.

---

# 37. Invitation Token Constraint

```text
UNIQUE(token_hash)
```

A token must be globally unique.

---

# 38. Invitation Experience

The database supports:

```text
Wedding
  ↓
Invitation
  ↓
Guest
  ↓
Authorized Events
```

The guest does not need separate user accounts for every event.

---

# 39. RSVP

RSVP is event-specific.

## rsvps

| Column | Type |
|---|---|
| id | UUID PK |
| wedding_id | UUID FK |
| guest_id | UUID FK |
| event_id | UUID FK |
| status | ENUM |
| attendee_count | SMALLINT |
| food_preference | VARCHAR NULL |
| accommodation_required | BOOLEAN |
| transportation_required | BOOLEAN |
| message | TEXT NULL |
| responded_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

# 40. RSVP Status

```text
PENDING
ATTENDING
NOT_ATTENDING
MAYBE
```

---

# 41. RSVP Constraint

```text
UNIQUE(guest_id, event_id)
```

One current RSVP per guest/event.

Historical changes can be tracked through activities if required.

---

# 42. Plus-One Strategy

For MVP, we use:

```text
attendee_count
```

Example:

```text
Rahul
RSVP = ATTENDING
attendee_count = 3
```

We do not create three guest records.

This keeps the model simple.

---

# 43. Future Named Plus-Ones

If future product requirements require names:

```text
rsvp_attendees
```

can be introduced.

Example:

```text
RSVP
 │
 ├── Rahul
 ├── Priya
 └── Child
```

This is intentionally not required for MVP.

---

# 44. tasks

## Columns

| Column | Type |
|---|---|
| id | UUID PK |
| wedding_id | UUID FK |
| event_id | UUID FK NULL |
| title | VARCHAR(200) |
| description | TEXT NULL |
| assignee_id | UUID FK NULL |
| priority | ENUM |
| status | ENUM |
| due_at | TIMESTAMPTZ NULL |
| created_by | UUID FK |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ |

---

# 45. Task Priority

```text
LOW
MEDIUM
HIGH
URGENT
```

---

# 46. Task Status

```text
TODO
IN_PROGRESS
BLOCKED
COMPLETED
CANCELLED
```

---

# 47. Task Assignment

One task has one primary assignee.

```text
Task
 ↓
User
```

Future collaboration can introduce:

```text
task_assignees
```

without redesigning the core task table.

---

# 48. photos

Photos are business records.

Actual binary files live in Cloudinary.

## Columns

| Column | Type |
|---|---|
| id | UUID PK |
| wedding_id | UUID FK |
| event_id | UUID FK NULL |
| uploaded_by_user_id | UUID FK NULL |
| uploaded_by_guest_id | UUID FK NULL |
| media_asset_id | UUID FK |
| visibility | ENUM |
| moderation_status | ENUM |
| caption | TEXT NULL |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ |

---

# 49. Photo Uploader

A photo can be uploaded by:

```text
Owner
Organizer
Guest
```

Therefore the schema supports both:

```text
uploaded_by_user_id
```

and:

```text
uploaded_by_guest_id
```

with an application/database constraint ensuring at least one uploader identity is present.

---

# 50. Photo Visibility

Use:

```text
PUBLIC
PRIVATE
EVENT_ONLY
```

Meaning:

### PUBLIC

Visible on the public wedding website.

### PRIVATE

Visible only to authorized wedding users.

### EVENT_ONLY

Visible to authorized participants of the associated event.

---

# 51. Photo Moderation

```text
PENDING
APPROVED
REJECTED
```

Guest-uploaded photos should default to:

```text
PENDING
```

Owner/organizer approval changes them to:

```text
APPROVED
```

---

# 52. media_assets

Represents Cloudinary media.

## Columns

| Column | Type |
|---|---|
| id | UUID PK |
| provider | ENUM |
| provider_asset_id | VARCHAR |
| public_id | VARCHAR |
| secure_url | TEXT |
| resource_type | VARCHAR |
| format | VARCHAR |
| width | INTEGER |
| height | INTEGER |
| bytes | BIGINT |
| metadata | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

# 53. Media Provider

Initially:

```text
CLOUDINARY
```

Future:

```text
S3
R2
OTHER
```

This supports provider abstraction.

---

# 54. Guest Check-In

## guest_entries

Stores successful guest entry.

| Column | Type |
|---|---|
| id | UUID |
| wedding_id | UUID |
| event_id | UUID |
| guest_id | UUID |
| checked_in_by | UUID FK |
| checked_in_at | TIMESTAMPTZ |
| source | ENUM |
| metadata | JSONB |

---

# 55. Guest Entry Constraint

Prevent duplicate successful check-in:

```text
UNIQUE(guest_id, event_id)
```

Therefore:

```text
Rahul + Wedding Event
```

can have only one active check-in record.

---

# 56. Check-In Source

```text
QR
MANUAL
```

Manual check-in can be useful if:

- Guest forgot QR
- QR cannot be scanned
- Staff needs to override entry

---

# 57. QR Credential

QR codes should resolve to secure credentials.

Do not encode sensitive information directly.

Bad:

```text
QR = {
  guestId: 123,
  email: ...
}
```

Better:

```text
QR
 ↓
Random credential
 ↓
Database validation
```

---

# 58. Check-In Security

Backend validates:

```text
QR Token
 ↓
Guest
 ↓
Wedding
 ↓
Event
 ↓
Invitation/Authorization
 ↓
Already checked in?
```

Only then create `guest_entries`.

---

# 59. Live Streams

## live_streams

| Column | Type |
|---|---|
| id | UUID |
| wedding_id | UUID |
| event_id | UUID |
| provider | ENUM |
| stream_url | TEXT |
| embed_url | TEXT NULL |
| status | ENUM |
| title | VARCHAR |
| metadata | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

# 60. Live Stream Provider

Initially:

```text
YOUTUBE
```

Future:

```text
VIMEO
CUSTOM
OTHER
```

---

# 61. Live Stream Status

```text
SCHEDULED
LIVE
ENDED
DISABLED
```

---

# 62. Wedding Website

## wedding_websites

| Column | Type |
|---|---|
| id | UUID |
| wedding_id | UUID |
| slug | VARCHAR |
| theme_id | UUID NULL |
| settings | JSONB |
| seo | JSONB |
| published_at | TIMESTAMPTZ NULL |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

# 63. Wedding Website Constraint

```text
UNIQUE(wedding_id)
```

Initially each wedding has one website.

Future custom domains can be represented separately.

---

# 64. Website Settings JSONB

Example:

```json
{
  "showCountdown": true,
  "showStory": true,
  "showGallery": true,
  "showEvents": true,
  "showVenue": true,
  "showLiveStream": true
}
```

---

# 65. SEO JSONB

Example:

```json
{
  "title": "Muni & Priya Wedding",
  "description": "Join us for our wedding celebration.",
  "keywords": [],
  "ogImage": "cloudinary-public-id"
}
```

---

# 66. website_sections

Structured sections allow flexible website customization.

## Columns

| Column | Type |
|---|---|
| id | UUID |
| wedding_website_id | UUID |
| section_type | ENUM |
| position | INTEGER |
| is_enabled | BOOLEAN |
| content | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

# 67. Section Types

Initial:

```text
HERO
COUPLE_STORY
EVENTS
VENUE
COUNTDOWN
GALLERY
LIVE_STREAM
RSVP
FOOTER
```

Future sections can be added without redesigning the entire website table.

---

# 68. Section Content

Example:

```json
{
  "title": "Two hearts, one journey",
  "description": "...",
  "image": "cloudinary-public-id"
}
```

JSONB is appropriate because section structures differ significantly.

---

# 69. Notifications

## notifications

| Column | Type |
|---|---|
| id | UUID |
| wedding_id | UUID |
| recipient_user_id | UUID NULL |
| recipient_guest_id | UUID NULL |
| type | VARCHAR |
| channel | ENUM |
| status | ENUM |
| subject | TEXT NULL |
| payload | JSONB |
| scheduled_at | TIMESTAMPTZ NULL |
| sent_at | TIMESTAMPTZ NULL |
| failed_at | TIMESTAMPTZ NULL |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

# 70. Notification Channel

Initially:

```text
EMAIL
```

Future:

```text
SMS
WHATSAPP
PUSH
```

---

# 71. Notification Status

```text
PENDING
QUEUED
SENT
DELIVERED
FAILED
CANCELLED
```

---

# 72. Activities

User-facing activity feed.

## activities

| Column | Type |
|---|---|
| id | UUID |
| wedding_id | UUID |
| actor_user_id | UUID NULL |
| actor_guest_id | UUID NULL |
| action | VARCHAR |
| entity_type | VARCHAR |
| entity_id | UUID NULL |
| metadata | JSONB |
| created_at | TIMESTAMPTZ |

Examples:

```text
Guest RSVP'd
Invitation sent
Task completed
Photo uploaded
Photo approved
Guest checked in
```

---

# 73. Activity vs Audit

For MVP:

```text
Activity
```

acts as the operational history.

However, the schema should allow a future dedicated:

```text
audit_logs
```

table.

An audit log would be intended for immutable security/compliance records.

---

# 74. Entity Relationship Diagram

High-level ERD:

```text
USERS
  │
  ├───────────────┐
  │               │
  ▼               ▼
WEDDINGS      WEDDING_MEMBERS
  │               │
  │               ▼
  │             ROLES
  │
  ├───────────────┬───────────────┬───────────────┐
  │               │               │               │
  ▼               ▼               ▼               ▼
EVENTS          GUESTS          TASKS        WEDDING_WEBSITES
  │               │
  │               │
  │          GUEST_EVENTS
  │               │
  │         ┌─────┴─────┐
  │         ▼           ▼
  │    INVITATIONS     RSVPS
  │         │
  │         ▼
  │  INVITATION_ACCESS
  │
  ├──────────────► VENUES
  │
  ├──────────────► LIVE_STREAMS
  │
  └──────────────► GUEST_ENTRIES

WEDDINGS
   │
   ├── PHOTOS
   │      │
   │      ▼
   │  MEDIA_ASSETS
   │
   ├── NOTIFICATIONS
   │
   └── ACTIVITIES
```

---

# 75. Cardinality

Important relationships:

```text
User 1 ─── N Weddings

User 1 ─── N WeddingMemberships

Wedding 1 ─── N Events

Wedding 1 ─── N Guests

Wedding 1 ─── N Venues

Guest N ─── N Event
       through GuestEvent

Guest 1 ─── N Invitations

Invitation 1 ─── N InvitationAccess
```

For MVP, we can normally maintain one active invitation access credential per invitation, while retaining the table structure for future rotation/history.

```text
Guest 1 ─── N RSVPs

Event 1 ─── N RSVPs

Wedding 1 ─── N Tasks

Wedding 1 ─── N Photos

Photo 1 ─── 1 MediaAsset

Guest 1 ─── N GuestEntries
```

---

# 76. Tenant Isolation Rule

Every wedding-owned entity should carry:

```text
wedding_id
```

where practical.

For example:

```text
guests.wedding_id
events.wedding_id
tasks.wedding_id
photos.wedding_id
notifications.wedding_id
activities.wedding_id
```

This allows queries to be scoped naturally:

```sql
WHERE wedding_id = :weddingId
```

---

# 77. Why Duplicate wedding_id?

Some relationships can technically derive wedding ownership through another table.

For example:

```text
guest_events
 → guest
 → wedding
```

But explicitly storing `wedding_id` in major tables can provide:

- Faster tenant filtering
- Easier authorization
- Better indexing
- Easier future partitioning
- Safer queries

The application must enforce consistency.

---

# 78. Tenant Consistency

For example:

```text
guest_events.guest_id
guest_events.event_id
guest_events.wedding_id
```

must all belong to the same wedding.

This should be validated at the application/domain layer and, where practical, reinforced through composite foreign-key constraints.

---

# 79. Composite Foreign Keys

For stronger tenant isolation, selected relationships can use composite references.

Conceptually:

```text
(guest_id, wedding_id)
        ↓
guests(id, wedding_id)
```

and:

```text
(event_id, wedding_id)
        ↓
events(id, wedding_id)
```

This prevents accidental cross-wedding relationships.

---

# 80. Important Indexes

## Users

```text
UNIQUE(email)
```

## Weddings

```text
UNIQUE(slug)
INDEX(owner_id)
INDEX(status)
```

## Memberships

```text
UNIQUE(wedding_id, user_id)
INDEX(user_id)
INDEX(wedding_id)
```

## Events

```text
INDEX(wedding_id)
INDEX(wedding_id, start_at)
```

## Guests

```text
INDEX(wedding_id)
INDEX(wedding_id, email)
INDEX(wedding_id, category_id)
INDEX(wedding_id, side)
```

---

# 81. Guest Event Indexes

```text
UNIQUE(guest_id, event_id)

INDEX(event_id)
INDEX(guest_id)
```

---

# 82. Invitation Indexes

```text
INDEX(wedding_id)
INDEX(guest_id)
INDEX(status)
```

Invitation access:

```text
UNIQUE(token_hash)
INDEX(invitation_id)
```

---

# 83. RSVP Indexes

```text
UNIQUE(guest_id, event_id)

INDEX(wedding_id)
INDEX(event_id)
INDEX(status)
```

---

# 84. Task Indexes

```text
INDEX(wedding_id)
INDEX(event_id)
INDEX(assignee_id)
INDEX(status)
INDEX(due_at)
```

Potential composite:

```text
INDEX(wedding_id, status)
```

---

# 85. Photo Indexes

```text
INDEX(wedding_id)
INDEX(event_id)
INDEX(moderation_status)
INDEX(visibility)
INDEX(created_at)
```

Potential composite:

```text
INDEX(wedding_id, moderation_status)
```

---

# 86. Check-In Indexes

```text
UNIQUE(guest_id, event_id)

INDEX(wedding_id, event_id)
INDEX(event_id, checked_in_at)
```

This supports:

```text
How many guests checked in for this event?
```

efficiently.

---

# 87. Activity Index

```text
INDEX(wedding_id, created_at DESC)
```

This supports the wedding dashboard activity feed.

---

# 88. Notification Indexes

```text
INDEX(wedding_id)
INDEX(status)
INDEX(scheduled_at)
INDEX(recipient_user_id)
INDEX(recipient_guest_id)
```

Potential worker query:

```text
WHERE status = 'PENDING'
AND scheduled_at <= NOW()
```

---

# 89. JSONB Indexing

Do not index every JSONB field.

Only index fields that are actually queried frequently.

For example:

```text
website.settings
```

may not need an index.

If future requirements introduce queries against JSONB fields, targeted GIN or expression indexes can be introduced.

---

# 90. Soft Delete Strategy

Soft deletion fields:

```text
deleted_at
```

should be added to major user-managed entities.

Example:

```text
weddings
events
guests
venues
tasks
photos
```

Queries should normally include:

```sql
WHERE deleted_at IS NULL
```

---

# 91. Why Not Soft Delete Everything?

Operational tables such as:

```text
notification attempts
temporary records
job records
```

can create unnecessary database growth if every record is retained indefinitely.

Retention policies should be defined separately.

---

# 92. Wedding Deletion

When owner requests deletion:

```text
ACTIVE
 ↓
DELETION_REQUESTED
 ↓
ARCHIVED
```

The system should not immediately destroy all records.

A future cleanup worker can permanently remove:

```text
Wedding
 ↓
Events
Guests
Invitations
Photos
Tasks
Website
```

and associated Cloudinary assets.

---

# 93. Cascading Deletes

Use database `ON DELETE` behavior carefully.

For dependent entities where physical deletion is safe:

```text
Invitation
 → InvitationAccess
```

can use cascading deletion.

For business-critical records, prefer application-controlled deletion.

Do not blindly use:

```text
ON DELETE CASCADE
```

through the entire database.

---

# 94. Timestamps

All timestamps should use:

```text
TIMESTAMPTZ
```

Store timestamps in UTC.

Example:

```text
2027-02-14T04:30:00Z
```

Display according to:

```text
wedding.timezone
```

---

# 95. Date vs Timestamp

Use `DATE` for calendar-only concepts.

Example:

```text
wedding_date
```

Use `TIMESTAMPTZ` for actual moments.

Example:

```text
event.start_at
event.end_at
rsvp.responded_at
guest_entry.checked_in_at
```

---

# 96. Country Representation

Use ISO-style country codes.

Example:

```text
IN
US
GB
AE
```

Do not store:

```text
India
United States
```

as the canonical country value.

Display names can come from localization data.

---

# 97. Language Representation

Use locale-like identifiers:

```text
en
hi
te
```

Future:

```text
ta
kn
mr
fr
de
```

---

# 98. Internationalization Strategy

MVP:

```text
UI
 ↓
i18n
 ├── English
 ├── Hindi
 └── Telugu
```

Wedding-generated content remains single-language initially.

Future translation tables can be introduced:

```text
wedding_translations
event_translations
website_section_translations
```

without changing the core entities.

---

# 99. Wedding Slug

Example:

```text
/w/muni-priya
```

Slug should be:

- URL-safe
- Unique
- Lowercase
- Human-readable

Constraint:

```text
UNIQUE(slug)
```

---

# 100. Slug Changes

If users can change their slug later, old URLs may become invalid.

A future:

```text
wedding_slug_history
```

table can preserve redirects.

Not required for MVP.

---

# 101. Database Transaction: Create Wedding

Conceptual transaction:

```text
BEGIN

Create Wedding

Create Wedding Membership
    role = OWNER

Create Wedding Website

Create Default Guest Categories

COMMIT
```

If any required step fails:

```text
ROLLBACK
```

---

# 102. Database Transaction: Create Event

```text
BEGIN

Create Event

Optional:
Create/associate Venue

COMMIT
```

---

# 103. Database Transaction: Add Guest

```text
BEGIN

Create Guest

Create GuestEvent records

Optional:
Create Invitation

COMMIT
```

---

# 104. Database Transaction: RSVP

```text
BEGIN

Validate Guest
Validate Event
Validate GuestEvent

Create/Update RSVP

Create Activity

COMMIT
```

Email notification should generally happen asynchronously after the transaction succeeds.

---

# 105. Database Transaction: Check-In

```text
BEGIN

Validate guest
Validate event
Validate authorization

Check existing guest_entries

Create GuestEntry

Create Activity

COMMIT
```

Then:

```text
Publish realtime event
```

---

# 106. Important Check-In Race Condition

Two scanners may scan the same guest simultaneously.

Example:

```text
Scanner A ──┐
            ├── Same guest
Scanner B ──┘
```

Both could initially see:

```text
No check-in
```

Therefore the database constraint:

```text
UNIQUE(guest_id, event_id)
```

is essential.

The second transaction must gracefully handle the uniqueness violation.

---

# 107. Invitation Race Condition

Multiple invitation requests could attempt to generate credentials.

Use:

```text
UNIQUE(token_hash)
```

and transactional creation.

---

# 108. RSVP Race Condition

Two browser tabs may submit RSVP simultaneously.

Use:

```text
UNIQUE(guest_id, event_id)
```

and an upsert/update strategy.

---

# 109. Queue / Outbox Preparation

The database should eventually support an outbox table.

Potential future table:

```text
outbox_events
```

## Example

```text
id
wedding_id
event_type
aggregate_type
aggregate_id
payload
status
created_at
processed_at
```

This allows reliable asynchronous processing.

---

# 110. Why Outbox Is Not Required Immediately

For MVP, adding a complete distributed event architecture would introduce unnecessary complexity.

But the business modules should already produce conceptual domain events.

Later:

```text
Domain Event
 ↓
Outbox
 ↓
Worker
```

can be introduced.

---

# 111. Prisma ORM

The database implementation will use Prisma.

Conceptual structure:

```text
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

The Prisma schema should reflect the domain model rather than becoming the business logic itself.

---

# 112. Prisma Migration Strategy

Development:

```text
Modify schema
 ↓
Create migration
 ↓
Apply migration
 ↓
Test
```

Production:

```text
Migration artifact
 ↓
Review
 ↓
Apply migration
```

Avoid manually modifying production tables without migrations.

---

# 113. Migration Rules

Never casually:

```text
DROP COLUMN
```

in production.

For breaking schema changes:

```text
Expand
 ↓
Migrate data
 ↓
Update application
 ↓
Contract
```

This allows safer deployments.

---

# 114. Example Expand/Contract

Suppose:

```text
name
```

must become:

```text
first_name
last_name
```

Do:

```text
1. Add first_name
2. Add last_name
3. Backfill existing rows
4. Update application
5. Verify
6. Remove old name later
```

Not:

```text
DROP name
ADD first_name
```

in one dangerous deployment.

---

# 115. Seed Data

Development seed should create:

```text
Roles
Guest Categories
Sample User
Sample Wedding
Sample Events
Sample Guests
Sample Tasks
```

Example:

```text
OWNER
ORGANIZER

Family
Friend
Relative
Colleague
Other
```

---

# 116. Sample Wedding

Seed example:

```text
Muni & Priya
```

Events:

```text
Haldi
Sangeet
Wedding
Reception
```

Guests:

```text
Rahul
Priya
Arjun
Ananya
```

This allows the entire product flow to be tested locally.

---

# 117. Query Pattern: Wedding Dashboard

Dashboard should not fetch every table independently if it creates unnecessary database load.

Potential aggregated queries:

```text
Wedding
 ├── Event count
 ├── Guest count
 ├── RSVP count
 ├── Pending tasks
 ├── Checked-in count
 └── Recent activities
```

Use targeted aggregate queries.

---

# 118. Dashboard Metrics

Potential metrics:

```text
Total Guests
Invited
RSVP Attending
RSVP Pending
RSVP Not Attending
Tasks Remaining
Photos
Checked In
```

These should be computed efficiently.

For large weddings, precomputed counters can be introduced later.

---

# 119. Counter Strategy

MVP:

```text
COUNT(...)
```

using indexed columns.

At scale:

```text
wedding_statistics
```

could store:

```text
guest_count
attending_count
checked_in_count
photo_count
```

This should only be introduced when measurements show it is necessary.

---

# 120. Pagination Strategy

For large collections:

```text
Guests
Photos
Activities
Notifications
Tasks
```

use pagination.

Initial UI can use page-based pagination.

For very large feeds:

```text
cursor-based pagination
```

is preferable.

---

# 121. Guest Pagination

Example:

```text
GET /weddings/:id/guests
?page=1
&limit=50
```

Future:

```text
?cursor=...
&limit=50
```

---

# 122. Photo Pagination

Never load the entire wedding gallery.

Example:

```text
GET /weddings/:id/photos
?eventId=...
&page=1
&limit=30
```

Images should use Cloudinary transformations.

---

# 123. Activity Pagination

Use:

```text
created_at DESC
```

and eventually cursor pagination.

Example:

```text
GET /weddings/:id/activities
?cursor=...
```

---

# 124. Search Strategy

MVP search should use PostgreSQL.

Guests:

```text
display_name
email
phone
```

Events:

```text
name
```

Tasks:

```text
title
```

No Elasticsearch is required initially.

---

# 125. PostgreSQL Full-Text Search

If search requirements become more advanced, PostgreSQL full-text search can be introduced before adopting a separate search engine.

This reduces unnecessary infrastructure.

---

# 126. Partitioning

Do not partition tables at MVP.

Potential future candidates:

```text
activities
notifications
audit_logs
guest_entries
```

because these can grow significantly.

Partition by:

```text
created_at
```

or potentially:

```text
wedding_id
```

depending on observed workload.

---

# 127. Read Replicas

Not needed initially.

Future architecture:

```text
Application
    │
    ├── Primary → writes
    │
    └── Replica → read-heavy queries
```

This becomes relevant only at larger scale.

---

# 128. Connection Management

Because deployment initially uses Vercel/serverless-style execution, database connections must be managed carefully.

Use:

- Connection pooling
- Appropriate pool sizing
- Managed PostgreSQL pooling where available
- Prisma-compatible connection configuration

Do not assume every serverless request can open a fresh unrestricted database connection.

---

# 129. Redis Relationship

Redis should never replace database constraints.

For example, don't rely on:

```text
Redis says guest isn't checked in
```

as the final authority.

Instead:

```text
PostgreSQL UNIQUE constraint
```

guarantees correctness.

Redis improves performance.

---

# 130. Redis Cache Keys

Conceptual keys:

```text
wedding:{id}
wedding:{id}:events
wedding:{id}:public
wedding:{id}:dashboard
guest:{id}
event:{id}
```

Cache keys should include tenant context where appropriate.

---

# 131. Cache Invalidation

When wedding changes:

```text
UPDATE wedding
 ↓
Invalidate
 ├── wedding:{id}
 ├── wedding:{id}:public
 └── related website cache
```

When event changes:

```text
UPDATE event
 ↓
Invalidate event cache
 ↓
Invalidate wedding public cache
```

---

# 132. Database Backup Strategy

Production should eventually use:

- Automated backups
- Point-in-time recovery
- Backup retention
- Periodic restore testing

The application architecture should never assume:

```text
Database = permanent and indestructible
```

---

# 133. Media Backup Strategy

Cloudinary is external media storage.

Database stores:

```text
provider
public_id
secure_url
metadata
```

If media migration is required later:

```text
Cloudinary
 ↓
New provider
```

can be performed using `public_id`/metadata.

---

# 134. Data Privacy

Guest data may contain:

- Names
- Emails
- Phone numbers
- RSVP preferences
- Accommodation requirements
- Transportation requirements

Therefore guest information must remain wedding-scoped and access-controlled.

---

# 135. Sensitive Data Principle

Never expose complete guest records through public APIs.

For example:

```text
GET /public/wedding/:slug
```

must not return:

```json
{
  "guests": [
    {
      "email": "...",
      "phone": "..."
    }
  ]
}
```

---

# 136. Public Website Data Model

Public endpoint should return a projection:

```text
WeddingPublicView
```

rather than the complete Wedding entity.

Conceptually:

```text
Database
   ↓
Public projection
   ↓
API
```

This creates a security boundary.

---

# 137. Database Constraints Summary

Important constraints include:

```text
users.email UNIQUE

weddings.slug UNIQUE

wedding_members
(wedding_id, user_id) UNIQUE

guest_events
(guest_id, event_id) UNIQUE

invitations.token_hash UNIQUE

rsvps
(guest_id, event_id) UNIQUE

guest_entries
(guest_id, event_id) UNIQUE

wedding_websites.wedding_id UNIQUE
```

---

# 138. Referential Integrity

Foreign keys should be used extensively.

Examples:

```text
weddings.owner_id → users.id

events.wedding_id → weddings.id

guests.wedding_id → weddings.id

guest_events.guest_id → guests.id

guest_events.event_id → events.id

rsvps.guest_id → guests.id

rsvps.event_id → events.id
```

The database should reject invalid relationships.

---

# 139. Domain Validation vs Database Validation

Use both.

### Database

Protect:

```text
Uniqueness
Foreign keys
Nullability
Basic checks
```

### Application

Protect:

```text
Business rules
Authorization
Workflow
Complex validation
```

Neither layer should attempt to replace the other.

---

# 140. Example Authorization Query

Before updating a guest:

```text
Authenticated User
        ↓
Wedding Membership
        ↓
Wedding ID
        ↓
Guest.wedding_id
        ↓
Authorized?
```

Never trust:

```text
guest_id
```

alone.

---

# 141. Cross-Tenant Access Protection

This request:

```text
PATCH /guests/123
```

must not simply execute:

```sql
UPDATE guests
SET ...
WHERE id = '123';
```

Instead it should effectively enforce:

```sql
UPDATE guests
SET ...
WHERE id = '123'
AND wedding_id = :authorizedWeddingId
AND deleted_at IS NULL;
```

This is a critical security pattern.

---

# 142. Future PostgreSQL Row-Level Security

At larger scale, PostgreSQL RLS can potentially reinforce tenant isolation.

Conceptually:

```text
Application
 ↓
SET current_wedding_id
 ↓
PostgreSQL RLS
 ↓
Allowed rows only
```

RLS is not required for MVP but the schema should remain compatible with it.

---

# 143. Database Growth Model

Potential growth:

```text
Users
      ↓
Weddings
      ↓
Events
      ↓
Guests
      ↓
Guest Events
      ↓
Invitations / RSVP
      ↓
Photos / Activities
```

The largest tables are likely to become:

```text
photos
activities
notifications
guest_entries
```

Therefore these should be designed with efficient indexes and future retention strategies.

---

# 144. Expected Hot Queries

The architecture should optimize for:

### Wedding dashboard

```text
WHERE wedding_id = ?
```

### Guest list

```text
WHERE wedding_id = ?
ORDER BY created_at
```

### Event guest list

```text
WHERE event_id = ?
```

### RSVP statistics

```text
WHERE event_id = ?
GROUP BY status
```

### Check-in statistics

```text
WHERE event_id = ?
```

### Public wedding website

```text
WHERE slug = ?
```

### Activity feed

```text
WHERE wedding_id = ?
ORDER BY created_at DESC
```

---

# 145. Query Optimization Principle

Do not prematurely create:

```text
materialized views
partitioned tables
read replicas
search clusters
```

Start with:

```text
Correct schema
+
Good indexes
+
Efficient queries
```

Then optimize based on actual workload.

---

# 146. Future Multi-Wedding Model

The database already supports:

```text
User
 ├── Wedding A
 ├── Wedding B
 └── Wedding C
```

because ownership and membership are separate relationships.

No fundamental schema redesign is required.

---

# 147. Future Vendor Model

Future tables could include:

```text
vendors
vendor_categories
vendor_services
vendor_bookings
vendor_reviews
```

They should not be forced into the current wedding core.

Potential relationship:

```text
Wedding
  │
  └── VendorBooking
         │
         └── Vendor
```

---

# 148. Future Payment Model

Potential future:

```text
payments
orders
subscriptions
payment_events
```

Payments should use immutable provider events/webhooks for reconciliation.

They should not be tightly coupled to the wedding table.

---

# 149. Future AI Model

Potential future tables:

```text
ai_conversations
ai_messages
ai_generated_content
```

AI data should remain separate from core wedding entities.

---

# 150. Future Global Contact Model

If product requirements eventually need:

```text
"Invite Rahul to multiple weddings"
```

we can introduce:

```text
contacts
wedding_guests
```

or a similar identity model.

The current guest schema should therefore avoid assumptions that prevent this migration.

---

# 151. Recommended Initial Prisma Model Groups

Organize the Prisma schema logically:

```text
// Identity
User
Role
WeddingMember

// Wedding
Wedding
Venue
Event

// Guests
Guest
GuestCategory
GuestEvent

// Invitations
Invitation
InvitationAccess

// RSVP
RSVP

// Planning
Task

// Media
MediaAsset
Photo

// Wedding Day
GuestEntry
LiveStream

// Website
WeddingWebsite
WebsiteSection

// Communication
Notification

// Activity
Activity
```

---

# 152. Database Naming Convention

Use:

```text
snake_case
```

for database columns and tables.

Examples:

```text
created_at
updated_at
wedding_id
guest_id
checked_in_at
```

Application-level TypeScript can use:

```text
createdAt
weddingId
guestId
checkedInAt
```

through ORM mapping if desired.

---

# 153. Primary Key Convention

All primary keys:

```text
id UUID
```

Foreign keys:

```text
wedding_id UUID
guest_id UUID
event_id UUID
```

This keeps the model consistent.

---

# 154. Enum Strategy

Use PostgreSQL enums for stable domain values.

Good candidates:

```text
WeddingStatus
EventStatus
InvitationStatus
RSVPStatus
TaskStatus
TaskPriority
PhotoVisibility
PhotoModerationStatus
NotificationStatus
```

For highly dynamic values, use strings instead.

---

# 155. When Not to Use PostgreSQL ENUM

Avoid enums when values are expected to be user-configurable.

For example:

```text
GuestCategory
```

should be a table rather than:

```text
ENUM(FAMILY, FRIEND, ...)
```

because the wedding owner can create custom categories.

---

# 156. Database Design Rule

A useful rule for MakeMyMarriage:

> **Business relationships belong in relational tables. Flexible presentation/configuration belongs in JSONB.**

Examples:

```text
Guest → Event
```

relational.

```text
Website section styling
```

JSONB.

---

# 157. Final Logical Model

The central model is:

```text
                         USER
                          │
                          │
                   ┌──────┴──────┐
                   │             │
                OWNER         MEMBER
                   │             │
                   └──────┬──────┘
                          │
                       WEDDING
                          │
       ┌──────────────────┼───────────────────┐
       │                  │                   │
       ▼                  ▼                   ▼
     EVENTS             GUESTS              TASKS
       │                  │
       │             GUEST_EVENTS
       │                  │
       │          ┌───────┴────────┐
       │          ▼                ▼
       │     INVITATIONS          RSVPS
       │          │
       │    INVITATION_ACCESS
       │
       ├────────── VENUES
       │
       ├────────── LIVE_STREAMS
       │
       └────────── GUEST_ENTRIES

       WEDDING
          │
     ┌────┼───────────────┐
     │    │               │
     ▼    ▼               ▼
  PHOTOS WEBSITE       ACTIVITIES
     │
     ▼
MEDIA_ASSETS
```

---

# 158. Final Database Architecture

```text
                     PostgreSQL
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    Identity          Wedding           Planning
        │                │                │
     Users          Events/Guests       Tasks
     Roles          Invitations
     Members        RSVP
                    Venues
                    Check-in
                    Gallery
                    Website
                         │
                         ▼
                    Business Data
```

Supporting infrastructure:

```text
                    PostgreSQL
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
        Redis        Cloudinary       Resend
       Cache/Jobs       Media           Email
```

---

# 159. MVP Database Scope

The first implementation should prioritize:

```text
users
weddings
wedding_members
roles

events
venues

guests
guest_categories
guest_events

invitations
invitation_access
rsvps

tasks

media_assets
photos

guest_entries

live_streams

wedding_websites
website_sections

notifications
activities
```

This is enough to support the major MVP capabilities without introducing unnecessary infrastructure.

---

# 160. Implementation Priority

Database implementation should happen in this order:

```text
Phase 1
Identity
 ├── users
 ├── roles
 └── wedding_members

        ↓

Phase 2
Wedding Core
 ├── weddings
 ├── events
 └── venues

        ↓

Phase 3
Guests
 ├── guests
 ├── guest_categories
 └── guest_events

        ↓

Phase 4
Invitations + RSVP
 ├── invitations
 ├── invitation_access
 └── rsvps

        ↓

Phase 5
Planning
 └── tasks

        ↓

Phase 6
Media
 ├── media_assets
 └── photos

        ↓

Phase 7
Wedding Day
 ├── guest_entries
 └── live_streams

        ↓

Phase 8
Website
 ├── wedding_websites
 └── website_sections

        ↓

Phase 9
Communication
 ├── notifications
 └── activities
```

---

# 161. Database Design Decision Summary

| Decision | Final Choice |
|---|---|
| Database | PostgreSQL |
| ORM | Prisma |
| IDs | UUIDv7 |
| Tenant | Wedding |
| User → Wedding | One-to-many |
| Membership | Separate table |
| RBAC | Role-based, future-ready |
| Guest account | Not required |
| Guest identity | Wedding-scoped |
| Guest email | Can be shared |
| Events | Separate entities |
| Guest/Event | Many-to-many |
| RSVP | Event-specific |
| Plus-one | Attendee count |
| Tasks | One primary assignee |
| Gallery | Cloudinary + PostgreSQL metadata |
| Guest uploads | Allowed + moderation |
| Photo visibility | Public/Private/Event |
| QR | Secure token |
| Check-in | Guest + Event |
| Duplicate check-in | DB uniqueness constraint |
| Website | One per wedding |
| Website customization | JSONB + relational |
| Time | UTC + timezone |
| Venue | Reusable |
| Deletion | Hybrid/soft deletion |
| Search | PostgreSQL initially |
| Cache | Redis |
| Queue | Abstracted |
| Audit | Activity initially |
| Internationalization | UI now, content later |
| Microservices | Future extraction |

---

# 162. Final Architectural Principle

The most important database relationship in MakeMyMarriage is:

```text
                    WEDDING
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
    EVENTS           GUESTS           TASKS
       │               │
       │          GUEST_EVENTS
       │               │
       │        ┌──────┴──────┐
       │        ▼             ▼
       │   INVITATIONS       RSVP
       │        │
       │   INVITATION_ACCESS
       │
       ├──── VENUE
       ├──── LIVE_STREAM
       └──── GUEST_ENTRY

       │
       ├──── PHOTOS ──── MEDIA_ASSETS
       │
       ├──── WEBSITE ─── WEBSITE_SECTIONS
       │
       ├──── NOTIFICATIONS
       │
       └──── ACTIVITIES
```

This model gives MakeMyMarriage a strong relational core while preserving flexibility for customization.

It supports the immediate MVP:

**Create wedding → create events → add guests → send invitations → receive RSVPs → manage tasks → publish wedding website → collect photos → check in guests → show live updates.**

At the same time, it provides a clean foundation for:

**multiple weddings → advanced RBAC → vendor marketplace → payments → AI features → international expansion → higher scale → eventual service extraction.**

---

# End of Database Design Document — Version 1.0