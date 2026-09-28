# MakeMyMarriage
## Product Requirements Document (PRD)

**Product:** MakeMyMarriage  
**Version:** 1.0  
**Market:** India first  
**Languages:** English, Hindi, Telugu  
**Business Model:** Free SaaS initially  
**Product Direction:** Complete Digital Wedding Ecosystem  
**MVP Strategy:** Focused MVP with extensible architecture

---

# 1. Product Overview

## 1.1 Product Vision

MakeMyMarriage is a digital wedding management platform designed to help couples plan, organize, invite, communicate with, and manage guests throughout their wedding journey.

Instead of using separate tools for:

- Wedding invitations
- RSVP collection
- Guest lists
- Wedding websites
- Event schedules
- Task management
- Reminders
- Photo sharing
- Live streaming
- Guest entry

MakeMyMarriage brings these capabilities into one unified platform.

### Vision

> **Make every wedding easy to plan, beautiful to experience, and simple to manage.**

---

# 2. Problem Statement

Planning a wedding typically requires multiple disconnected tools.

Couples may use:

- WhatsApp for communication
- Google Sheets for guest management
- Canva for invitations
- Google Forms for RSVP
- Google Maps for venue sharing
- Separate websites for wedding information
- Manual lists for guest entry
- Cloud storage for photos
- YouTube for live streaming
- Notes or spreadsheets for tasks

This creates:

- Duplicate information
- Manual work
- Poor coordination
- Difficulty tracking RSVPs
- Guest-management problems
- Last-minute confusion
- No centralized wedding dashboard

MakeMyMarriage solves this by creating a **single source of truth for the entire wedding**.

---

# 3. Product Goals

## Primary Goals

1. Allow a couple to create and configure their wedding.
2. Allow multiple events within one wedding.
3. Create beautiful digital invitations.
4. Send invitations through email.
5. Allow guests to RSVP without creating accounts.
6. Provide a personalized wedding website.
7. Manage guests centrally.
8. Generate QR-based guest entry.
9. Manage wedding tasks and organisers.
10. Provide reminders.
11. Provide photo sharing and gallery functionality.
12. Integrate external live streams.
13. Provide a centralized wedding dashboard.
14. Support English, Hindi, and Telugu.
15. Keep the product free during the initial phase.
16. Build the architecture so future international expansion is possible.

---

# 4. Non-Goals for MVP

The following will not be part of the initial MVP:

- Vendor marketplace
- Wedding vendor profiles
- Vendor payments
- Wedding service booking
- Paid subscriptions
- Multiple weddings per user
- Native video streaming infrastructure
- Social media platform functionality
- Advanced wedding analytics
- Complex role/permission hierarchy
- Native mobile applications

These can be introduced in future versions.

---

# 5. Target Users

## 5.1 Wedding Owner

The primary user.

Usually:

- Bride
- Groom

Responsibilities:

- Create wedding
- Configure wedding
- Create events
- Manage invitations
- Manage guests
- Manage organisers
- Manage tasks
- Manage gallery
- Manage live stream
- Monitor dashboard
- Manage guest entry

---

## 5.2 Organiser

A person helping the couple manage the wedding.

Examples:

- Family member
- Friend
- Wedding coordinator

Responsibilities may include:

- View assigned events
- Manage assigned tasks
- Update task status
- Manage guests where permitted
- Upload photos
- Assist with event management

For MVP, organiser permissions should remain relatively simple.

---

## 5.3 Guest

Guests do not need accounts.

They receive a secure invitation through email.

Guest capabilities:

- Open invitation
- View wedding/event information
- RSVP
- View permitted event information
- Access wedding website
- Upload photos through a secure link
- Access live stream when permitted
- Present QR code during entry

---

# 6. Core Product Model

The fundamental product relationship should be:

```text
User
  │
  └── Wedding
        │
        ├── Events
        │     ├── Invitation
        │     ├── Guest List
        │     ├── RSVP
        │     ├── Tasks
        │     ├── Photos
        │     └── Live Stream
        │
        ├── Guests
        │
        ├── Organisers
        │
        ├── Tasks
        │
        ├── Gallery
        │
        └── Wedding Website
```

The most important domain concept is:

> **Wedding → Event → Guest → Invitation → RSVP → Entry/Experience**

This model should drive the backend architecture.

---

# 7. Authentication

## 7.1 Wedding Owner Authentication

MVP authentication:

- Email
- Password
- Login
- Signup
- Logout
- Forgot password
- Reset password

Future:

- Google OAuth
- Phone OTP
- Social authentication

---

# 8. Wedding Setup

After registration, the user should be guided through a wedding setup flow.

## Required information

### Couple

- Bride name
- Groom name
- Couple profile image
- Wedding title
- Short description

### Wedding

- Wedding date
- Wedding timezone
- Primary location
- Wedding description
- Website slug

Example:

```text
makemymarriage.com/w/muni-and-priya
```

### Initial Setup

The user can create the first event during onboarding.

Example:

```text
Wedding
    ↓
Create Event
    ↓
Wedding Ceremony
```

Additional events can be added later.

---

# 9. Events

A wedding can contain multiple events.

Examples:

- Engagement
- Haldi
- Mehendi
- Sangeet
- Wedding
- Reception
- After Party

Events should be completely customizable.

## Event properties

Each event should support:

- Event name
- Description
- Date
- Start time
- End time
- Timezone
- Venue
- Address
- Map location
- Dress code
- Event image
- Event cover image
- Guest list
- Invitation
- RSVP
- Tasks
- Reminders
- Gallery
- Live stream
- Event visibility

---

# 10. Event Independence

Each event should behave independently.

Example:

```text
Wedding
│
├── Haldi
│   ├── Guests
│   ├── RSVP
│   ├── Invitation
│   └── Tasks
│
├── Sangeet
│   ├── Guests
│   ├── RSVP
│   ├── Invitation
│   └── Tasks
│
└── Wedding Ceremony
    ├── Guests
    ├── RSVP
    ├── Invitation
    └── Tasks
```

A guest may be invited to:

```text
Haldi       ❌
Sangeet     ✅
Wedding     ✅
Reception   ✅
```

The system must support this.

---

# 11. Digital Invitations

MakeMyMarriage should provide customizable digital wedding invitations.

## Invitation content

An invitation can include:

- Couple names
- Couple image
- Wedding message
- Event details
- Date
- Time
- Venue
- Map
- Dress code
- Countdown
- RSVP button
- Wedding website link
- Background images
- Decorative elements

---

# 12. Invitation Templates

The platform should provide multiple templates.

Examples:

- Traditional Indian
- Modern Minimal
- Elegant
- Floral
- Royal
- Festive
- Telugu-inspired
- Hindi-inspired

Templates should be configurable rather than hardcoded.

---

# 13. Invitation Customization

Users should be able to customize:

- Colors
- Fonts
- Images
- Background
- Text
- Layout options
- Event information
- Couple information

The architecture should separate:

```text
Invitation Template
+
User Configuration
=
Final Invitation
```

This allows additional templates to be added later without changing the invitation engine.

---

# 14. Invitation Delivery

MVP delivery channel:

> Email

The platform should track:

- Invitation created
- Invitation sent
- Delivery status
- Opened
- RSVP completed

Future:

- WhatsApp
- SMS
- Push notifications

---

# 15. Secure Guest Access

Guests should not need accounts.

Each invitation should have a secure token.

Example:

```text
https://makemymarriage.com/invite/secure-token
```

The token should:

- Be cryptographically secure
- Be unique
- Not expose internal database IDs
- Have revocation capability
- Support expiration if required

The guest can access their invitation using the secure link.

---

# 16. QR Code

Each guest/invitation can have a QR code.

QR code points to the guest's secure invitation.

Example:

```text
QR Code
   ↓
Secure Invitation
   ↓
Guest Details
   ↓
RSVP
   ↓
Entry QR
```

The system should avoid exposing sensitive guest information directly inside the QR code.

---

# 17. RSVP

Guests should be able to RSVP without creating an account.

Basic RSVP:

> Will you attend?

Options:

- Yes
- No
- Maybe

Additional fields:

- Number of attendees
- Selected events
- Food preference
- Accommodation requirement
- Transportation requirement

These fields should be configurable in future.

---

# 18. Event-Level RSVP

RSVP should work at the event level.

Example:

```text
Guest: Rahul

Haldi       → No
Sangeet     → Yes
Wedding     → Yes
Reception   → Yes
```

This allows accurate planning.

---

# 19. Guest Management

Wedding owners should have a centralized guest management system.

## Guest fields

- Name
- Email
- Phone (optional/future)
- Category
- Side
- RSVP status
- Number of attendees
- Events invited
- Entry status
- Invitation status
- Notes

---

# 20. Guest Categories

Guests can be categorized.

Examples:

### Relationship

- Family
- Friend
- Relative
- Colleague
- Other

### Wedding Side

- Bride side
- Groom side
- Common

### Priority

- VIP
- Regular

The system should allow custom categories later.

---

# 21. Guest Entry Management

The platform should support digital guest check-in.

## Flow

```text
Guest receives invitation
        ↓
RSVP
        ↓
Guest receives/accesses QR
        ↓
Arrives at wedding
        ↓
QR scanned
        ↓
Guest verified
        ↓
Entry recorded
```

---

# 22. Entry Dashboard

Organisers should be able to see:

- Total invited
- Total RSVP'd
- Total arrived
- Total pending
- Total declined

Example:

```text
Guests Invited:       500
Confirmed:            380
Maybe:                 40
Declined:              80
Checked In:            250
Yet to Arrive:         170
```

---

# 23. Manual Guest Entry

QR scanning should not be the only method.

Entry staff should be able to search:

```text
Search Guest
     ↓
Rahul Kumar
     ↓
Verify
     ↓
Mark Entry
```

This handles situations where:

- Phone battery is dead
- QR cannot be scanned
- Guest forgot their invitation

---

# 24. Organiser Management

MVP organiser model:

```text
Wedding Owner
      │
      └── Organisers
```

Organiser can be invited by email.

Organiser can:

- Login
- View assigned wedding
- View events
- Manage assigned tasks
- Update task status
- Assist with guests
- Upload photos
- Perform entry management if authorized

Advanced permission management can be added later.

---

# 25. Task Planner

The task planner helps couples coordinate wedding preparation.

Example:

```text
Task:
Book Photographer

Assigned To:
Rahul

Event:
Wedding

Due Date:
10 October

Priority:
High

Status:
In Progress
```

## Task fields

- Title
- Description
- Assignee
- Event
- Due date
- Priority
- Status
- Notes
- Attachments
- Created date
- Updated date

---

# 26. Task Status

Initial statuses:

```text
TODO
IN_PROGRESS
COMPLETED
```

Future:

```text
BLOCKED
CANCELLED
```

---

# 27. Reminders

Email reminders should be supported.

Examples:

### Guest reminder

> Your RSVP for Muni & Priya's wedding is still pending.

### Event reminder

> Muni & Priya's Wedding Ceremony starts tomorrow at 10:00 AM.

### Task reminder

> Your task "Book Photographer" is due tomorrow.

---

# 28. Wedding Website

Every wedding should receive a unique wedding website.

Example:

```text
makemymarriage.com/w/muni-and-priya
```

The website should automatically be generated from wedding data.

---

# 29. Wedding Website Sections

Recommended sections:

### Hero

```text
Muni ❤️ Priya

We're Getting Married

December 20, 2026
```

### Couple Story

A short story about the couple.

### Countdown

```text
82 Days
14 Hours
32 Minutes
```

### Events

Display all public events.

### Venue

Address + map.

### Schedule

Wedding timeline.

### Gallery

Approved photos.

### RSVP

Guest RSVP entry.

### Live Stream

Shown when enabled.

### Footer

Wedding message and platform branding.

---

# 30. Website Privacy Model

MakeMyMarriage should use a **hybrid privacy model**.

## Public

Potentially visible:

- Couple names
- Wedding date
- Public events
- Venue
- Couple story
- Approved gallery
- Countdown

## Private

Requires secure guest access:

- Guest-specific invitation
- RSVP
- Personal guest information
- Entry information
- Private content

The wedding owner should control which sections are public.

---

# 31. Photo Gallery

The wedding should have a centralized gallery.

Sources:

- Wedding owner
- Organisers
- Guests

---

# 32. Guest Photo Upload

Guests should be able to upload photos using a secure invitation-based link.

No account should be required.

Flow:

```text
Guest invitation
      ↓
"Share Your Moments"
      ↓
Upload Photos
      ↓
Moderation
      ↓
Approved
      ↓
Gallery
```

---

# 33. Photo Moderation

Guest-uploaded photos should not automatically become public.

Recommended flow:

```text
Uploaded
   ↓
Pending Review
   ↓
Approved / Rejected
   ↓
Gallery
```

Wedding owner/organiser can moderate photos.

This is especially important if the gallery is publicly visible.

---

# 34. Live Streaming

MakeMyMarriage should **not build its own streaming infrastructure in MVP**.

Instead, use external platforms.

Initial integration:

> YouTube Live

The wedding owner can add a YouTube Live URL.

The wedding website can display:

```text
LIVE NOW

[ Watch Live ]
```

---

# 35. Live Stream Access

The owner should be able to configure:

- Live stream enabled/disabled
- Public/private access
- Which event contains the stream

Future integrations:

- Additional streaming providers
- Native streaming infrastructure

---

# 36. Wedding Dashboard

The dashboard is the central control center.

## Dashboard should show

### Wedding overview

```text
Muni & Priya
Wedding Date
Countdown
```

### Events

```text
6 Events
```

### Guests

```text
428 Guests
```

### RSVP

```text
312 Confirmed
46 Maybe
70 Declined
```

### Tasks

```text
27 Pending
12 In Progress
34 Completed
```

### Invitations

```text
390 Sent
350 Opened
312 RSVP'd
```

### Entry

```text
276 Checked In
```

### Upcoming

Upcoming event/task reminders.

---

# 37. Dashboard Activity

Recent activity can include:

```text
Rahul RSVP'd for Wedding Ceremony.

Priya uploaded 5 photos.

Wedding invitation sent to 20 guests.

Task "Book Caterer" completed.

25 guests checked in.
```

This creates a centralized activity timeline.

---

# 38. Internationalization

The application should support:

```text
English
Hindi
Telugu
```

Language should be configurable at:

- User level
- Wedding level
- Guest-facing experience where possible

The architecture should use i18n rather than hardcoded UI text.

Future languages:

- Tamil
- Kannada
- Malayalam
- Marathi
- Bengali
- International languages

---

# 39. Responsive Design

The application should work across:

- Desktop
- Laptop
- Tablet
- Mobile browser

The guest experience should be **mobile-first**.

Reason:

Most guests will open invitations through their phones.

---

# 40. Guest Experience Principles

The guest should experience as little friction as possible.

Ideal flow:

```text
Receive Email
      ↓
Open Invitation
      ↓
View Wedding
      ↓
RSVP
      ↓
Receive/Access QR
      ↓
Attend Wedding
      ↓
Scan QR
      ↓
Upload Photos
      ↓
View Gallery
      ↓
Watch Live Stream
```

No unnecessary registration should be required.

---

# 41. Email System

Email should be a core communication mechanism.

Email types:

### Authentication

- Welcome email
- Password reset

### Invitations

- Wedding invitation
- Event invitation

### RSVP

- RSVP confirmation
- RSVP reminder

### Events

- Event reminder
- Schedule update

### Guest entry

- QR/invitation information

### Organisers

- Organiser invitation
- Task assignment

---

# 42. Notification Architecture

Notifications should be designed as an independent subsystem.

Conceptually:

```text
Application Event
       ↓
Notification Service
       ↓
Email Provider
```

Example:

```text
RSVP Created
     ↓
Notification Event
     ↓
Send Confirmation Email
```

This makes future channels easier to add:

```text
Email
SMS
WhatsApp
Push
```

without rewriting business logic.

---

# 43. Search

Wedding owners should be able to search:

- Guests
- Events
- Tasks
- Organisers

Guest search should support:

- Name
- Email
- Category
- RSVP status

---

# 44. Data Ownership

Each wedding's data must be logically isolated.

A user should only access weddings they are authorized to access.

Guest access should only expose information associated with the guest's secure invitation.

Security principle:

> **Never trust IDs supplied by the frontend for authorization.**

Authorization must always be verified on the backend.

---

# 45. Security Requirements

The application should implement:

- Password hashing
- Secure authentication
- Authorization
- Secure invitation tokens
- Secure QR tokens
- HTTPS
- Input validation
- Rate limiting
- CSRF protection where applicable
- Secure headers
- File upload validation
- File size limits
- Image type validation
- Access control
- Audit logging for sensitive actions

---

# 46. QR Security

QR codes should not contain:

```text
guest_id=123
wedding_id=45
```

Instead:

```text
Secure random token
```

The backend resolves the token.

This prevents users from manipulating IDs.

---

# 47. File Upload Security

For photos:

- Validate MIME type
- Validate file extension
- Limit file size
- Generate safe filenames
- Store outside application server where appropriate
- Generate thumbnails
- Prevent executable uploads
- Scan files where appropriate

---

# 48. Recommended High-Level Architecture

The architecture should remain modular.

Conceptually:

```text
                   ┌────────────────────┐
                   │      Frontend      │
                   │ React / Web App    │
                   └─────────┬──────────┘
                             │
                             ▼
                   ┌────────────────────┐
                   │       API          │
                   │   Backend Layer    │
                   └─────────┬──────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   Auth Module          Wedding Module       Guest Module
        │                    │                    │
        ▼                    ▼                    ▼
  Invitation Module    Event Module          RSVP Module
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                    ┌─────────────────┐
                    │    Database     │
                    └─────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
           Storage         Email        External Live
                                           Stream
```

The implementation technology can be finalized separately.

---

# 49. Recommended Technology Direction

A suitable implementation stack for the product would be:

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- i18next

## Backend

A modular API backend such as:

- FastAPI
- Python

or

- Spring Boot
- Java

The backend technology can be finalized during technical architecture.

## Database

- PostgreSQL

## Object Storage

For:

- Wedding images
- Invitation assets
- Guest photos

Use object storage rather than storing large files directly inside PostgreSQL.

## Email

Use a transactional email provider.

---

# 50. Core Database Entities

The initial database model should include entities approximately equivalent to:

```text
User
Wedding
WeddingMember
Event
Venue
Guest
GuestEvent
Invitation
InvitationTemplate
InvitationDelivery
RSVP
Organizer
Task
TaskAssignment
Reminder
Gallery
Photo
PhotoApproval
LiveStream
GuestAccessToken
GuestEntry
Notification
ActivityLog
```

The exact schema should be finalized during technical design.

---

# 51. Important Relationships

### User → Wedding

```text
User 1 ─── 1 Wedding
```

MVP.

Future:

```text
User 1 ─── N Weddings
```

---

### Wedding → Events

```text
Wedding 1 ─── N Events
```

---

### Wedding → Guests

```text
Wedding 1 ─── N Guests
```

---

### Event → Guests

Many-to-many:

```text
Event N ─── N Guest
```

through:

```text
GuestEvent
```

---

### Guest → RSVP

RSVP should be associated with the relevant event.

---

### Wedding → Organisers

```text
Wedding 1 ─── N Organisers
```

---

### Event → Tasks

Tasks can optionally belong to an event.

---

### Wedding → Gallery

```text
Wedding 1 ─── N Photos
```

Photos can optionally belong to an event.

---

# 52. MVP User Journey

## Wedding Owner

```text
Signup
 ↓
Create Wedding
 ↓
Wedding Setup
 ↓
Create Events
 ↓
Configure Wedding Website
 ↓
Add Guests
 ↓
Create Invitations
 ↓
Send Invitations
 ↓
Guests RSVP
 ↓
Monitor Dashboard
 ↓
Manage Tasks
 ↓
Manage Organisers
 ↓
Wedding Day
 ↓
Guest Check-in
 ↓
Live Stream
 ↓
Photo Sharing
```

---

# 53. Guest Journey

```text
Receive Email
 ↓
Open Secure Invitation
 ↓
View Invitation
 ↓
View Event Details
 ↓
RSVP
 ↓
Receive Confirmation
 ↓
Access QR
 ↓
Attend Wedding
 ↓
QR Check-in
 ↓
Upload Photos
 ↓
View Gallery
 ↓
Watch Live Stream
```

---

# 54. Organiser Journey

```text
Receive Organiser Invitation
 ↓
Login
 ↓
Access Wedding
 ↓
View Assigned Tasks
 ↓
Manage Tasks
 ↓
Assist Guest Management
 ↓
Assist Entry
 ↓
Upload Photos
```

---

# 55. MVP Feature Prioritization

## P0 — Essential

These features are required for the MVP.

- Authentication
- Wedding creation
- Wedding setup
- Multiple events
- Event management
- Guest management
- Guest/event relationship
- Digital invitations
- Invitation customization
- Email invitation delivery
- Secure guest links
- RSVP
- Wedding website
- Wedding dashboard
- Organiser management
- Task planner
- Email reminders
- QR guest entry
- Guest check-in
- Basic photo gallery
- English/Hindi/Telugu
- Responsive UI

---

## P1 — Important

- Guest photo uploads
- Photo moderation
- YouTube Live integration
- Activity timeline
- Advanced invitation templates
- Advanced dashboard statistics
- Public/private website controls
- Event-level customization

---

## P2 — Future

- Multiple weddings per user
- WhatsApp invitations
- SMS
- Push notifications
- Vendor marketplace
- Vendor profiles
- Vendor booking
- Payments
- Premium subscriptions
- Advanced analytics
- Native mobile applications
- Additional live-stream providers
- AI wedding assistant
- Smart guest recommendations
- Automated wedding planning

---

# 56. MVP Success Metrics

Since the initial product is free, focus on product adoption rather than revenue.

## Activation

- Signup → wedding creation rate
- Wedding creation → first event creation
- Wedding creation → first invitation

## Engagement

- Active wedding owners
- Events created per wedding
- Guests added per wedding
- Invitations sent
- RSVP completion rate
- Tasks completed

## Guest engagement

- Invitation open rate
- RSVP rate
- Wedding website visits
- QR check-ins
- Guest photo uploads

## Product usage

- Number of weddings created
- Number of events created
- Number of invitations sent
- Number of guests managed
- Number of photos uploaded

---

# 57. Key Product KPIs

The primary product health indicators should be:

```text
Wedding Creation Rate
Invitation Send Rate
RSVP Completion Rate
Guest Engagement Rate
Wedding Website Usage
Guest Check-in Usage
Photo Upload Usage
Task Completion Rate
```

---

# 58. Admin Requirements

A dedicated admin panel is **not required for MVP**.

However, the backend should maintain the ability to support administrative operations later.

Future admin capabilities:

- User management
- Wedding management
- Abuse reports
- Content moderation
- Template management
- System analytics
- Platform configuration

---

# 59. Scalability Strategy

Although MakeMyMarriage initially targets India, the architecture should avoid country-specific assumptions.

Avoid hardcoding:

- Currency
- Date formats
- Timezones
- Phone formats
- Languages
- Address formats

Instead, support:

```text
Country
Timezone
Locale
Currency
Language
```

This allows future expansion.

---

# 60. Internationalization Strategy

All user-facing strings should come from translation resources.

Example:

```text
/en
/hi
/te
```

Instead of:

```text
<button>Send Invitation</button>
```

Use translation keys:

```text
<button>
  {t("invitation.send")}
</button>
```

This makes future languages easier.

---

# 61. Future Multiple-Wedding Support

MVP:

```text
User
 ↓
One Wedding
```

Future:

```text
User
 ├── Wedding A
 ├── Wedding B
 └── Wedding C
```

Therefore, business logic should not assume globally:

```text
user_id → single wedding
```

The system should use explicit wedding context.

---

# 62. Future Monetization

MakeMyMarriage will initially be free.

Potential future monetization:

### Premium Templates

Paid invitation themes.

### Premium Wedding Websites

Advanced customization.

### Premium Storage

Additional photo/video storage.

### Premium Features

Advanced analytics and automation.

### Vendor Marketplace

Commission from vendors.

### Wedding Packages

One-time wedding packages.

No monetization should be required for MVP.

---

# 63. Future AI Opportunities

AI is not required for MVP but could become a major differentiator.

Potential features:

### AI Wedding Planner

```text
"I have 500 guests and a 3-day wedding.
Create my planning checklist."
```

### AI Task Generator

Automatically generate tasks from wedding events.

### AI Invitation Writer

Generate invitation messages.

### AI Schedule Generator

Generate event timelines.

### AI Guest Insights

Identify RSVP patterns and attendance estimates.

### AI Wedding Website Content

Generate couple stories and event descriptions.

These should remain future scope.

---

# 64. Edge Cases

The product should account for:

### Guest changes RSVP

Guest can update RSVP until the wedding owner closes RSVP.

### Duplicate guest

System should help detect duplicate email addresses.

### Invitation revoked

Wedding owner can invalidate a guest's invitation token.

### Guest invitation forwarded

Secure access should prevent unintended access where possible.

### Guest loses QR

Guest can reopen the secure invitation and retrieve the QR.

### Guest cannot scan QR

Manual guest search should be available.

### Event cancelled

Event status can be changed to:

```text
Scheduled
Cancelled
Completed
```

### Wedding date changed

All related reminders should update accordingly.

### Photo deleted

Owner/organiser can remove inappropriate photos.

---

# 65. Wedding Lifecycle

A wedding should have a lifecycle.

```text
DRAFT
 ↓
ACTIVE
 ↓
COMPLETED
 ↓
ARCHIVED
```

### DRAFT

Wedding is being configured.

### ACTIVE

Wedding is live and invitations/RSVPs are active.

### COMPLETED

Wedding has occurred.

### ARCHIVED

Historical wedding data is retained but no longer actively managed.

---

# 66. Event Lifecycle

```text
DRAFT
 ↓
SCHEDULED
 ↓
LIVE
 ↓
COMPLETED
```

or:

```text
CANCELLED
```

---

# 67. Invitation Lifecycle

```text
DRAFT
 ↓
SENT
 ↓
DELIVERED
 ↓
OPENED
 ↓
RSVP_COMPLETED
```

Possible states:

```text
FAILED
REVOKED
EXPIRED
```

---

# 68. Guest Entry Lifecycle

```text
NOT_ARRIVED
 ↓
CHECKED_IN
```

Optional:

```text
CHECKED_OUT
```

can be added later.

---

# 69. Photo Lifecycle

```text
UPLOADED
 ↓
PENDING_REVIEW
 ↓
APPROVED
```

or:

```text
REJECTED
```

---

# 70. Product Design Principles

## Principle 1 — Simplicity

Wedding owners should not need technical knowledge.

## Principle 2 — Mobile First

Guests primarily interact using mobile devices.

## Principle 3 — Beautiful by Default

Wedding products are emotional and visual.

## Principle 4 — Low Friction

Guests should not be forced to create accounts.

## Principle 5 — Privacy First

Guest and wedding information must be carefully protected.

## Principle 6 — Event-Centric

Every wedding consists of multiple independently manageable events.

## Principle 7 — Extensible

The architecture must support future vendors, payments, AI, multiple weddings, and international markets.

---

# 71. Example Complete Wedding

Consider:

```text
Muni & Priya
```

Wedding:

```text
Wedding Date:
20 December 2026
```

Events:

```text
15 Dec → Haldi
17 Dec → Mehendi
18 Dec → Sangeet
20 Dec → Wedding
21 Dec → Reception
```

Guests:

```text
500 invited
380 confirmed
40 maybe
80 declined
```

Tasks:

```text
Book Photographer
Book Caterer
Confirm Venue
Send Invitations
Finalize Decoration
Arrange Transportation
```

Wedding website:

```text
makemymarriage.com/w/muni-and-priya
```

Wedding day:

```text
500 invited
380 confirmed
250 checked in
```

Gallery:

```text
Couple photos
Organizer photos
Guest photos
```

Live stream:

```text
YouTube Live
```

This represents the complete MakeMyMarriage experience.

---

# 72. Recommended MVP Development Phases

## Phase 1 — Foundation

- Project setup
- Authentication
- User management
- Wedding setup
- Database foundation
- i18n

## Phase 2 — Events

- Event CRUD
- Venues
- Event schedules
- Event visibility

## Phase 3 — Guests

- Guest CRUD
- Categories
- Event assignment
- Guest import
- Guest search

## Phase 4 — Invitations

- Templates
- Customization
- Secure guest links
- QR generation
- Email delivery

## Phase 5 — RSVP

- RSVP forms
- Event-level RSVP
- RSVP dashboard
- Reminder emails

## Phase 6 — Wedding Website

- Public wedding website
- Couple story
- Events
- Venue
- Countdown
- RSVP
- Gallery

## Phase 7 — Planning

- Organisers
- Tasks
- Assignments
- Deadlines
- Reminders

## Phase 8 — Wedding Day

- Guest QR
- Guest check-in
- Entry dashboard
- Live stream integration

## Phase 9 — Gallery

- Photo uploads
- Guest uploads
- Moderation
- Gallery

## Phase 10 — Polish

- Responsive design
- Accessibility
- Security
- Performance
- Analytics
- Error handling
- Testing

---

# 73. Definition of MVP Success

The MVP should allow a couple to complete this entire journey:

```text
Signup
 ↓
Create Wedding
 ↓
Create Multiple Events
 ↓
Add Guests
 ↓
Customize Invitation
 ↓
Send Invitations
 ↓
Guests Open Invitations
 ↓
Guests RSVP
 ↓
Couple Tracks RSVP
 ↓
Couple Manages Tasks
 ↓
Organisers Help Manage Wedding
 ↓
Guests Arrive
 ↓
QR Check-in
 ↓
Photos Shared
 ↓
Live Stream
 ↓
Wedding Website Remains Available
```

If this journey works smoothly, MakeMyMarriage has achieved its core MVP objective.

---

# 74. Long-Term Product Vision

The long-term vision is to evolve MakeMyMarriage from a wedding management application into a complete wedding ecosystem.

```text
                    MakeMyMarriage
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Planning          Experience         Marketplace
        │                  │                  │
     Tasks              Website           Vendors
     Events             Gallery           Services
     Guests             Live Stream       Booking
     Invitations        Guest Experience  Payments
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                     AI Wedding
                       Assistant
```

The platform can eventually become the digital infrastructure connecting the couple, family, guests, organisers, and wedding service ecosystem.

---

# 75. Final Product Definition

### MakeMyMarriage is:

> **A free, multilingual digital wedding ecosystem that allows couples to create and manage their wedding, organize multiple events, send personalized digital invitations, collect RSVPs, manage guests, coordinate organisers and tasks, publish a wedding website, manage guest entry, share wedding memories, and provide a live wedding experience — all from one platform.**

### MVP Core:

```text
Auth
+
Wedding Setup
+
Multiple Events
+
Guests
+
Invitations
+
RSVP
+
Wedding Website
+
Organisers
+
Tasks
+
Reminders
+
QR Entry
+
Photo Gallery
+
Live Stream
+
Dashboard
```

### Future:

```text
Multiple Weddings
+
WhatsApp/SMS
+
Vendor Marketplace
+
Payments
+
Premium Plans
+
AI Wedding Planner
+
Advanced Analytics
+
International Expansion
```

**End of PRD — Version 1.0**