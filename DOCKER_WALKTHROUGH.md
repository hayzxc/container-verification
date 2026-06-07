# Docker Walkthrough Guide

This guide explains how to run the entire Container Verification stack using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

## Starting the Stack

To build and start all services in the background, run the following command from the root directory:

```bash
docker compose -f infra/docker-compose.yml up --build -d
```

This will start:
- **PostgreSQL** (container-postgres) on port 5432
- **Redis** (container-redis) on port 6379
- **MinIO** (container-minio) on ports 9000 (API) and 9001 (Console)
- **API** (container-api) on port 3001
- **Web** (container-web) on port 3000

## Database Management

Since the API runs inside a container, you need to execute Prisma commands via `docker exec`.

### Running Migrations

To apply database migrations:

```bash
docker exec -it container-api npx prisma migrate deploy
```

*Note: Use `migrate dev` if you are in a development environment and need to create new migrations.*

### Seeding the Database

To seed the database with initial data:

```bash
docker exec -it container-api npm run seed
```

## Viewing Logs

To see the logs for all services:

```bash
docker compose -f infra/docker-compose.yml logs -f
```

To see logs for a specific service (e.g., api):

```bash
docker compose -f infra/docker-compose.yml logs -f api
```

## Stopping the Stack

To stop and remove the containers:

```bash
docker compose -f infra/docker-compose.yml down
```

To also remove volumes (WARNING: this deletes your database data):

```bash
docker compose -f infra/docker-compose.yml down -v
```
