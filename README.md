# Garden AI

A full-stack web application for managing and visualizing home garden layouts and plant data.

**Stack:** React (TypeScript) + Django REST Framework + PostgreSQL

---

## Local Development

Docker is the recommended way to run the full stack locally. One command starts the frontend, backend, and database together.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Start everything

```bash
docker compose up -d
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:8000/api    |
| Admin    | http://localhost:8000/admin  |

### Stop everything

```bash
docker compose down
```

Data is persisted in a Docker volume — stopping containers does not wipe the database.

### View logs

```bash
docker compose logs -f           # all services
docker compose logs -f backend   # one service
```

### Common management commands

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell
```

### Rebuild after dependency changes

If you add packages to `requirements.txt` or `package.json`, rebuild the affected image:

```bash
docker compose build backend
docker compose build frontend
docker compose up -d
```

---

## Deployment

| | Service | URL |
|--|---------|-----|
| Frontend | Vercel | https://garden-ai-gamma.vercel.app |
| Backend | Railway | https://garden-ai-production-6a57.up.railway.app |

Both services auto-deploy on push to `main`. The frontend reads `VITE_API_URL` (set in Vercel) to know where to reach the backend.

---

## Project Structure

```
/frontend   React application
/backend    Django REST API
/docs       Dev log and documentation
```

See [frontend/README.md](frontend/README.md) and [backend/README.md](backend/README.md) for stack details and running without Docker.
