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

**Plant catalog** is a global shared catalog (41 plants, seeded via data migration). All users reference the same entries. A hybrid global + user-created catalog is deferred unless needed. **Pending addition:** Blackberry — needs to be added to the catalog via a new data migration.

**PlantPlacement / BedPlacement — grid convention:** the grid always uses square feet as the cell unit regardless of the bed/garden's display unit. Dimensions are converted to feet at render time (`in ÷ 12`, `cm ÷ 30.48`, `m × 3.28084`) and rounded up. Grid resolution is fixed at 1 ft × 1 ft per cell but the schema doesn't encode this — `x`, `y`, `width`, `height` are plain integers whose meaning is set by the rendering layer, so future sub-foot resolution requires only a data migration and renderer update.

**PlantPlacement** is decoupled from `UserPlant` so a plant can exist without a placement. Moving a `UserPlant` to a new bed (PATCH `bed`) automatically deletes its existing `PlantPlacement` — the plant arrives in the new bed unplaced.

**Resize protection:** resizing a garden is blocked if any `BedPlacement` would go out of bounds; resizing a bed is blocked if any `PlantPlacement` would go out of bounds. Errors surface as `non_field_errors`.

**UserPlant ↔ organism cardinality:** 1 UserPlant = 1 plant = 1 PlantPlacement. A gardener planting 4 onions creates 4 UserPlant records — intentional so each plant has its own observation timeline (disease, harvest, etc.). A `quantity` field was considered and rejected for mature plants because it prevents per-plant health tracking; quantity is only appropriate for bulk seed starting where individual tracking isn't needed yet. Sub-foot canvas resolution (e.g., a 4-inch onion smaller than 1×1 ft on the grid) is deferred — the schema supports it but the renderer currently treats 1 unit = 1 ft minimum.

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
- Visual canvas layouts — `BedGrid` for placing plants in a bed; `GardenGrid` for placing beds in a garden; shared `PlacementCanvas` SVG component; freeform drag-and-drop via pointer capture with items positioned in feet coordinates; click-to-place dialog fallback; migrated from prior grid-based `@dnd-kit/core` system
- All-entity flat list pages — `/beds` and `/plants` with full CRUD actions
- Dockerized local dev — frontend, backend, PostgreSQL via `docker compose up -d`
- Deployed to production — frontend on Vercel, backend + DB on Railway
- Backend tests — 86 tests at 99% coverage across all apps (gardens, plants, users); CI via GitHub Actions blocks merges on failure and enforces a 90% coverage floor
- Frontend unit tests — Vitest + React Testing Library; CI enforces 90% statements/functions/lines and 85% branches; 90.23% branch coverage achieved; tests colocated with components
- CI lint + type check gates — `ruff` (backend) and `eslint` + `tsc` (frontend) run on every PR via GitHub Actions
- Inline editing on detail pages — edit forms open in a slide-in Sheet drawer on Garden, Bed, and Plant detail pages; no page layout shift; `MovePlantDialog` retained as a dialog
- Observation editing — inline edit form in the timeline; edits `observed_date` and `note`; type is locked (delete and re-add for misclicks); note is editable on all types including `status_change` and `transplant`
- Forgot password — email-based reset flow; Resend SMTP (kcdrez.com domain); login accepts username or email; full test coverage
- Plant UX improvements — bulk create (quantity spinner, N records per submit), add-new-plant wizard step in placement dialog, observation date bug fixed (auto-logged observation uses `startDate` instead of today)
- Canvas context menu — `...` hover button on placement items in `BedGrid` and `GardenGrid`; BedGrid: Edit/Move/Delete (deleteUserPlant with confirm); GardenGrid: Go to bed / Remove from layout; SVG button with virtual anchor pattern (menu rendered outside SVG, positioned via `getBoundingClientRect`)
- User profile page — `/profile` with inline edit form (first name, last name, email, timezone); backend `UserProfileSerializer` combines `User` + `UserProfile` fields in one endpoint; NavBar account dropdown links to it
- AI integration — OpenAI-powered chat at garden/bed/plant scope; `AIConversation` + `AIMessage` models; context builder serializes garden hierarchy into system prompt; conversation history (last 20 msgs); global floating chat widget with per-entity history and markdown rendering
- Clone a plant — duplicate a `UserPlant` (same bed, catalog entry, status, start date, notes); backend `clone` action on `UserPlantViewSet`; available from canvas context menu, bed plant list, all-plants list, and plant detail page; `usePlantActions` hook centralises clone/delete/edit/move logic shared by `PlantItem` and `PlantDetailHeader`
- Canvas context menu hit area fix — SVG `<g>` wrapper on the `...` button was creating a bounding-box hit area larger than the visible circle; fixed by removing the wrapper and conditionally rendering flat sibling circles with no explicit `pointer-events`
- Bed detail refactor — `PlantListSection` removed; bed detail page is canvas-only; `PlantObservationsSheet` (Sheet wrapping `PlantTimeline`) opens from canvas context menu "Observations" item preserving spatial context; canvas menu extended with View Details, Observations, Remove from Bed, and Clone (auto-places clone adjacent to source at `x + width`, clamped by backend); unplaced plants section promoted with `h2` heading, zero state message, "Create Plant" button, and per-chip actions menu (Edit / Clone / Move to Another Bed / Delete)
- Resize plant on canvas — drag handle in bottom-right corner of each placed item; dragging resizes the placement live and commits on release; plant visual is an ellipse that fills the bounding box; `lostpointercapture` handles out-of-window release; backend PATCH already supported width/height
- Observation list on `/plants` — "Observations" action in `CardActionsMenu` opens `PlantObservationsSheet` per plant without navigating away from the list
- Plant canvas icons — `plantEmoji()` maps 41 catalog plants to emoji with category fallbacks; `plantImage()` supports custom PNG assets (drop in `src/assets/garden_icons/`, add to `PLANT_IMAGES` in `src/lib/plants.ts`); Ideogram prompt and priority list of shared-emoji plants documented in the file; tomato and squash done

## 📋 Planned

### UI / Branding _(deferred — functionality first)_

- Branding pass — define a color palette, typography scale, and visual identity; the app is currently unstyled beyond Tailwind defaults; revisit once core functionality is stable

### Authentication & Accounts

- Social login (Google, Facebook, etc.) via `django-allauth` + `dj-rest-auth` — add alongside existing username/password auth, not as a replacement

### Garden Organization (core)

- Visual garden layout management
- Customizable garden dimensions and grids
- Drag-and-drop garden design interface
- Garden templates and presets
- Export/import garden plans
- Sort order for beds and gardens — user-controlled sort (alphabetical, date created, custom/manual drag order, etc.); persisted per user

### Plants

- Add plants to garden layouts
- Plant spacing guidance
- Plant growth and lifecycle tracking
- Seed starting and transplant planning
- Seasonal planting schedules

### Bug Fixes (tracked)

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
- **Migrate plant emoji to backend** — currently a frontend-only `plantName → emoji` map in `src/lib/plants.ts`; move to an `emoji` field on the `Plant` model (data migration) so mobile clients get it from the API without a separate mapping

### AI Integration

- ~~OpenAI API integration (backend-controlled, not exposed directly to frontend)~~ ✅ shipped
- ~~AI chat endpoint with conversation history (AIConversation model)~~ ✅ shipped
- ~~Prompt builder and dynamic context assembly system~~ ✅ shipped
- Rate limiting / per-user message quotas (basic daily cap + input length validation)
- AI-powered garden recommendations
- AI-powered plant compatibility analysis
- AI-powered troubleshooting and diagnostics
- AI-powered layout optimization
- Vector search / RAG for plant knowledge retrieval

### Admin & Infrastructure

- Admin dashboard and moderation tools
- Role-based permissions
- Offline-friendly support
