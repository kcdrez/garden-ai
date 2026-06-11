# Garden AI — Agent Context File

This file provides project-wide context. Stack, conventions, and tooling details live in the directory-level files:

- Frontend: `/frontend/CLAUDE.md`
- Backend: `/backend/CLAUDE.md`
- Production considerations: `/docs/production-notes.md` — shortcuts consciously taken for the portfolio context, and what would need to change for a real production app

---

# 📓 Dev Log

The dev log lives at `/docs/devlog.md`. At the start of every session, read the most recent entry before doing anything else — use it to understand what was just built and pick up the **Next up** item as the default starting point. To write a new entry at the end of a session, use `/devlog`.

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

**Garden** `orientation` field — integer (0–315, multiples of 45); the compass direction that "up" on the canvas layout corresponds to in the real world. 0 = north is up (standard), 90 = east is up, etc. Displayed as a compass rose above the garden canvas; editable via the create form ("Top of layout faces") and by clicking the compass rose.

**GardenBed** `orientation` field — integer (0–315°, multiples of 45); same format as `Garden.orientation`. Replaced the old string-based `facing` field (migration 0011 converted existing values). Displayed as a compass rose above the bed canvas; editable via the create form ("Top of bed faces") and by clicking the compass rose on the bed canvas. The edit form does not show orientation — the canvas compass rose is the canonical control.

**Plant catalog** is a global shared catalog (54 plants, seeded via data migration). All users reference the same entries. A hybrid global + user-created catalog is deferred unless needed.

**PlantPlacement / BedPlacement — grid convention:** the grid always uses square feet as the cell unit regardless of the bed/garden's display unit. Dimensions are converted to feet at render time (`in ÷ 12`, `cm ÷ 30.48`, `m × 3.28084`) and rounded up. Grid resolution is fixed at 1 ft × 1 ft per cell but the schema doesn't encode this — `x`, `y`, `width`, `height` are plain integers whose meaning is set by the rendering layer, so future sub-foot resolution requires only a data migration and renderer update.

**Width/length axis convention (critical for seed data and tests):** `width` is always the **horizontal** axis (columns, x) and `length` is always the **vertical** axis (rows, y) — for both `Garden` and `GardenBed`. This is enforced by `bedGridDimensions` and `gardenGridDimensions` in `frontend/src/lib/beds.ts` (`cols = width`, `rows = length`). When writing seed data or tests, always set `width` = how wide the bed/garden is left-to-right, and `length` = how deep it is top-to-bottom. Getting these backwards causes beds to overlap on the canvas and plants to overflow their beds.

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

> Full list lives in `/docs/completed.md`. Read it when you need to check whether something was already built.

## 📋 Planned

### UI / Branding _(deferred — functionality first)_

- Branding pass — define a color palette, typography scale, and visual identity; the app is currently unstyled beyond Tailwind defaults; revisit once core functionality is stable

### Canvas Enhancements

- **Canvas rotation remaining** — `BedPlacement`, `PlantPlacement`, and `GardenFeaturePlacement` have a `rotation` field (0–359°); items rotate visually on the canvas via SVG transform; resize is disabled when an item is rotated (resize + rotation coordinate math is deferred); `[`/`]` keyboard shortcuts rotate 45° steps; undo/redo not yet wired for rotation (only move/resize are tracked)
- **Multi-select (remaining)** — rubber-band drag to select a region; group resize; group clone; these were deferred from the initial multi-select implementation
- **Debounce item rotation** — pressing `[`/`]` rapidly fires a PATCH on every keypress; debounce the API call (same pattern as compass rose: local state updates immediately, mutation fires after ~600ms idle); implement after `useDebounce` hook is extracted
- **`useDebounce` hook + arrow key nudge batching** — extract a generic `useDebounce(fn, delay)` hook into `src/hooks/`; use it for compass orientation clicks (currently uses inline `useRef` + `setTimeout`), item rotation, and arrow key nudges (`usePlacementKeyboard`); nudge debouncing requires deciding whether rapid keypresses should collapse into one undo step (debounced) or remain one step per press (current) — resolve before wiring

### Authentication & Accounts

- Social login (Google, Facebook, etc.) via `django-allauth` + `dj-rest-auth` — add alongside existing username/password auth, not as a replacement

### Garden Organization (core)

- Visual garden layout management
- Customizable garden dimensions and grids
- Drag-and-drop garden design interface
- Garden templates and presets
- Export/import garden plans

### Plants

- Add plants to garden layouts
- Plant spacing guidance
- Plant growth and lifecycle tracking
- Seed starting and transplant planning
- Seasonal planting schedules
- **Garden-level plant placement (potted/container plants)** — allow placing a plant directly on the garden canvas without assigning it to a bed; use case: potted plants that move around the garden and don't belong to a fixed bed; design decision: (a) a special "container" bed type that acts as a moveable single-plant bed on the garden grid, or (b) a `UserPlant` with a nullable `bed` field and a new `GardenPlantPlacement` model attached directly to the garden — option (a) is lower schema impact but a conceptual hack; option (b) is cleaner but requires loosening the current bed-required constraint throughout the stack

### Demo & Portfolio

### Bug Fixes (tracked)

### Deployment & Infrastructure

- Serve static/media files via S3
- Advanced AWS: RDS (managed PostgreSQL), ElastiCache (Redis), ECS/Fargate (containerized backend)
- **Preview environments per PR** — Vercel already creates a frontend preview URL per PR, but it points at prod backend so it only works for pure UI changes; full preview requires Railway PR Environments (ephemeral backend + DB per PR) wired together via a GitHub Action that sets `VITE_API_URL` on the Vercel preview to point at the Railway PR environment URL; needed for any PR that crosses the stack (new model, migration, endpoint, or serializer field)

### Tracking & Journaling

- Garden notes and journaling
- **Harvest log** — deferred to design; harvest observations already work as freeform notes; structured quantity/unit data would require a separate `HarvestLog` model (not folding into `Observation` to avoid partial columns); revisit when yield aggregation is needed
- Yield estimation and tracking
- Image uploads for plant/garden tracking
- Progress photo timelines
- **Print/export garden layout** — export the canvas as PNG or PDF for printing and taking outside

### Garden Health

- Crop rotation tracking and recommendations — `Season` model (planned) groups plantings by year; flag beds where the same plant family is being repeated
- Pest and disease tracking
- Soil and nutrient tracking
- Fertilizing schedules and reminders
- Watering and irrigation planning
- Sunlight and shade mapping

### Planning & Reminders

- **Season / year view** — group plantings by growing year via the `Season` model (already planned); lets users see what was in each bed in prior years; foundation for crop rotation warnings. **Bed canvas year picker** — extend this to the bed canvas: a year picker renders the bed as it looked in that year (plants that were active — started before end of year, not removed before start of year); past years are read-only (no drag/resize); source of truth is either `start_date` + status change observations (buildable now) or the `Season` model (cleaner, decide before building); the placement query at `PlantPlacementViewSet` would need to accept an optional `year` param and filter accordingly
- Task management and reminders
- Notification system for gardening tasks
- Frost date awareness and seasonal guidance
- **Weather-aware observations** — when logging an observation, optionally attach current weather for the garden's location automatically (temperature, conditions); low-friction way to build a weather + plant health correlation log
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

- **Expand agentic tools to garden scope** — allow `add_plant` from a garden conversation by naming a target bed; garden scope currently has no write tools
- AI-powered garden recommendations
- AI-powered plant compatibility analysis
- AI-powered troubleshooting and diagnostics
- AI-powered layout optimization
- Vector search / RAG for plant knowledge retrieval

### Admin & Infrastructure

- Admin dashboard and moderation tools
- Role-based permissions
- Offline-friendly support
