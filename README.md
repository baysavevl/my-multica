# my-multica

Personal Multica learning and control center extracted from the training fresher project.

The app is built for learning Multica step by step: lessons, demos, showcase notes, practice drills, a todo checklist, and a local Workbench for real CLI-backed actions.

## Structure

- `frontend/`: React + Vite UI, deployed to Vercel as a static app.
- `backend/`: local Spring Boot bridge for allowlisted `multica` CLI commands and Gemini Flash review.
- `docs/superpowers/specs/`: design notes for the control center and learning workbench.
- `docs/superpowers/plans/`: implementation plans used for larger changes.

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

The UI calls `/api/multica/*` and `/api/gemini/*`. For Vite, set `VITE_API_BASE_URL=http://localhost:8080` if you run the UI and bridge on separate ports.

## Gemini Flash

The Gemini assistant is intentionally limited to `gemini-2.5-flash`.

Local setup:

```bash
npm install -g @google/gemini-cli
export GEMINI_API_KEY=your_key_here
gemini -m gemini-2.5-flash
```

Start the Spring bridge after exporting the key. The backend also accepts `GOOGLE_API_KEY`. The in-process limit defaults to 20 Flash requests per day and can be changed with:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments=--gemini.flash.max-requests=10
```

Vercel serves the static learning UI. Real Multica commands and Gemini API calls require the local Spring bridge running on your machine.

## Verification

```bash
cd frontend && npm test && npm run build
cd backend && mvn test
```

Vercel deploys only the static frontend.
