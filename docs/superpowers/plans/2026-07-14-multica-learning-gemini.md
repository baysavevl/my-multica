# Multica Learning And Gemini Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clean Multica learning workbench with demos, practice, todos, and a Flash-only Gemini assistant.

**Architecture:** Keep the current React/Vite and Spring Boot split. Add focused frontend helper/content modules for curriculum, progress, and Gemini requests. Add Spring Boot Gemini services/controllers behind the same local-only guard used by Multica.

**Tech Stack:** React 19, Vite 7, Java 21, Spring Boot 3.5.9, Google Gen AI Java SDK 1.61.0, Multica CLI.

## Global Constraints

- UI must be clean, beautiful, and easy to use.
- Gemini assistant must use `gemini-2.5-flash` only.
- Browser must never receive Gemini API keys.
- Backend reads `GEMINI_API_KEY` first and `GOOGLE_API_KEY` second.
- Local guard covers `/api/multica/*` and `/api/gemini/*`.
- No arbitrary shell command passthrough.
- Todo progress persists in browser `localStorage`.
- Existing Multica workbench behavior remains available.

---

### Task 1: Frontend Learning Data And Progress Helpers

**Files:**
- Create: `frontend/src/learningWorkbench.js`
- Create: `frontend/src/learningWorkbench.test.mjs`

**Interfaces:**
- Produces: `learningTopics`, `initialTodoState()`, `toggleTodo(state, id)`, `learningSummary(state)`, `topicById(id)`, `practiceById(id)`.

- [ ] Write failing tests for topic completeness, todo toggling, and summary counts.
- [ ] Run `npm test -- learningWorkbench.test.mjs` and confirm failures.
- [ ] Implement curriculum data and helper functions.
- [ ] Run `npm test -- learningWorkbench.test.mjs` and confirm pass.

### Task 2: Frontend Gemini Request Helpers

**Files:**
- Create: `frontend/src/geminiAssistant.js`
- Create: `frontend/src/geminiAssistant.test.mjs`

**Interfaces:**
- Produces: `geminiModes`, `geminiSetupRequest()`, `askGemini({ topicId, mode, question, answer })`, `validateGeminiAskInput(input)`.

- [ ] Write failing tests for validation, local guard headers, and disabled backend response handling.
- [ ] Run `npm test -- geminiAssistant.test.mjs` and confirm failures.
- [ ] Implement helper functions using `withJsonHeaders`.
- [ ] Run `npm test -- geminiAssistant.test.mjs` and confirm pass.

### Task 3: Backend Gemini Flash Service

**Files:**
- Modify: `backend/pom.xml`
- Create: `backend/src/main/java/com/baysave/multica/gemini/GeminiAskRequest.java`
- Create: `backend/src/main/java/com/baysave/multica/gemini/GeminiAskResponse.java`
- Create: `backend/src/main/java/com/baysave/multica/gemini/GeminiClient.java`
- Create: `backend/src/main/java/com/baysave/multica/gemini/GoogleGenAiGeminiClient.java`
- Create: `backend/src/main/java/com/baysave/multica/gemini/GeminiUsageLimiter.java`
- Create: `backend/src/main/java/com/baysave/multica/gemini/GeminiAssistantService.java`
- Create: `backend/src/test/java/com/baysave/multica/gemini/GeminiAssistantServiceTest.java`

**Interfaces:**
- Produces: `GeminiAssistantService.ask(GeminiAskRequest)` returning `GeminiAskResponse`.

- [ ] Write failing tests for Flash-only model, missing-key disabled response, prompt construction, and limit enforcement.
- [ ] Run `mvn -Dtest=GeminiAssistantServiceTest test` and confirm failures.
- [ ] Add Google Gen AI dependency and implement services.
- [ ] Run `mvn -Dtest=GeminiAssistantServiceTest test` and confirm pass.

### Task 4: Backend Gemini Controller And Setup Status

**Files:**
- Modify: `backend/src/main/java/com/baysave/multica/api/MulticaLocalRequestGuard.java`
- Create: `backend/src/main/java/com/baysave/multica/gemini/GeminiSetupStatus.java`
- Create: `backend/src/main/java/com/baysave/multica/gemini/GeminiSetupService.java`
- Create: `backend/src/main/java/com/baysave/multica/api/GeminiController.java`
- Create: `backend/src/test/java/com/baysave/multica/api/GeminiControllerTest.java`

**Interfaces:**
- Produces: `POST /api/gemini/ask` and `GET /api/gemini/setup`.

- [ ] Write failing controller tests for local guard rejection, ask delegation, and setup response.
- [ ] Run `mvn -Dtest=GeminiControllerTest test` and confirm failures.
- [ ] Implement controller and setup service.
- [ ] Run `mvn -Dtest=GeminiControllerTest test` and confirm pass.

### Task 5: Clean Learning UI

**Files:**
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Consumes: learning and Gemini helper modules.
- Produces: tabs `Learn`, `Workbench`, `Practice`, `Todos`, `Gemini`.

- [ ] Write or update tests where helper behavior supports UI state.
- [ ] Refactor current `MulticaControlCenter` into a workbench section.
- [ ] Add learning dashboard, practice cards, todo board, and Gemini assistant panel.
- [ ] Keep the first viewport focused on progress and next action.
- [ ] Run `npm test` and `npm run build`.

### Task 6: Documentation, Verification, Commit, Push

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces setup instructions for Gemini API key, Gemini CLI, local bridge, and Vercel limitations.

- [ ] Update README.
- [ ] Run `npm test`, `npm run build`, and `mvn test`.
- [ ] Secret scan staged diff.
- [ ] Commit with conventional message.
- [ ] Push to `origin/main`.
