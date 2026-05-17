# Garden AI — Backend

Django REST API for the Garden AI project.

**Stack:** Python 3.12 · Django · Django REST Framework · PostgreSQL · SimpleJWT

---

## Running with Docker (recommended)

See the [root README](../README.md) for Docker setup. The backend starts automatically as part of `docker compose up -d` — migrations run on every container start via `entrypoint.sh`.

---

## Running without Docker

### 1. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy `.env.docker` to `.env` and update `DB_HOST=localhost` (and DB credentials to match your local Postgres instance).

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Start the dev server

```bash
python manage.py runserver
# or
make dev
```

---

## Useful commands

```bash
make dev          # run dev server
make migrate      # apply migrations
make migrations   # create new migrations
make shell        # open Django shell
```

Or via Docker:

```bash
docker compose exec backend python manage.py <command>
```

---

## Environment variables

Managed via `python-decouple`. Two env files exist:

| File | Used when |
|------|-----------|
| `.env` | Running Django directly on your machine |
| `.env.docker` | Running inside Docker (DB_HOST=db) |

---

## Tech stack

- Django 6
- Django REST Framework
- `djangorestframework-simplejwt` — JWT authentication
- `djangorestframework-camel-case` — converts snake_case responses to camelCase at the HTTP boundary
- `django-cors-headers` — CORS support
- `psycopg2-binary` — PostgreSQL driver
- `python-decouple` — environment variable management
- Celery + Redis — planned (background tasks)
