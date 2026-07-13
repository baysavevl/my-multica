# Multica Learning And Gemini Design

## Context

`my-multica` is a personal Multica control center with a React/Vite frontend, a local Spring Boot bridge, and a production static Vercel deployment. The current app can inspect local Multica daemon status, runtimes, agents, projects, repos, issues, and command logs through allowlisted CLI calls.

The next version should become a complete learning workbench for understanding Multica and practicing safe agent workflows. It should also connect to Gemini in a controlled way: app-side Gemini assistant first, Flash model only, and a setup guide for Gemini CLI / Multica runtime profile connection.

## Product Goal

Build a clean, beautiful, easy-to-use Multica learning workbench with:

- A structured curriculum for everything a developer needs to know to use Multica locally.
- Each topic has an explanation, demo, showcase, practice exercise, and todo checklist.
- A persistent todo list so progress survives page refreshes.
- The existing live Multica workbench remains available for real CLI-backed actions.
- A Gemini assistant that uses Flash only and never exposes API keys in the browser.
- A Gemini CLI setup/check view for installing Gemini CLI and using `gemini -m gemini-2.5-flash`.

## Scope

### Frontend

Add a top-level tabbed app:

- **Learn**: curriculum modules grouped by setup, core concepts, workflow, safety, and deployment.
- **Workbench**: existing live Multica dashboard/actions.
- **Practice**: guided exercises with demo data, exact steps, expected result, and self-check.
- **Todos**: progress checklist grouped by topic; stored in `localStorage`.
- **Gemini**: Flash-only assistant panel plus Gemini CLI setup status.

The UI should be quiet, compact, and task-oriented. Avoid a landing page. The first screen should show learning progress, next practice, and live bridge status.

### Backend

Add a Gemini service:

- `POST /api/gemini/ask`
- Request body: `topicId`, `mode`, `question`, `answer`
- Supported modes: `explain`, `review`, `next_practice`
- Fixed model: `gemini-2.5-flash`
- API key source: `GEMINI_API_KEY` first, `GOOGLE_API_KEY` fallback
- If no key exists, return a structured disabled response instead of throwing.
- In-memory daily limit: 20 successful Gemini requests per local backend process by default.
- Never accept a model from the browser.

Add setup status:

- `GET /api/gemini/setup`
- Reports whether `gemini` exists on `PATH`.
- Provides install command: `npm install -g @google/gemini-cli`
- Provides Flash test command: `gemini -m gemini-2.5-flash`
- Reports current Multica runtime profiles when available through the existing allowlisted command runner.
- Does not automatically create a Multica runtime profile because the installed CLI requires a `protocol-family` value and does not list a Gemini-supported protocol in help output.

### Safety

- Extend the local request guard to cover `/api/gemini/*` as well as `/api/multica/*`.
- Keep shell operations allowlisted.
- No arbitrary command passthrough.
- No frontend API keys.
- No non-Flash Gemini model selection.
- Redact secret-like output through existing command runner behavior.

## Learning Content

Topics:

1. Workspace: active scope, workspace id, local config.
2. Daemon: local process, status, restart, stale runtime symptoms.
3. Runtime: detected coding tools, provider, status, last seen.
4. Agent: name, runtime, instructions, visibility, concurrency.
5. Project and repo: project container, repo resource, safe repo URL.
6. Issue and assignment: issue lifecycle, assignment to agent, task queue.
7. Command log: exit code, stdout/stderr, JSON parsing, redaction.
8. Safety: secrets, local-only guard, least-privilege credentials.
9. Gemini Flash: model limits, API key handling, CLI setup.
10. Deployment: Vercel static UI versus local bridge.

Every topic includes:

- `summary`
- `learn`
- `demo`
- `showcase`
- `practice`
- `todos`

## Data Flow

```text
React tabs
  -> static curriculum data and localStorage progress
  -> /api/multica/* for live Multica workbench
  -> /api/gemini/setup for Gemini CLI/setup status
  -> /api/gemini/ask for Flash-only assistant
  -> Spring Boot local guard
  -> Gemini SDK or Multica CLI
```

## Testing

Frontend:

- Curriculum content is complete and every topic has demo, showcase, practice, todos.
- Todo state helpers toggle and summarize progress.
- Gemini helper sends local guard header and handles disabled backend responses.
- Build succeeds.

Backend:

- Gemini service uses only `gemini-2.5-flash`.
- Missing API key returns disabled response.
- Limit enforcement blocks after configured maximum.
- Controller is guarded by local header and loopback checks.
- Setup service detects PATH executables without shell passthrough.

## Success Criteria

- A developer can open the app and learn Multica topic by topic.
- Each topic has a demo, showcase, practice exercise, and checklist.
- Todos persist locally.
- Existing Multica workbench still works.
- Gemini assistant is Flash-only and key-safe.
- Gemini CLI setup view explains what is installed and what remains.
- Tests and production build pass.
