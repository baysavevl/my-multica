# my-multica

Personal Multica control center extracted from the training fresher project.

## Structure

- `frontend/`: React + Vite UI, deployed to Vercel as a static app.
- `backend/`: local Spring Boot bridge for allowlisted `multica` CLI commands.
- `docs/superpowers/specs/`: design notes for the control center.

## Local Development

Run the UI:

```bash
cd frontend
npm ci
npm run dev
```

Run the local bridge:

```bash
cd backend
mvn spring-boot:run
```

The UI calls `/api/multica/*`. For Vite, set `VITE_API_BASE_URL=http://localhost:8080` if you run the UI and bridge on separate ports.

## Verification

```bash
cd frontend && npm test && npm run build
cd backend && mvn test
```

Vercel deploys only the static frontend. Real Multica commands require the local Spring bridge running on your machine.
