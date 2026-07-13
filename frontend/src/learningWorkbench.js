export const learningTopics = [
  topic({
    id: 'workspace',
    group: 'Setup',
    title: 'Workspace',
    summary: 'The active Multica scope that owns agents, projects, repos, issues, and runtimes.',
    learn: [
      'A workspace is the boundary for the work you see and assign. Your CLI config contains the active workspace id.',
      'Use one workspace for this personal lab so practice issues, agents, and repos stay separate from company work.'
    ],
    demo: {
      command: 'multica config show',
      result: 'Shows config path, server URL, app URL, and active workspace id.'
    },
    showcase: [
      'Read the workspace id before creating agents.',
      'Switch intentionally when testing a different server or team.'
    ],
    practice: {
      id: 'practice-workspace-config',
      goal: 'Confirm the active workspace before changing any Multica resources.',
      steps: [
        'Open the Workbench tab and refresh status.',
        'Run `multica config show` in a terminal.',
        'Compare the workspace id with the workspace you expect.'
      ],
      expected: 'You can name the active workspace and server URL.'
    },
    todos: ['Confirm active workspace id', 'Keep personal lab separate from company workspace']
  }),
  topic({
    id: 'daemon',
    group: 'Setup',
    title: 'Daemon',
    summary: 'The local Multica process that detects coding tools and polls for work.',
    learn: [
      'The daemon is what makes local runtimes visible to Multica.',
      'If runtimes look stale, check daemon status and restart it before debugging agents.'
    ],
    demo: {
      command: 'multica daemon status',
      result: 'Shows process status, pid, uptime, version, detected agents, and workspace count.'
    },
    showcase: [
      'Restart daemon from Workbench when runtime status stops updating.',
      'Use daemon status as the first health check before assigning work.'
    ],
    practice: {
      id: 'practice-daemon-health',
      goal: 'Read daemon health and decide whether it is safe to assign a task.',
      steps: [
        'Refresh Workbench.',
        'Check daemon status text and online runtime count.',
        'If stale, restart daemon and refresh again.'
      ],
      expected: 'Daemon is running and at least one runtime is online.'
    },
    todos: ['Verify daemon is running', 'Know when to restart daemon']
  }),
  topic({
    id: 'runtime',
    group: 'Core',
    title: 'Runtime',
    summary: 'A detected local coding tool, such as Codex, Claude, Cursor, or OpenClaw.',
    learn: [
      'A runtime is the executable path through which an agent can work.',
      'Runtime status, provider, daemon id, and last seen timestamp explain whether an assignment can run now.'
    ],
    demo: {
      command: 'multica runtime list --output json',
      result: 'Returns runtime records with provider, status, daemon, profile, and last seen fields.'
    },
    showcase: [
      'Choose an online runtime when creating an agent.',
      'Use provider names to decide which agent is suitable for a task.'
    ],
    practice: {
      id: 'practice-runtime-refresh',
      topicId: 'runtime',
      goal: 'Refresh runtime data and identify which runtime should receive a practice agent.',
      steps: [
        'Open Workbench and press Refresh.',
        'Find the online runtime list.',
        'Pick one runtime and write down provider plus short daemon id.'
      ],
      expected: 'You can identify an online runtime and explain why it is assignable.'
    },
    todos: ['Find an online runtime', 'Know provider and daemon id fields']
  }),
  topic({
    id: 'agent',
    group: 'Core',
    title: 'Agent',
    summary: 'A named teammate configuration bound to a runtime with instructions and visibility.',
    learn: [
      'Agents are reusable worker profiles. Instructions should be narrow and task-oriented.',
      'Visibility controls who can invoke the agent. Keep personal experiments private by default.'
    ],
    demo: {
      action: 'Create an agent from an online runtime in Workbench.',
      result: 'Workbench calls `multica agent create --runtime-id ... --output json` through the local bridge.'
    },
    showcase: [
      'Create separate reviewer, implementer, and documentation agents.',
      'Keep instructions focused on quality gates, tests, and repo boundaries.'
    ],
    practice: {
      id: 'practice-agent-create',
      goal: 'Create a safe private practice agent.',
      steps: [
        'Choose an online runtime.',
        'Name the agent `Personal Multica Reviewer`.',
        'Use instructions: `Review changes, explain risks, and do not modify files unless asked.`'
      ],
      expected: 'A private agent appears in the Agents list.'
    },
    todos: ['Create first private agent', 'Write narrow agent instructions']
  }),
  topic({
    id: 'project-repo',
    group: 'Workflow',
    title: 'Project And Repo',
    summary: 'A project groups issues; repos attach the code context agents need.',
    learn: [
      'Projects keep related issues together.',
      'Repos should be added with safe HTTPS, SSH, git, or git@ URLs without embedded credentials.'
    ],
    demo: {
      action: 'Create a project and attach this repo URL.',
      result: 'Workbench validates URL shape before calling the Multica CLI.'
    },
    showcase: [
      'Use one project for this learning lab.',
      'Attach only repos you are prepared to let agents inspect or modify.'
    ],
    practice: {
      id: 'practice-project-repo',
      goal: 'Create a personal Multica lab project and attach a repo safely.',
      steps: [
        'Create project `Personal Multica Lab`.',
        'Attach `https://github.com/baysavevl/my-multica` or your fork.',
        'Refresh Workbench and confirm it appears.'
      ],
      expected: 'Project and repo appear without credential warnings.'
    },
    todos: ['Create lab project', 'Attach repo without embedded credentials']
  }),
  topic({
    id: 'issue-assignment',
    group: 'Workflow',
    title: 'Issue And Assignment',
    summary: 'An issue is the unit of work; assignment queues work for an agent or member.',
    learn: [
      'Good issues describe exact expected behavior, files to inspect, and verification commands.',
      'Assignment should happen only after daemon and runtime status are healthy.'
    ],
    demo: {
      action: 'Create a low-risk issue and assign it to your practice agent.',
      result: 'Workbench calls issue create and assign through allowlisted endpoints.'
    },
    showcase: [
      'Use priority and status to make queue state readable.',
      'Keep first practice issues read-only, such as summarizing docs.'
    ],
    practice: {
      id: 'practice-issue-assign',
      goal: 'Create and assign one harmless practice issue.',
      steps: [
        'Create issue `Summarize README setup path`.',
        'Assign it to your practice reviewer agent.',
        'Watch command log for create and assign results.'
      ],
      expected: 'Issue is visible and assigned to the selected agent.'
    },
    todos: ['Create first practice issue', 'Assign issue only after runtime is online']
  }),
  topic({
    id: 'command-log',
    group: 'Debug',
    title: 'Command Log',
    summary: 'Recent bridge command results for debugging local CLI calls.',
    learn: [
      'The command log shows command kind, redacted arguments, duration, stdout, stderr, and parse results.',
      'Failures should be read from stderr first, then daemon/runtime status.'
    ],
    demo: {
      action: 'Run Refresh and inspect the command log.',
      result: 'Each list/status command records a redacted bridge result.'
    },
    showcase: [
      'Use failed entries to distinguish CLI missing, auth missing, server unavailable, and JSON parse problems.',
      'Avoid copying raw secrets into issue descriptions or instructions.'
    ],
    practice: {
      id: 'practice-command-log',
      goal: 'Use command log evidence to explain a failed action.',
      steps: [
        'Refresh Workbench.',
        'Open Command log.',
        'Pick one entry and identify kind, ok state, duration, and message.'
      ],
      expected: 'You can explain what command ran and whether it succeeded.'
    },
    todos: ['Inspect command log after refresh', 'Use stderr before guessing']
  }),
  topic({
    id: 'safety',
    group: 'Safety',
    title: 'Safety',
    summary: 'Local-only controls and secret hygiene for agent work.',
    learn: [
      'The bridge rejects non-loopback requests and requires a local guard header.',
      'Agent instructions, issue descriptions, and custom environment values should avoid high-value secrets.'
    ],
    demo: {
      action: 'Call the API without the guard header.',
      result: 'The backend returns a forbidden response instead of running commands.'
    },
    showcase: [
      'Use least-privilege repo and API credentials.',
      'Commit or stash local changes before assigning file-modifying tasks.'
    ],
    practice: {
      id: 'practice-safety-review',
      goal: 'Run a safety preflight before assigning a task.',
      steps: [
        'Check git status in the target repo.',
        'Check whether the issue contains secrets.',
        'Confirm the target agent instructions are narrow.'
      ],
      expected: 'You can say whether the task is safe to assign.'
    },
    todos: ['Check git status before assignment', 'Never paste secrets into prompts']
  }),
  topic({
    id: 'gemini-flash',
    group: 'Gemini',
    title: 'Gemini Flash',
    summary: 'A fast Gemini assistant path limited to Flash for learning and review.',
    learn: [
      'The app assistant uses only `gemini-2.5-flash`; model selection is not accepted from the browser.',
      'Gemini CLI can be installed separately and tested with `gemini -m gemini-2.5-flash`.'
    ],
    demo: {
      action: 'Ask Gemini to explain a selected Multica topic.',
      result: 'Backend builds a topic-scoped prompt and calls Flash only if an API key is configured.'
    },
    showcase: [
      'Use explain mode to clarify concepts.',
      'Use review mode to check your practice answer without exposing keys.'
    ],
    practice: {
      id: 'practice-gemini-flash',
      goal: 'Use Flash to review one practice answer.',
      steps: [
        'Set `GEMINI_API_KEY` or `GOOGLE_API_KEY` for the local backend.',
        'Open Gemini tab and choose a topic.',
        'Write your answer and ask for review.'
      ],
      expected: 'Assistant returns concise feedback or a clear disabled state if no key is set.'
    },
    todos: ['Configure Gemini API key locally', 'Test Gemini Flash prompt review']
  }),
  topic({
    id: 'deployment',
    group: 'Deploy',
    title: 'Deployment',
    summary: 'Vercel serves the static UI; local CLI actions require the Spring bridge.',
    learn: [
      'The deployed Vercel app is static and cannot run local Multica or Gemini CLI commands by itself.',
      'For real local actions, run the Spring bridge and point Vite or the browser environment at it.'
    ],
    demo: {
      command: 'vercel inspect https://my-multica.vercel.app',
      result: 'Shows production deployment state and aliases.'
    },
    showcase: [
      'Use Vercel for the learning UI showcase.',
      'Use local backend for bridge-backed Multica and Gemini assistant calls.'
    ],
    practice: {
      id: 'practice-deployment-check',
      goal: 'Explain which features work on static Vercel and which need local bridge.',
      steps: [
        'Open the deployed app.',
        'Open the local Vite app with backend running.',
        'Compare Workbench and Gemini behavior.'
      ],
      expected: 'You can distinguish static learning features from local bridge features.'
    },
    todos: ['Know Vercel static limitation', 'Run local bridge for CLI-backed actions']
  })
]

export const todoItems = learningTopics.flatMap(topic => topic.todos.map((label, index) => ({
  id: `${topic.id}-todo-${index + 1}`,
  topicId: topic.id,
  group: topic.group,
  label
})))

export function initialTodoState() {
  return Object.fromEntries(todoItems.map(item => [item.id, false]))
}

export function normalizeTodoState(value) {
  return {
    ...initialTodoState(),
    ...(value && typeof value === 'object' ? value : {})
  }
}

export function toggleTodo(state, id) {
  return {
    ...normalizeTodoState(state),
    [id]: !Boolean(normalizeTodoState(state)[id])
  }
}

export function learningSummary(state) {
  const normalized = normalizeTodoState(state)
  const total = todoItems.length
  const completed = todoItems.filter(item => normalized[item.id]).length
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    nextTodo: todoItems.find(item => !normalized[item.id]) || null
  }
}

export function topicById(id) {
  const topic = learningTopics.find(item => item.id === id)
  if (!topic) {
    throw new Error(`Unknown learning topic: ${id}`)
  }
  return topic
}

export function practiceById(id) {
  const practice = learningTopics.map(topic => topic.practice).find(item => item.id === id)
  if (!practice) {
    throw new Error(`Unknown practice: ${id}`)
  }
  return practice
}

function topic(definition) {
  return {
    ...definition,
    practice: {
      topicId: definition.id,
      ...definition.practice
    }
  }
}
