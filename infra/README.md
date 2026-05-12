# Infrastructure

Stage 1 provides local dependencies for development:

- PostgreSQL 16 for transactional data.
- Redis 7 for cache and future async processing queues.
- MinIO as an S3-compatible object store for original and derived analysis files.

Copy `.env.example` to `.env` for local app settings. Environment-specific examples live in
`infra/env/`; real staging values must be provided through GitHub Actions secrets or the target
platform secret manager, not committed files.

Start local services:

```bash
docker compose up -d
```

Stop local services:

```bash
docker compose down
```
