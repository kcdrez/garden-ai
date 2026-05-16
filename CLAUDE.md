# Garden AI — Agent Context File

This file provides project-wide context. Stack, conventions, and tooling details live in the directory-level files:
- Frontend: `/frontend/CLAUDE.md`
- Backend: `/backend/CLAUDE.md`

---

# 🧠 Project Overview

Garden AI is a full-stack web application for managing and visualizing home garden layouts and plant data.

The long-term goal is to evolve into a system that can:

- manage garden layouts
- track plant growth and placement
- provide gardening recommendations (potential AI features later)

## Purpose & Context

This is primarily a **portfolio project** built to deepen experience across the full stack and support a job search. It may grow into something more, but learning and demonstrable depth are the primary goals.

**The developer brings:**
- 10+ years of frontend experience (primarily Vue)
- ~1.5 years of Django backend experience
- Little to no DevOps experience

**Learning goals for this project:**
- React (TypeScript) — applying existing frontend expertise in a new ecosystem
- Full-stack development — owning the entire feature lifecycle end-to-end
- DevOps — hands-on experience with deployment, CI/CD, and cloud infrastructure (Vercel + AWS)

**Implications for AI agents:**
- React patterns and idioms are a learning surface — prefer explaining non-obvious choices rather than just implementing them
- Django patterns may be familiar but assume React/TypeScript idioms are being actively learned
- DevOps tooling should be introduced gradually with clear rationale; don't assume prior AWS/CI knowledge

---

# 📁 Repository Structure

/frontend  → React application (see /frontend/CLAUDE.md)
/backend   → Django REST API (see /backend/CLAUDE.md)
/docs      → Optional documentation
/CLAUDE.md → This file

---

# 🔐 Authentication

- Backend uses SimpleJWT for token-based auth
- Frontend stores tokens in localStorage and attaches via Axios interceptor
- All `/api/*` routes except auth endpoints require authentication
- Route protection is enforced via loader functions in the frontend router

---

# 🌱 Core Domain Model

Fields marked *(planned)* exist in the schema design but are not yet built.

### User *(extended)*
Django's default User plus:
- timezone *(planned)*
- locale *(planned)*

### Garden
- id: UUID or AutoField
- name: string (required)
- description: text (optional)
- location: string *(planned)*
- hardiness_zone: string *(planned)*
- created_at: datetime (auto)
- updated_at: datetime (auto)
- owner: ForeignKey(User)

### GardenBed
- id: UUID
- garden: ForeignKey(Garden)
- name: string (required)
- length: positive integer (required)
- width: positive integer (required)
- depth: positive integer (optional — wall height for raised beds)
- unit: enum — `in`, `ft`, `cm`, `m` (default: ft)
- facing: enum — `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW` (optional)
- avg_sunlight_hours: positive integer 0–24 (optional)
- soil_type: string (optional — freeform, e.g. "loamy clay with amendments")
- notes: text (optional)
- created_at: datetime (auto)
- updated_at: datetime (auto)

### Plant *(planned)*
- common_name: string
- scientific_name: string
- requirements: text/JSON

### UserPlant *(planned)* — plant placement in a bed
- bed: ForeignKey(GardenBed)
- plant: ForeignKey(Plant)
- planted_date: date
- status: string

### Season *(planned)*
Groups planting activity by growing year/season. Enables crop rotation tracking and year-over-year comparisons. Without this, all UserPlants are a flat list scoped only by date, making rotation logic very difficult. Likely owned by a Garden.

### PlantVariety *(planned — design decision pending)*
Distinguishes cultivars ("Cherokee Purple", "Roma") from species ("Tomato"). Could be a field on `UserPlant` (simpler) or a separate model (required if AI or catalog features need variety-specific advice). Decide before building the plant catalog.

### Observation *(planned)*
A unified event log attached to a `UserPlant` or `GardenBed`. Covers pest sightings, watering notes, fertilizing events, and general journal entries — all share the same structure (date, note, type). Prevents proliferating separate models for each tracking feature.

### HarvestLog *(planned)*
Records individual harvest events with a quantity/weight measurement. Distinct from `Observation` because it's a measurement, not a note. Could fold into `Observation` with a type field, or stand alone — decide when building harvest tracking.

### Task *(planned)*
Reminders and to-dos optionally linked to a Garden, GardenBed, or UserPlant. Has a due date and a completed flag. The notification/scheduling side is handled by Celery (already planned).

### Photo *(planned)*
Generic image attachment linkable to multiple entity types (Garden, GardenBed, UserPlant). Implementation options: Django content type framework (`GenericForeignKey`) or explicit nullable FKs per entity — decide when building image uploads.

### AIConversation *(planned)*
- user: ForeignKey(User)
- prompt: text
- response: text

---

### Plant catalog ownership *(design decision)*
The `Plant` catalog is currently implied to be a global shared catalog (all users reference the same "Tomato" entry). This is the right default for AI features and companion planting data, but requires a curation/seeding strategy. A hybrid (global catalog + user-created custom varieties) is common but more complex — defer unless needed.

---

Ownership is enforced at the queryset level — users only see and modify their own gardens.

### Garden API contract

- `GET    /api/gardens/`                    → 200 `[{ id, name, description, created_at, updated_at, owner }]`
- `POST   /api/gardens/`                    → 201 `{ id, name, description, created_at, updated_at, owner }`
- `GET    /api/gardens/:id/`               → 200 `{ id, ... }`
- `PATCH  /api/gardens/:id/`               → 200 `{ id, ... }`
- `DELETE /api/gardens/:id/`               → 204

### GardenBed API contract

Nested under a garden — ownership enforced via the parent garden's owner check.

- `GET    /api/gardens/:id/beds/`          → 200 `[{ id, garden, name, length, width, depth, unit, facing, avg_sunlight_hours, soil_type, notes, created_at, updated_at }]`
- `POST   /api/gardens/:id/beds/`          → 201 `{ id, ... }`
- `GET    /api/gardens/:id/beds/:bedId/`   → 200 `{ id, ... }`
- `PATCH  /api/gardens/:id/beds/:bedId/`   → 200 `{ id, ... }`
- `DELETE /api/gardens/:id/beds/:bedId/`   → 204

---

# 🌐 API Conventions

- Base URL: `/api/`
- Auth endpoints: `/api/auth/*`
- Responses are JSON
- Timestamps in ISO 8601 format

---

# 🚧 Current Focus

> "Vertical Slice Development" — build full features end-to-end, avoid infrastructure work unless blocking, prioritize visible functionality over abstraction.

---

# 🏁 MVP Definition

The MVP is considered complete when:
- Users can create accounts and log in
- Users can manage gardens, beds, and plants
- AI recommendations are functional
- App is deployed publicly with HTTPS
- CI/CD pipeline is functional
- Dockerized local development works

---

# 🚫 Non-Goals

These are explicitly out of scope, at least initially:
- Kubernetes
- Microservices architecture
- Multi-tenant / enterprise support
- Complex AI agents or autonomous systems
- Real-time multiplayer collaboration
- Marketplace or ecommerce functionality

---

# ❌ Do NOT Do (for AI agents)

- Do not introduce new frameworks without explicit instruction
- Do not refactor architecture prematurely
- Do not add complex abstractions (CQRS, service layers, etc.)
- Do not add authentication complexity unless required
- Do not optimize prematurely

---

# ✅ Preferred AI Behavior

- Prefer small, incremental changes
- Preserve existing patterns unless broken
- Prioritize working end-to-end features
- Ask before introducing new dependencies
- Assume simplicity over scalability unless stated otherwise

---

# 🌿 Features

## ✅ Completed

- User authentication (login/logout, JWT tokens, protected routes)
- Dark mode toggle (persisted to localStorage, synced with OS preference)
- Create, delete, and view multiple gardens
- Edit existing gardens (name and description, via inline dialog)
- Garden list as responsive card grid
- Field-level server error mapping on forms
- Garden detail page (`/gardens/:id`) — dedicated page per garden
- Garden bed CRUD — create, edit, delete beds nested under a garden; beds display name, dimensions, facing, sunlight, soil type, and notes on the card

## 📋 Planned

### Authentication & Accounts
- User registration (create account)
- User profile (timezone, locale settings)

### Garden Organization (core)
- Visual garden layout management
- Customizable garden dimensions and grids
- Drag-and-drop garden design interface
- Garden templates and presets
- Export/import garden plans

### Plants
- Plant catalog and searchable plant database
- Add plants to garden layouts
- Plant spacing guidance
- Plant growth and lifecycle tracking
- Seed starting and transplant planning
- Seasonal planting schedules

### Deployment & Infrastructure
- Dockerize local development (Docker + Docker Compose for frontend, backend, PostgreSQL, Redis)
- Swap SQLite for PostgreSQL (required before any deployment)
- Deploy frontend to Vercel (connect git repo for automatic deploys)
- Deploy Django backend to AWS EC2 + Gunicorn + Nginx
- Serve static/media files via S3
- Configure environment variables and secrets management for production
- Set up CORS and allowed hosts for production domains
- CI/CD pipeline (GitHub Actions) for automated deploy on merge
- Playwright e2e tests running in CI against the full stack
- Advanced AWS: RDS (managed PostgreSQL), ElastiCache (Redis), ECS/Fargate (containerized backend)

### Tracking & Journaling
- Garden notes and journaling
- Harvest tracking
- Yield estimation and tracking
- Image uploads for plant/garden tracking
- Progress photo timelines

### Garden Health
- Companion planting recommendations
- Crop rotation tracking and recommendations
- Pest and disease tracking
- Soil and nutrient tracking
- Fertilizing schedules and reminders
- Watering and irrigation planning
- Sunlight and shade mapping

### Planning & Reminders
- Task management and reminders
- Notification system for gardening tasks
- Frost date awareness and seasonal guidance
- Weather-aware gardening insights
- Integration with external plant/weather data sources

### Discovery & Sharing
- Smart search and filtering
- Sharing gardens with other users
- Data visualization dashboards
- Garden analytics and historical trends

### Mobile App
- Port to iOS and Android using React Native (shared ecosystem with existing React codebase)
- Shared API layer and TypeScript types between web and mobile
- Native-feeling navigation and gestures
- Push notifications for gardening reminders and tasks
- Camera integration for plant/garden photo capture
- Offline-first support with sync when reconnected

### AI Integration
- OpenAI API integration (backend-controlled, not exposed directly to frontend)
- AI chat endpoint with conversation history (AIConversation model)
- Prompt builder and dynamic context assembly system
- AI-powered garden recommendations
- AI-powered plant compatibility analysis
- AI-powered troubleshooting and diagnostics
- AI-powered layout optimization
- Vector search / RAG for plant knowledge retrieval

### Admin & Infrastructure
- Admin dashboard and moderation tools
- Role-based permissions
- Offline-friendly support
