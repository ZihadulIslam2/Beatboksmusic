# Project Case Study: BeatBoks Music 🎵

---

## 1. Executive Summary

**BeatBoks Music** is an enterprise-ready, multi-tenant digital music streaming and catalog management platform designed for individual music listeners, independent/signed artists, and organizations (e.g., gyms, retail chains, workspaces, hospitality).

The platform bridges the gap between consumer streaming experiences and B2B organizational sound management by introducing **multi-seat team subscriptions**, **catalog metadata management (Artists, Albums, Genres, Moods/Tags)**, and an **administrative operational dashboard**. Built on modern web architecture with NestJS, Next.js, MongoDB, Redis, Stripe, and Cloud/S3 storage, BeatBoks Music delivers low-latency playback, granular access governance, and scalable subscription billing.

---

## 2. Project Vision & Problem Statement

### The Problem
- **Music Licensing & Team Access Chaos:** Commercial establishments and businesses struggle with managing multi-seat music access. Consumer streaming accounts (Spotify, Apple Music) are strictly personal and lack multi-seat or organization billing governance.
- **Fragmented Catalog Management:** Independent labels, indie curators, and small enterprises lack intuitive tools to upload, tag, index, and distribute digital audio with rich metadata (mood tags, genres, albums, release years).
- **Complex Ingestion & Asset Delivery:** Streaming high-fidelity audio reliably requires decoupled, secure cloud storage (AWS S3 / Cloudinary) rather than hosting heavy binary payloads inside application servers.

### The Solution: BeatBoks Music
A 3-tier software ecosystem providing:
1. **User / Consumer Web App:** Seamless browsing, search, favorites, playlists, and synchronized playback.
2. **Organization / Multi-Seat Workspace:** Team subscription tiers allowing an organization owner to invite members, share seats, and monitor team licensing under a single corporate subscription.
3. **Comprehensive Admin Dashboard:** Real-time analytics, artist/album/song lifecycle management, user moderation, plan and subscription tracking.
4. **Resilient Backend Micro-Architecture:** NestJS REST API with rate-limiting, Redis queuing (BullMQ), Stripe webhook reconciliation, and Cloudinary/S3 asset distribution.

---

## 3. System Architecture & Tech Stack

The BeatBoks Music platform is architected as a modular monorepo separated into three core applications:

```
beatboksmusic/
├── backend/            # NestJS 11 REST API, Queue Workers, Mongoose ODM
├── frontend/           # Next.js 14 Web Streaming Application & Organization Portal
└── admin-dashboard/    # Next.js 15 (React 19) Operational & Analytics Control Center
```

### Comprehensive Technology Stack

| Layer | Technology | Details & Role |
| :--- | :--- | :--- |
| **Backend Framework** | **NestJS 11 + TypeScript** | Enterprise modular architecture, Dependency Injection, Pipes, Interceptors, Guards |
| **Database & ODM** | **MongoDB + Mongoose 8** | Flexible document storage, text indexing for search, schema-level hooks |
| **Cache & Queue** | **Redis + BullMQ** | Background workers for subscription jobs, email notifications, playback tracking |
| **Authentication** | **JWT (Access + Refresh) & NextAuth** | Stateless RBAC (USER, ADMIN, ORG_ADMIN), OTP-based account recovery |
| **Media Storage** | **Cloudinary / AWS S3** | Secure audio asset streaming keys, CDN-backed album/artist cover image pipelines |
| **Payment Gateway** | **Stripe API & Webhooks** | Recurring subscriptions, checkout sessions, auto seat validation & prorations |
| **Consumer Frontend** | **Next.js 14 (App Router) + React 18** | SSR/SSG music catalog, TanStack Query, Radix UI primitives, Tailwind CSS |
| **Admin Dashboard** | **Next.js 15 (App Router) + React 19** | Modern admin UI, Turbopack, Recharts visual analytics, Leaflet, Tailwind CSS |
| **Containerization** | **Docker & Docker Compose** | Reproducible multi-service deployment with isolated environments |

---

## 4. Key Features & Core Capabilities

### A. Listener & Streaming Experience (`frontend`)
- **Rich Music Discovery:** Curated home feeds featuring popular artists, trending albums, top charts, and newly released tracks.
- **Universal Text Search:** MongoDB text-indexed search across tracks, artists, genres, and tag taxonomies.
- **Custom Playlists & Favorites:** Users can curate personal playlists, bookmark favorite tracks, and organize listening queues.
- **Audio Stream Integrity:** High-bitrate audio streaming with persistent playback controls and responsive media layouts.

### B. B2B & Organization Management (`modules/organization`)
- **Multi-Seat Subscriptions:** Dynamic seat allocation (`maxSeats` vs `usedSeats`) linked to purchased plan tiers.
- **Seat Invitations & Verification:** Secure invite code generation (`orgCode`) allowing team members to join corporate-licensed workspaces.
- **Organization Hierarchy:** Owner role governance, team member listing, and member revocation tools.

### C. Admin & Operations Control Plane (`admin-dashboard`)
- **Catalog Lifecycle Management:** CRUD operations on Songs, Artists, Albums, Genres, and Mood Tags with instant image/audio preview.
- **Subscription & Plan Engine:** Stripe price synchronization, dynamic tier pricing, feature flag toggles, and subscriber status monitoring.
- **Metrics & Activity Insights:** Play count counters, user registration analytics, revenue charts, and operational audit logs.

### D. Resilient Backend Core (`backend`)
- **Role-Based Access Control (RBAC):** Custom decorators (`@Public()`, `@Roles()`, `@CurrentUser()`) and global guards enforcing zero-trust API security.
- **Unified Response & Error Handling:** Interceptors and exception filters standardizing API responses:
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Operation successful",
    "data": { ... }
  }
  ```
- **Asynchronous Task Processing:** Queued background workers via Redis/BullMQ to prevent blocking user-facing requests during payment webhooks and audio ingestion.

---

## 5. Architectural Diagram

```
                 ┌────────────────────────────────────────────────────────┐
                 │                       CLIENTS                          │
                 ├──────────────────────────┬─────────────────────────────┤
                 │  frontend (Next.js 14)   │ admin-dashboard (Next.js 15)│
                 │  - Listeners & Users     │ - Catalog Curators          │
                 │  - Organization Portals  │ - Platform Admins           │
                 └────────────┬─────────────┴──────────────┬──────────────┘
                              │                            │
                              │ HTTPS / REST / JWT         │
                              ▼                            ▼
                 ┌────────────────────────────────────────────────────────┐
                 │              BEATBOKS BACKEND API (NestJS 11)          │
                 ├────────────────────────────────────────────────────────┤
                 │ Global Pipes (class-validator) • Rate-Limiting Throttler│
                 │ Auth Guards (JWT + RBAC) • Response Standardizer       │
                 └──────┬───────────────┬───────────────────┬─────────────┘
                        │               │                   │
         ┌──────────────▼──────┐ ┌──────▼───────┐    ┌──────▼───────┐
         │      MongoDB        │ │ Redis/BullMQ │    │ Third-Party  │
         ├─────────────────────┤ ├──────────────┤    ├──────────────┤
         │ • Users & Orgs      │ │ • Job Queue  │    │ • Stripe API │
         │ • Tracks & Albums   │ │ • Sub Worker │    │ • Cloudinary │
         │ • Playlists & Tags  │ │ • Email Q    │    │ • AWS S3     │
         └─────────────────────┘ └──────────────┘    └──────────────┘
```

---

## 6. Engineering Challenges & Solutions

| Challenge | Impact | Implemented Solution |
| :--- | :--- | :--- |
| **Stripe Webhook Concurrency** | Race conditions during asynchronous payment lifecycle events (invoices, customer subscriptions). | Decoupled webhook ingestion with a BullMQ `SubscriptionProducerService` queue, processing events sequentially with idempotency. |
| **Large Audio Ingestion & Playback** | Heavy file uploads causing API bottlenecks and memory spikes. | Offloaded media streaming storage to Cloudinary and AWS S3 with signed keys; API stores only asset keys, durations, and metadata. |
| **B2B Multi-Seat Allocation** | Risk of organization over-subscription beyond contracted seats. | Implemented atomic seat updates (`usedSeats` checks) at schema level before granting membership access via `orgCode`. |
| **Search Latency Across Deep Catalogs** | Slow query times across millions of songs, artists, and genres. | Created composite and text indexes on `name` fields in MongoDB, with lean projection fields for high-concurrency read queries. |

---

## 7. Results & Key Impact

- **End-to-End Modular Architecture:** Decoupled separation of consumer, administrator, and backend systems allows independent scaling and continuous deployment.
- **Enterprise-Grade Foundation:** Role-based multi-tenancy ensures business scalability from individual audiophiles to enterprise multi-seat licenses.
- **Production-Ready Observability:** Structured logging, centralized error tracking, health check probes (`/health`), and automated API validation.

---

## 8. Future Roadmap

1. **Lossless Audio Streaming:** Implementation of HLS (HTTP Live Streaming) adaptive bitrate streaming (m3u8/AAC).
2. **AI-Driven Playlist Generation:** Contextual audio recommendations based on user listening habits, tempo, and mood tags.
3. **Offline Mobile Experience:** Native React Native / PWA offline caching for encrypted tracks.
4. **Royalty & Artist Payouts:** Automated payout calculation engine for signed creators based on validated play counts.
