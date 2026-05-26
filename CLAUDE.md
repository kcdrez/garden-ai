# Garden AI — Agent Context File

This file provides project-wide context. Stack, conventions, and tooling details live in the directory-level files:

- Frontend: `/frontend/CLAUDE.md`
- Backend: `/backend/CLAUDE.md`

---

# 📓 Dev Log

The dev log lives at `/docs/devlog.md`. It is the canonical record of what was built and what's next.

## Intention

A lightweight session journal — one entry per work session, focused on what shipped. Not a design doc or a bug tracker; just enough signal for an AI agent (or the developer) to orient quickly at the start of the next session.

## Format

```
## YYYY-MM-DD — ~N hours

**Completed:**
- Short bullet describing what shipped

**Next up:** One-line summary of what to tackle next
```

## Time tracking

The devlog records session duration. Since the AI has no clock, time must come from the user:

- **Session start** — if the user doesn't mention a start time, ask before doing anything else
- **Session end** — if the user doesn't provide an end time when wrapping up, ask before writing the devlog entry
- **Pauses** — if the user mentions stepping away (lunch, break, etc.), ask for the pause time if not given; when they return, ask for the resume time; subtract all pauses from the total when calculating duration
- Calculate duration as: (end time − start time) − (sum of all pauses)

## Consumption (start of session)

At the start of every session, read the most recent devlog entry before doing anything else. Use it to:

- Understand what was just finished so you don't re-explain or redo it
- Pick up the **Next up** item as the default starting point if the user hasn't given a specific direction
- Cross-reference against the ✅ Completed list below if something seems missing

## Adding a new entry (end of session)

When the user says they are done or ending the session, do all of the following:

1. **Devlog** — append a new dated entry to `/docs/devlog.md` (newest first). Rules:
   - **Completed** bullets are high-level; skip internal refactors and tooling noise unless they unblock something
   - **Next up** is a single line, not a list — the most important thing to tackle next
2. **✅ Completed list** — if a major deliverable shipped this session, add it as a high-level bullet (feature or system, not implementation detail)
3. **📋 Planned list** — if anything completed this session was previously in the planned list, remove it

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

/frontend → React application (see /frontend/CLAUDE.md)
/backend → Django REST API (see /backend/CLAUDE.md)
/docs → Optional documentation
/CLAUDE.md → This file

---

# 🔐 Authentication

- Backend uses SimpleJWT for token-based auth
- Frontend stores tokens in localStorage and attaches via Axios interceptor
- All `/api/*` routes except auth endpoints require authentication
- Route protection is enforced via loader functions in the frontend router

---

# 🌱 Core Domain Model

Field definitions live in `models.py` and serializers — read the code directly. What follows are design decisions and non-obvious constraints that aren't visible from the code.

**Ownership** is enforced at the queryset level — users only see and modify their own gardens.

**User** has a `UserProfile` (auto-created via post_save signal) that stores `timezone`. Frontend sends browser timezone on login/register.

**Garden** `timezone` field _(planned)_ — IANA timezone name (e.g. "America/Denver"); when present, use this instead of the user's timezone for observation dates since the garden's physical location is the correct reference point.

**Plant catalog** is a global shared catalog (41 plants, seeded via data migration). All users reference the same entries. A hybrid global + user-created catalog is deferred unless needed.

**PlantPlacement / BedPlacement — grid convention:** the grid always uses square feet as the cell unit regardless of the bed/garden's display unit. Dimensions are converted to feet at render time (`in ÷ 12`, `cm ÷ 30.48`, `m × 3.28084`) and rounded up. Grid resolution is fixed at 1 ft × 1 ft per cell but the schema doesn't encode this — `x`, `y`, `width`, `height` are plain integers whose meaning is set by the rendering layer, so future sub-foot resolution requires only a data migration and renderer update.

**PlantPlacement** is decoupled from `UserPlant` so a plant can exist without a placement. Moving a `UserPlant` to a new bed (PATCH `bed`) automatically deletes its existing `PlantPlacement` — the plant arrives in the new bed unplaced.

**Resize protection:** resizing a garden is blocked if any `BedPlacement` would go out of bounds; resizing a bed is blocked if any `PlantPlacement` would go out of bounds. Errors surface as `non_field_errors`.

**UserPlant ↔ organism cardinality _(deferred)_:** 1 UserPlant = 1 PlantPlacement (deliberate simplification). A gardener planting 4 tomato seedlings should create 4 UserPlant records. Revisit if per-plant health tracking or harvest tracking makes this painful — options are a `quantity` field (pragmatic) or a child `PlantInstance` model (most expressive).

**Planned models** (design context only — fields in code when built):

- `Season` — groups planting by growing year; needed for crop rotation logic
- `PlantVariety` — distinguishes cultivars from species; field on UserPlant (simpler) vs separate model (needed for AI/catalog features) — decide before building
- `HarvestLog` — measurement record; may fold into `Observation` with a type field or stand alone
- `Task` — reminders with due date + completed flag; notification side handled by Celery
- `Photo` — image attachments; `GenericForeignKey` vs explicit nullable FKs — decide when building
- `AIConversation` — prompt/response log per user

---

# 🌐 API Conventions

- Base URL: `/api/`, auth endpoints at `/api/auth/*`
- All JSON field names are camelCase — converted automatically by `djangorestframework-camel-case`; Django serializers and models stay snake_case
- Timestamps in ISO 8601 format
- JWT access tokens expire in 5 minutes; the frontend silently refreshes on 401 and retries the original request
- Endpoint URLs and response shapes live in `urls.py` and serializers — read the code directly

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
- Follow the single responsibility principle — components and functions should do one thing; whenever a component or function is found to violate SRP (whether it's growing, being refactored, or just noticed), do NOT silently proceed — flag it, explain why it violates SRP, then ask the user whether to split it now or document it as a planned improvement; never perform an SRP-motivated refactor without explicit user confirmation

---

# 🌿 Features

## ✅ Completed

> High-level deliverables only. Implementation detail lives in the code and git history.

- User authentication — registration, login/logout, JWT tokens, silent refresh, protected routes
- Dark mode toggle — persisted to localStorage, synced with OS preference
- Full garden CRUD — list, detail page, create, edit, delete; responsive card grid
- Full garden bed CRUD — nested under gardens; detail page with metadata, layout grid, and plant list
- Full plant management — add/edit/delete plants per bed; move between beds; plant detail page (`/plants/:plantId`) with full timeline
- Plant catalog — global seeded catalog of 41 plants; searchable/filterable picker UI
- Observation timeline — per-plant event log (status changes, transplants, harvest, pest, weather, disease, general); auto-logged on status change and bed move
- Visual grid layouts — `BedGrid` for placing plants in a bed; `GardenGrid` for placing beds in a garden; shared `PlacementGrid` component; drag-and-drop placement added (`@dnd-kit/core`) with footprint highlighting and click-to-place dialog fallback
- All-entity flat list pages — `/beds` and `/plants` with full CRUD actions
- Dockerized local dev — frontend, backend, PostgreSQL via `docker compose up -d`
- Deployed to production — frontend on Vercel, backend + DB on Railway
- Backend tests — 86 tests at 99% coverage across all apps (gardens, plants, users); CI via GitHub Actions blocks merges on failure and enforces a 90% coverage floor
- Frontend unit tests — Vitest + React Testing Library; CI enforces 90% statements/functions/lines and 85% branches; 90.23% branch coverage achieved; tests colocated with components
- CI lint + type check gates — `ruff` (backend) and `eslint` + `tsc` (frontend) run on every PR via GitHub Actions
- Inline editing on detail pages — edit forms open in a slide-in Sheet drawer on Garden, Bed, and Plant detail pages; no page layout shift; `MovePlantDialog` retained as a dialog
- Observation editing — inline edit form in the timeline; edits `observed_date` and `note`; type is locked (delete and re-add for misclicks); note is editable on all types including `status_change` and `transplant`
- Forgot password — email-based reset flow; Resend SMTP (kcdrez.com domain); login accepts username or email; full test coverage

## 📋 Planned

### UI / Branding _(deferred — functionality first)_

- Branding pass — define a color palette, typography scale, and visual identity; the app is currently unstyled beyond Tailwind defaults; revisit once core functionality is stable

### Authentication & Accounts

- User profile (timezone, locale settings, first/last name)
- ~~Forgot password~~ ✅ shipped
- Social login (Google, Facebook, etc.) via `django-allauth` + `dj-rest-auth` — add alongside existing username/password auth, not as a replacement

### Garden Organization (core)

- Visual garden layout management
- Customizable garden dimensions and grids
- Drag-and-drop garden design interface _(the grid-based DnD is intentionally left as-is; do not invest further in polishing it — the grid system will eventually be replaced with a freeform canvas layout where items are positioned by pixel coordinates rather than snapping to a grid)_
- Garden templates and presets
- Export/import garden plans

### Plants

- Add plants to garden layouts
- Plant spacing guidance
- Plant growth and lifecycle tracking
- Seed starting and transplant planning
- Seasonal planting schedules

### Testing

- **Frontend e2e tests** — Playwright against the full local stack (Docker); cover critical paths: register, create garden/bed/plant, place plant on grid, add observation; run in CI on merge to `main`

### Deployment & Infrastructure

- Playwright e2e tests running in CI against the full stack
- Serve static/media files via S3
- Advanced AWS: RDS (managed PostgreSQL), ElastiCache (Redis), ECS/Fargate (containerized backend)
- **Semantic versioning** — separate FE and BE version numbers (e.g. `1.2.3`) displayed in the app footer; auto-incremented on every merge to `main` via GitHub Actions using `semantic-release` and conventional commits (`feat:`, `fix:`, `chore:`); FE version read from `package.json` at build time via Vite env var, BE version from a `VERSION` file or `pyproject.toml` exposed at `/api/version/`; frontend fetches BE version on load and renders both in a footer chip so it's easy to confirm a deploy went live without comparing SHAs
- **Preview environments per PR** — Vercel already creates a frontend preview URL per PR, but it points at prod backend so it only works for pure UI changes; full preview requires Railway PR Environments (ephemeral backend + DB per PR) wired together via a GitHub Action that sets `VITE_API_URL` on the Vercel preview to point at the Railway PR environment URL; needed for any PR that crosses the stack (new model, migration, endpoint, or serializer field)

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
