# Garden AI — Agent Context File

This file provides structured context for AI agents working in this repository.

It defines architecture, conventions, and expected behavior so AI tools can safely contribute without breaking project patterns.

---

# 🧠 Project Overview

Garden AI is a full-stack web application for managing and visualizing home garden layouts and plant data.

The long-term goal is to evolve into a system that can:

- manage garden layouts
- track plant growth and placement
- provide gardening recommendations (potential AI features later)

---

# 🏗️ Tech Stack

## Frontend

- React (TypeScript)
- Vite
- Axios for API calls
- ESLint + Prettier for linting/formatting

## Backend

- Python 3.x
- Django
- Django REST Framework (DRF)
- SQLite (dev)

## Tooling

- Ruff (Python linting + autofix)
- Black (Python formatting)
- Prettier (frontend formatting)
- ESLint (frontend linting)

---

# 📁 Repository Structure

/frontend → React application
/backend → Django REST API
/docs → optional documentation
/AGENTS.md → AI context file (this file)

---

# 🔐 Authentication

- Backend uses token-based authentication (DRF TokenAuth or SimpleJWT depending on setup stage)
- Frontend stores token client-side and attaches via Axios headers
- All `/api/*` routes (except auth endpoints) require authentication

---

# 🌱 Core Domain Model (Current)

### Garden (expanded schema)

- id: UUID (preferred) or AutoField (integer)
  - use UUIDField on Django model if acceptable; otherwise AutoField is fine for now
- name: string (required)
- description: text (optional)
- created_at: datetime (auto_now_add=True)
- updated_at: datetime (auto_now=True)
- owner: ForeignKey(User, related_name="gardens", on_delete=CASCADE)

Notes:

- Owner determines access/ownership. All API endpoints for gardens should enforce that users only list/modify their own gardens (filter by owner).
- Prefer UUID for public-facing IDs, but AutoField is acceptable during early dev.
- Timestamps should be included in serializers and returned in ISO 8601 format.

API contract (example)

- GET /api/gardens/ -> 200 [{ id, name, description, created_at, updated_at, owner }]
- POST /api/gardens/ -> 201 { id, name, description, created_at, updated_at, owner }
- GET /api/gardens/:id -> 200 { id, ... }
- PATCH/PUT /api/gardens/:id -> 200 { id, ... }
- DELETE /api/gardens/:id -> 204

Example response:
{
"id": "b6d2f9b2-3a5f-4f55-8a2d-1f2d6e6a9a3b",
"name": "Front Yard",
"description": "Herb patch near the porch",
"created_at": "2026-05-13T12:34:56Z",
"updated_at": "2026-05-13T12:34:56Z",
"owner": 1
}

Implementation checklist (next steps)

- Backend:
  - Add Garden model (UUIDField or AutoField, name, description, created_at, updated_at, owner FK).
  - Create DRF Serializer exposing the fields above.
  - Create a ViewSet (ModelViewSet) registered under /api/gardens/ that filters queryset by request.user (owner).
  - Add migrations and run them.
  - Ensure auth is required for garden endpoints.
- Frontend:
  - Add Garden types in the api layer.
  - Update api client to use /api/gardens/ endpoints (already used in App).
  - Implement forms for Create / Edit and list view components.
  - Ensure token is attached via Axios interceptor and responses are resilient to empty arrays/partial data.

---

# 🌐 API Conventions

- Base URL: `/api/`
- Auth endpoints: `/api/auth/*`
- REST style endpoints:
  - GET `/gardens`
  - POST `/gardens`
  - GET `/gardens/:id`
  - PUT/PATCH `/gardens/:id`
  - DELETE `/gardens/:id`

Responses are JSON.

---

# 🎯 Frontend Conventions

- Feature-based structure preferred over type-based structure
- API calls go through a dedicated `api/` layer
- Auth token must be included in Axios interceptor
- UI should assume backend may return empty arrays or partial data

---

# 🧪 Backend Conventions

- Use Django REST Framework ViewSets where possible
- Serializers define all API output
- Keep business logic out of views when possible
- Avoid fat models early — keep domain simple until complexity demands it

---

# 🧹 Code Quality Rules

## Frontend

- ESLint must pass before commit (manual or CI)
- Prettier is the source of truth for formatting

## Backend

- Ruff used for linting + autofix
- Black used for formatting

---

# 🚧 Current Focus (IMPORTANT)

The current development phase is:

> “Vertical Slice Development”

Meaning:

- build full features end-to-end
- avoid infrastructure work unless blocking
- prioritize visible functionality over abstraction

---

# ❌ Do NOT Do (for AI agents)

- Do not introduce new frameworks without explicit instruction
- Do not refactor architecture prematurely
- Do not add complex abstractions (CQRS, service layers, etc.)
- Do not add authentication complexity unless required
- Do not optimize prematurely

---

# ✅ Preferred AI Behavior

AI agents should:

- prefer small, incremental changes
- preserve existing patterns unless broken
- prioritize working end-to-end features
- ask before introducing new dependencies
- assume simplicity over scalability unless stated otherwise

---

# 🧭 Next Feature Direction

Current recommended next step:

> Implement full Garden CRUD flow (backend + frontend)

This includes:

- Create Garden form
- Garden list view
- API integration end-to-end
