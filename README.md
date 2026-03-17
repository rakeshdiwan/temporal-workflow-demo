# Temporal Order Workflow Demo

Local demo of Temporal workflow orchestration using Node.js, React, PostgreSQL, and Docker.

## Stack

- **Backend**: Node.js + Express + Temporal client
- **Worker**: Temporal Node SDK workflows + activities (PostgreSQL persistence)
- **Frontend**: React + Vite dashboard
- **Infra**: PostgreSQL, Temporal server, Temporal UI, Docker Compose

## Running locally (Docker)

```bash
docker compose up --build
```

Then open:

- Backend API / Swagger: `http://localhost:4000/api/docs`
- React dashboard: `http://localhost:5173`
- Temporal UI: `http://localhost:8080`

# Temporal Order Workflow Demo

Local demo of Temporal workflow orchestration using Node.js, React, PostgreSQL, and Docker.

## Stack

- **Backend**: Node.js + Express + Temporal client
- **Worker**: Temporal Node SDK workflows + activities (PostgreSQL persistence)
- **Frontend**: React + Vite dashboard
- **Infra**: PostgreSQL, Temporal server, Temporal UI, Docker Compose

## Running locally (Docker)

```bash
docker compose up --build
```

Then open:

- Backend API / Swagger: `http://localhost:4000/api/docs`
- React dashboard: `http://localhost:5173`
- Temporal UI: `http://localhost:8080`

## Demo Scenarios

See `docs/DEMO_SCENARIOS.md` for step‑by‑step flows including:

- Successful order from creation to completion
- Simulated activity failures and automatic retries
- Worker restart recovery
- Workflow versioning (patched vs non‑patched runs)

