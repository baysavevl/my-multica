import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  FileText,
  GitBranch,
  GraduationCap,
  ListChecks,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserPlus,
  Workflow
} from 'lucide-react'
import { askGemini, geminiModes, geminiSetupRequest } from './geminiAssistant.js'
import {
  initialTodoState,
  learningSummary,
  learningTopics,
  todoItems,
  toggleTodo,
  topicById
} from './learningWorkbench.js'
import {
  agentFormDefaults,
  assignFormDefaults,
  commandData,
  concepts,
  controlCenterRequest,
  createEmptyControlCenterState,
  displayAgent,
  displayIssue,
  displayProject,
  displayRepo,
  displayRuntime,
  issueFormDefaults,
  projectFormDefaults,
  repoFormDefaults,
  validateAgentForm,
  validateAssignForm,
  validateIssueForm,
  validateProjectForm,
  validateRepoForm
} from './multicaControlCenter.js'
import './styles.css'

const TODO_STORAGE_KEY = 'my-multica-learning-todos'
const navigationTabs = [
  { id: 'learn', label: 'Learn', icon: BookOpen, eyebrow: 'Multica learning path', title: 'Learn Multica one concept at a time.' },
  { id: 'practice', label: 'Practice', icon: GraduationCap, eyebrow: 'Hands-on drills', title: 'Practice with guided demos and expected outcomes.' },
  { id: 'todos', label: 'Todo', icon: ClipboardCheck, eyebrow: 'Learning checklist', title: 'Track every setup and workflow task.' },
  { id: 'gemini', label: 'Gemini', icon: Sparkles, eyebrow: 'Flash assistant', title: 'Ask Gemini Flash for explanations, review, and next practice.' },
  { id: 'workbench', label: 'Workbench', icon: Workflow, eyebrow: 'Real Multica bridge', title: 'Manage local agents, runtimes, projects, issues, and command output.' }
]

function App() {
  return <MulticaControlCenter />
}

function MulticaControlCenter() {
  const [state, setState] = useState(createEmptyControlCenterState)
  const [activeTab, setActiveTab] = useState('learn')
  const [selectedTopicId, setSelectedTopicId] = useState(learningTopics[0]?.id || '')
  const [todoState, setTodoState] = useState(loadStoredTodoState)
  const [geminiSetup, setGeminiSetup] = useState(null)
  const [geminiSetupLoading, setGeminiSetupLoading] = useState(false)
  const [geminiSetupChecked, setGeminiSetupChecked] = useState(false)
  const [geminiForm, setGeminiForm] = useState({
    topicId: learningTopics[0]?.id || '',
    mode: geminiModes.explain,
    question: '',
    answer: ''
  })
  const [geminiResponse, setGeminiResponse] = useState(null)
  const [geminiError, setGeminiError] = useState('')
  const [geminiBusy, setGeminiBusy] = useState(false)
  const [agentForm, setAgentForm] = useState(agentFormDefaults)
  const [projectForm, setProjectForm] = useState(projectFormDefaults)
  const [repoForm, setRepoForm] = useState(repoFormDefaults)
  const [issueForm, setIssueForm] = useState(issueFormDefaults)
  const [assignForm, setAssignForm] = useState(assignFormDefaults)
  const [formErrors, setFormErrors] = useState([])
  const [actionMessage, setActionMessage] = useState('')
  const [busyAction, setBusyAction] = useState('')

  async function loadControlCenter() {
    setState(current => ({ ...current, loading: true, error: '' }))
    const requests = await Promise.allSettled([
      controlCenterRequest('/status'),
      controlCenterRequest('/runtimes'),
      controlCenterRequest('/agents'),
      controlCenterRequest('/projects'),
      controlCenterRequest('/repos'),
      controlCenterRequest('/issues'),
      controlCenterRequest('/commands')
    ])
    const firstError = requests.find(result => result.status === 'rejected')
    setState({
      status: valueOrNull(requests[0]),
      runtimes: commandData(valueOrNull(requests[1])),
      agents: commandData(valueOrNull(requests[2])),
      projects: commandData(valueOrNull(requests[3])),
      repos: commandData(valueOrNull(requests[4])),
      issues: commandData(valueOrNull(requests[5]), 'issues'),
      commands: valueOrDefault(requests[6], []),
      error: firstError ? commandErrorMessage(firstError.reason) : '',
      loading: false
    })
  }

  useEffect(() => {
    loadControlCenter()
  }, [])

  useEffect(() => {
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoState))
  }, [todoState])

  useEffect(() => {
    if (activeTab === 'gemini' && !geminiSetupChecked && !geminiSetupLoading) {
      loadGeminiSetup()
    }
  }, [activeTab, geminiSetupChecked, geminiSetupLoading])

  const runtimes = state.runtimes.map(displayRuntime)
  const agents = state.agents.map(displayAgent)
  const projects = state.projects.map(displayProject)
  const repos = state.repos.map(displayRepo)
  const issues = state.issues.map(displayIssue)
  const onlineRuntimes = runtimes.filter(runtime => runtime.status === 'online')
  const daemonReady = Boolean(state.status?.ok)
  const selectedTopic = learningTopics.find(topic => topic.id === selectedTopicId) || learningTopics[0]
  const activeTabMeta = navigationTabs.find(tab => tab.id === activeTab) || navigationTabs[0]
  const summary = learningSummary(todoState)

  async function runControlAction(label, validate, work, reset) {
    const errors = validate()
    setFormErrors(errors)
    setActionMessage('')
    if (errors.length > 0) {
      return
    }
    setBusyAction(label)
    try {
      await work()
      setActionMessage(`${label} completed.`)
      reset?.()
      await loadControlCenter()
    } catch (error) {
      setFormErrors([commandErrorMessage(error)])
    } finally {
      setBusyAction('')
    }
  }

  function selectTopic(topicId) {
    setSelectedTopicId(topicId)
    setGeminiForm(current => ({ ...current, topicId }))
  }

  function toggleTodoItem(id) {
    setTodoState(current => toggleTodo(current, id))
  }

  async function loadGeminiSetup() {
    setGeminiSetupLoading(true)
    setGeminiSetupChecked(true)
    setGeminiError('')
    try {
      setGeminiSetup(await geminiSetupRequest())
    } catch (error) {
      setGeminiError(geminiErrorMessage(error))
    } finally {
      setGeminiSetupLoading(false)
    }
  }

  async function submitGemini() {
    setGeminiBusy(true)
    setGeminiError('')
    setGeminiResponse(null)
    try {
      setGeminiResponse(await askGemini(geminiForm))
    } catch (error) {
      setGeminiError(geminiErrorMessage(error))
    } finally {
      setGeminiBusy(false)
    }
  }

  return (
    <main className="agent-shell">
      <aside className="agent-sidebar">
        <div className="brand">
          <Bot size={24} aria-hidden="true" />
          <div>
            <h1>Multica Control Center</h1>
            <p>Local real-agent orchestration</p>
          </div>
        </div>

        <Status label="Daemon" active={daemonReady} value={daemonReady ? 'Running' : 'Check'} />
        <Status label="Runtimes" active={onlineRuntimes.length > 0} value={`${onlineRuntimes.length}/${runtimes.length}`} />
        <Status label="Agents" active={agents.length > 0} value={String(agents.length)} />

        <nav className="learning-nav" aria-label="Multica sections">
          {navigationTabs.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>

        <div className="learning-progress-mini">
          <div>
            <span>Progress</span>
            <strong>{summary.completed}/{summary.total}</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${summary.percent}%` }} />
          </div>
          {summary.nextTodo && <p>Next: {summary.nextTodo.label}</p>}
        </div>

        <div className="side-actions">
          <button type="button" className="ghost" onClick={loadControlCenter} disabled={state.loading}>
            <RefreshCw size={16} aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            className="ghost"
            disabled={Boolean(busyAction)}
            onClick={() => runControlAction(
              'Daemon restart',
              () => [],
              () => controlCenterRequest('/daemon/restart', { method: 'POST' })
            )}
          >
            <RotateCcw size={16} aria-hidden="true" /> Restart daemon
          </button>
        </div>

        <div className="agent-concept-mini">
          <p className="eyebrow">Mental model</p>
          <strong>Issue to Agent to Runtime to Daemon to CLI</strong>
          <span>The server coordinates. Your machine executes.</span>
        </div>
      </aside>

      <section className="agent-workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeTabMeta.eyebrow}</p>
            <h2>{activeTabMeta.title}</h2>
          </div>
          <div className={`health-pill ${daemonReady ? '' : 'warning'}`}>
            <Server size={16} aria-hidden="true" />
            {daemonReady ? 'Daemon reachable' : 'Needs local bridge'}
          </div>
        </header>

        {(state.error || formErrors.length > 0 || actionMessage) && (
          <section className={`agent-alert ${formErrors.length > 0 || state.error ? 'error' : 'ok'}`}>
            <strong>{formErrors.length > 0 || state.error ? 'Action needed' : 'Success'}</strong>
            <div>
              {state.error && <p>{state.error}</p>}
              {formErrors.map(error => <p key={error}>{error}</p>)}
              {actionMessage && <p>{actionMessage}</p>}
            </div>
          </section>
        )}

        <section className="agent-overview-grid">
          <AgentMetric icon={<GraduationCap size={18} />} label="Learning progress" value={`${summary.percent}%`} detail={`${summary.completed}/${summary.total} todos`} />
          <AgentMetric icon={<Bot size={18} />} label="Agents" value={agents.length} detail="configured teammates" />
          <AgentMetric icon={<Cpu size={18} />} label="Online runtimes" value={onlineRuntimes.length} detail={`${runtimes.length} registered`} />
          <AgentMetric icon={<ListChecks size={18} />} label="Issues" value={issues.length} detail="visible in workspace" />
        </section>

        {activeTab === 'learn' && (
          <LearningGuide
            selectedTopic={selectedTopic}
            selectedTopicId={selectedTopicId}
            onSelectTopic={selectTopic}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeGuide
            selectedTopicId={selectedTopicId}
            onSelectTopic={selectTopic}
            onOpenGemini={() => setActiveTab('gemini')}
          />
        )}

        {activeTab === 'todos' && (
          <TodoBoard
            todoState={todoState}
            onToggleTodo={toggleTodoItem}
          />
        )}

        {activeTab === 'gemini' && (
          <GeminiPanel
            form={geminiForm}
            setForm={setGeminiForm}
            setup={geminiSetup}
            setupLoading={geminiSetupLoading}
            busy={geminiBusy}
            error={geminiError}
            response={geminiResponse}
            onLoadSetup={loadGeminiSetup}
            onSubmit={submitGemini}
          />
        )}

        {activeTab === 'workbench' && (
        <div className="agent-grid">
          <section className="panel agent-panel">
            <PanelTitle icon={<Server size={18} />} title="Daemon status" />
            <pre className="agent-status-output">{state.status?.stdout || state.status?.stderr || 'Run refresh to read daemon status.'}</pre>
          </section>

          <section className="panel agent-panel">
            <PanelTitle icon={<Cpu size={18} />} title="Runtimes" />
            <div className="agent-list">
              {runtimes.length === 0
                ? <p className="empty">No runtimes loaded. Start Multica and the daemon, then refresh.</p>
                : runtimes.map(runtime => (
                  <article className="agent-row" key={runtime.id || runtime.name}>
                    <div>
                      <strong>{runtime.name}</strong>
                      <span>{runtime.providerLabel} · {runtime.daemonId ? shortId(runtime.daemonId) : 'daemon unknown'}</span>
                    </div>
                    <StatusChip tone={runtime.status === 'online' ? 'ok' : 'warn'}>{runtime.statusLabel}</StatusChip>
                  </article>
                ))}
            </div>
          </section>

          <section className="panel agent-panel">
            <PanelTitle icon={<Bot size={18} />} title="Agents" />
            <div className="agent-list">
              {agents.length === 0
                ? <p className="empty">No agents yet. Create one from an online runtime.</p>
                : agents.map(agent => (
                  <article className="agent-row" key={agent.id || agent.name}>
                    <div>
                      <strong>{agent.name}</strong>
                      <span>{agent.description || agent.runtimeId || 'No description'}</span>
                    </div>
                    <StatusChip tone={agent.archived ? 'warn' : 'ok'}>{agent.visibility}</StatusChip>
                  </article>
                ))}
            </div>
          </section>

          <section className="panel agent-panel">
            <PanelTitle icon={<UserPlus size={18} />} title="Create agent" />
            <div className="agent-form-stack">
              <label>
                Agent name
                <input value={agentForm.name} onChange={event => setAgentForm(current => ({ ...current, name: event.target.value }))} placeholder="Frontend reviewer" />
              </label>
              <label>
                Runtime
                <select value={agentForm.runtimeId} onChange={event => setAgentForm(current => ({ ...current, runtimeId: event.target.value }))}>
                  <option value="">Choose runtime</option>
                  {onlineRuntimes.map(runtime => <option key={runtime.id} value={runtime.id}>{runtime.name}</option>)}
                </select>
              </label>
              <label>
                Description
                <input value={agentForm.description} onChange={event => setAgentForm(current => ({ ...current, description: event.target.value }))} placeholder="What this agent is for" />
              </label>
              <label>
                Instructions
                <textarea value={agentForm.instructions} onChange={event => setAgentForm(current => ({ ...current, instructions: event.target.value }))} placeholder="Focus on tests, security, and small commits." />
              </label>
              <label>
                Visibility
                <select value={agentForm.visibility} onChange={event => setAgentForm(current => ({ ...current, visibility: event.target.value }))}>
                  <option value="private">Private</option>
                  <option value="workspace">Workspace</option>
                </select>
              </label>
              <button
                type="button"
                className="primary"
                disabled={Boolean(busyAction)}
                onClick={() => runControlAction(
                  'Create agent',
                  () => validateAgentForm(agentForm),
                  () => controlCenterRequest('/agents', { method: 'POST', body: JSON.stringify(agentForm) }),
                  () => setAgentForm(agentFormDefaults)
                )}
              >
                <Plus size={16} aria-hidden="true" /> Create agent
              </button>
            </div>
          </section>

          <section className="panel agent-panel">
            <PanelTitle icon={<GitBranch size={18} />} title="Projects and repos" />
            <div className="agent-list">
              {projects.length === 0
                ? <p className="empty">No projects yet.</p>
                : projects.map(project => (
                  <article className="agent-row" key={project.id || project.title}>
                    <div>
                      <strong>{project.title}</strong>
                      <span>{project.description || shortId(project.id)}</span>
                    </div>
                    {project.status && <StatusChip>{project.status}</StatusChip>}
                  </article>
                ))}
            </div>
            <div className="agent-list compact">
              {repos.map(repo => (
                <article className="agent-row" key={repo.id || repo.url}>
                  <div>
                    <strong>{repo.url}</strong>
                    <span>{repo.description || 'Workspace repository'}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel agent-panel">
            <PanelTitle icon={<Plus size={18} />} title="Create project / add repo" />
            <div className="agent-form-stack">
              <label>
                Project title
                <input value={projectForm.title} onChange={event => setProjectForm(current => ({ ...current, title: event.target.value }))} placeholder="Personal Multica lab" />
              </label>
              <label>
                Description
                <input value={projectForm.description} onChange={event => setProjectForm(current => ({ ...current, description: event.target.value }))} placeholder="Optional project context" />
              </label>
              <label>
                Attach repo URL
                <input value={projectForm.repoUrl} onChange={event => setProjectForm(current => ({ ...current, repoUrl: event.target.value }))} placeholder="https://github.com/baysavevl/my-multica" />
              </label>
              <button
                type="button"
                className="primary"
                disabled={Boolean(busyAction)}
                onClick={() => runControlAction(
                  'Create project',
                  () => validateProjectForm(projectForm),
                  () => controlCenterRequest('/projects', { method: 'POST', body: JSON.stringify(projectForm) }),
                  () => setProjectForm(projectFormDefaults)
                )}
              >
                <Plus size={16} aria-hidden="true" /> Create project
              </button>
              <label>
                Workspace repo URL
                <input value={repoForm.url} onChange={event => setRepoForm(current => ({ ...current, url: event.target.value }))} placeholder="git@github.com:baysavevl/my-multica.git" />
              </label>
              <button
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => runControlAction(
                  'Add repo',
                  () => validateRepoForm(repoForm),
                  () => controlCenterRequest('/repos', { method: 'POST', body: JSON.stringify(repoForm) }),
                  () => setRepoForm(repoFormDefaults)
                )}
              >
                <GitBranch size={16} aria-hidden="true" /> Add repo
              </button>
            </div>
          </section>

          <section className="panel agent-panel wide">
            <PanelTitle icon={<ListChecks size={18} />} title="Issues" />
            <div className="agent-table">
              {issues.length === 0
                ? <p className="empty">No issues yet. Create one and assign it to an agent to enqueue work.</p>
                : issues.map(issue => (
                  <article className="agent-row" key={issue.id || issue.title}>
                    <div>
                      <strong>{issue.id ? `${issue.id} · ${issue.title}` : issue.title}</strong>
                      <span>{issue.assignee || 'Unassigned'} {issue.projectId ? `· ${shortId(issue.projectId)}` : ''}</span>
                    </div>
                    <div className="agent-row-actions">
                      {issue.priority && <StatusChip>{issue.priority}</StatusChip>}
                      {issue.status && <StatusChip tone={issue.status === 'done' ? 'ok' : 'neutral'}>{issue.status}</StatusChip>}
                    </div>
                  </article>
                ))}
            </div>
          </section>

          <section className="panel agent-panel">
            <PanelTitle icon={<Plus size={18} />} title="Create issue" />
            <div className="agent-form-stack">
              <label>
                Title
                <input value={issueForm.title} onChange={event => setIssueForm(current => ({ ...current, title: event.target.value }))} placeholder="Verify local agent setup" />
              </label>
              <label>
                Description
                <textarea value={issueForm.description} onChange={event => setIssueForm(current => ({ ...current, description: event.target.value }))} placeholder="Describe expected behavior and files to inspect." />
              </label>
              <div className="agent-form-pair">
                <label>
                  Status
                  <select value={issueForm.status} onChange={event => setIssueForm(current => ({ ...current, status: event.target.value }))}>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In progress</option>
                    <option value="backlog">Backlog</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </label>
                <label>
                  Priority
                  <select value={issueForm.priority} onChange={event => setIssueForm(current => ({ ...current, priority: event.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
              </div>
              <label>
                Project
                <select value={issueForm.projectId} onChange={event => setIssueForm(current => ({ ...current, projectId: event.target.value }))}>
                  <option value="">No project</option>
                  {projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select>
              </label>
              <label>
                Assign to agent
                <select value={issueForm.assigneeId} onChange={event => setIssueForm(current => ({ ...current, assigneeId: event.target.value }))}>
                  <option value="">Unassigned</option>
                  {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
              </label>
              <button
                type="button"
                className="primary"
                disabled={Boolean(busyAction)}
                onClick={() => runControlAction(
                  'Create issue',
                  () => validateIssueForm(issueForm),
                  () => controlCenterRequest('/issues', { method: 'POST', body: JSON.stringify(issueForm) }),
                  () => setIssueForm(issueFormDefaults)
                )}
              >
                <ListChecks size={16} aria-hidden="true" /> Create issue
              </button>
            </div>
          </section>

          <section className="panel agent-panel">
            <PanelTitle icon={<UserPlus size={18} />} title="Assign existing issue" />
            <div className="agent-form-stack">
              <label>
                Issue
                <select value={assignForm.issueId} onChange={event => setAssignForm(current => ({ ...current, issueId: event.target.value }))}>
                  <option value="">Choose issue</option>
                  {issues.map(issue => <option key={issue.id} value={issue.id}>{issue.id} · {issue.title}</option>)}
                </select>
              </label>
              <label>
                Agent
                <select value={assignForm.assigneeId} onChange={event => setAssignForm(current => ({ ...current, assigneeId: event.target.value }))}>
                  <option value="">Choose agent</option>
                  {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
              </label>
              <button
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => runControlAction(
                  'Assign issue',
                  () => validateAssignForm(assignForm),
                  () => controlCenterRequest(`/issues/${encodeURIComponent(assignForm.issueId)}/assign`, {
                    method: 'POST',
                    body: JSON.stringify({ assigneeId: assignForm.assigneeId })
                  }),
                  () => setAssignForm(assignFormDefaults)
                )}
              >
                <Send size={16} aria-hidden="true" /> Assign
              </button>
            </div>
          </section>

          <section className="panel agent-panel wide">
            <PanelTitle icon={<Terminal size={18} />} title="Command log" />
            <div className="command-log">
              {state.commands.length === 0
                ? <p className="empty">No bridge commands logged yet.</p>
                : state.commands.map((entry, index) => (
                  <article className="command-entry" key={`${entry.kind}-${index}`}>
                    <header>
                      <strong>{entry.kind}</strong>
                      <StatusChip tone={entry.ok ? 'ok' : 'warn'}>{entry.ok ? 'ok' : 'failed'}</StatusChip>
                      <span>{entry.durationMs}ms</span>
                    </header>
                    <code>{entry.command?.join(' ')}</code>
                    {(entry.stdout || entry.stderr || entry.message) && (
                      <pre>{entry.stderr || entry.stdout || entry.message}</pre>
                    )}
                  </article>
                ))}
            </div>
          </section>

          <section className="panel agent-panel wide">
            <PanelTitle icon={<FileText size={18} />} title="Concept guide" />
            <div className="concept-glossary">
              {concepts.map(concept => (
                <article key={concept.term}>
                  <strong>{concept.term}</strong>
                  <p>{concept.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
        )}
      </section>
    </main>
  )
}

function AgentMetric({ icon, label, value, detail }) {
  return (
    <article className="agent-metric">
      {icon}
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <small>{detail}</small>
      </div>
    </article>
  )
}

function TabButton({ tab, active, onClick }) {
  const Icon = tab.icon
  return (
    <button type="button" className={`nav-tab ${active ? 'active' : ''}`} onClick={onClick}>
      <Icon size={16} aria-hidden="true" />
      {tab.label}
    </button>
  )
}

function LearningGuide({ selectedTopic, selectedTopicId, onSelectTopic }) {
  return (
    <section className="learning-layout">
      <aside className="panel topic-selector">
        <PanelTitle icon={<BookOpen size={18} />} title="Lessons" />
        <div className="topic-button-list">
          {learningTopics.map(topic => (
            <button
              key={topic.id}
              type="button"
              className={`lesson-button ${selectedTopicId === topic.id ? 'active' : ''}`}
              onClick={() => onSelectTopic(topic.id)}
            >
              <span>{topic.group}</span>
              <strong>{topic.title}</strong>
              <small>{topic.summary}</small>
            </button>
          ))}
        </div>
      </aside>

      <article className="panel topic-detail">
        <div className="topic-heading">
          <div>
            <p className="eyebrow">{selectedTopic.group}</p>
            <h3>{selectedTopic.title}</h3>
          </div>
          <StatusChip tone="neutral">Lesson</StatusChip>
        </div>

        <p className="topic-summary">{selectedTopic.summary}</p>

        <section className="topic-section">
          <h4>What To Know</h4>
          {selectedTopic.learn.map(item => <p key={item}>{item}</p>)}
        </section>

        <section className="demo-strip">
          <PanelTitle icon={<Terminal size={18} />} title="Demo" />
          {'command' in selectedTopic.demo && <code>{selectedTopic.demo.command}</code>}
          {'action' in selectedTopic.demo && <strong>{selectedTopic.demo.action}</strong>}
          <p>{selectedTopic.demo.result}</p>
        </section>

        <section className="showcase-grid">
          {selectedTopic.showcase.map(item => (
            <div key={item} className="showcase-item">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </section>
      </article>
    </section>
  )
}

function PracticeGuide({ selectedTopicId, onSelectTopic, onOpenGemini }) {
  return (
    <section className="practice-grid">
      {learningTopics.map(topic => (
        <article className={`panel practice-card ${selectedTopicId === topic.id ? 'selected' : ''}`} key={topic.practice.id}>
          <div className="topic-heading">
            <div>
              <p className="eyebrow">{topic.group}</p>
              <h3>{topic.practice.goal}</h3>
            </div>
            <StatusChip tone={selectedTopicId === topic.id ? 'ok' : 'neutral'}>{topic.title}</StatusChip>
          </div>
          <ol className="practice-steps">
            {topic.practice.steps.map(step => <li key={step}>{step}</li>)}
          </ol>
          <p className="practice-expected">{topic.practice.expected}</p>
          <div className="practice-actions">
            <button type="button" onClick={() => onSelectTopic(topic.id)}>
              <BookOpen size={16} aria-hidden="true" /> Read lesson
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                onSelectTopic(topic.id)
                onOpenGemini()
              }}
            >
              <Sparkles size={16} aria-hidden="true" /> Ask Gemini
            </button>
          </div>
        </article>
      ))}
    </section>
  )
}

function TodoBoard({ todoState, onToggleTodo }) {
  const summary = learningSummary(todoState)
  return (
    <section className="todo-board">
      <article className="panel todo-summary">
        <PanelTitle icon={<ClipboardCheck size={18} />} title="Checklist" />
        <strong>{summary.percent}% complete</strong>
        <div className="progress-track large" aria-hidden="true">
          <span style={{ width: `${summary.percent}%` }} />
        </div>
        {summary.nextTodo
          ? <p>Next: {summary.nextTodo.label}</p>
          : <p>All learning tasks are complete.</p>}
      </article>

      {learningTopics.map(topic => {
        const items = todoItems.filter(item => item.topicId === topic.id)
        const done = items.filter(item => todoState[item.id]).length
        return (
          <article className="panel todo-topic" key={topic.id}>
            <div className="topic-heading">
              <div>
                <p className="eyebrow">{topic.group}</p>
                <h3>{topic.title}</h3>
              </div>
              <StatusChip tone={done === items.length ? 'ok' : 'neutral'}>{done}/{items.length}</StatusChip>
            </div>
            <div className="todo-list">
              {items.map(item => (
                <label className={`todo-row ${todoState[item.id] ? 'done' : ''}`} key={item.id}>
                  <input
                    type="checkbox"
                    checked={Boolean(todoState[item.id])}
                    onChange={() => onToggleTodo(item.id)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </article>
        )
      })}
    </section>
  )
}

function GeminiPanel({
  form,
  setForm,
  setup,
  setupLoading,
  busy,
  error,
  response,
  onLoadSetup,
  onSubmit
}) {
  const currentTopic = topicById(form.topicId || learningTopics[0].id)
  return (
    <section className="gemini-layout">
      <article className="panel gemini-setup">
        <PanelTitle icon={<Sparkles size={18} />} title="Gemini Flash Setup" />
        <div className="setup-grid">
          <SetupItem
            label="CLI"
            ok={Boolean(setup?.geminiCli?.installed)}
            value={setup?.geminiCli?.installed ? setup.geminiCli.path : 'Not installed locally'}
          />
          <SetupItem
            label="Model"
            ok
            value="gemini-2.5-flash only"
          />
          <SetupItem
            label="Multica profiles"
            ok={Boolean(setup?.multicaProfile?.ok)}
            value={setup?.multicaProfile?.message || 'Not checked yet'}
          />
        </div>
        <div className="command-list">
          <code>{setup?.geminiCli?.installCommand || 'npm install -g @google/gemini-cli'}</code>
          <code>{setup?.geminiCli?.flashCommand || 'gemini -m gemini-2.5-flash'}</code>
          <code>export GEMINI_API_KEY=your_key_here</code>
        </div>
        {setup?.steps?.length > 0 && (
          <ol className="practice-steps">
            {setup.steps.map(step => <li key={step}>{step}</li>)}
          </ol>
        )}
        <button type="button" onClick={onLoadSetup} disabled={setupLoading}>
          <RefreshCw size={16} aria-hidden="true" /> {setupLoading ? 'Checking...' : 'Check setup'}
        </button>
      </article>

      <article className="panel gemini-ask">
        <PanelTitle icon={<Sparkles size={18} />} title="Ask Gemini" />
        <div className="agent-form-stack">
          <label>
            Topic
            <select value={form.topicId} onChange={event => setForm(current => ({ ...current, topicId: event.target.value }))}>
              {learningTopics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
            </select>
          </label>
          <label>
            Mode
            <select value={form.mode} onChange={event => setForm(current => ({ ...current, mode: event.target.value }))}>
              <option value={geminiModes.explain}>Explain</option>
              <option value={geminiModes.review}>Review my answer</option>
              <option value={geminiModes.nextPractice}>Next practice</option>
            </select>
          </label>
          <label>
            Question
            <textarea
              value={form.question}
              onChange={event => setForm(current => ({ ...current, question: event.target.value }))}
              placeholder={`Ask about ${currentTopic.title.toLowerCase()}`}
            />
          </label>
          <label>
            Your practice answer
            <textarea
              value={form.answer}
              onChange={event => setForm(current => ({ ...current, answer: event.target.value }))}
              placeholder="Paste your attempt here for Flash review."
            />
          </label>
          <button type="button" className="primary" onClick={onSubmit} disabled={busy}>
            <Sparkles size={16} aria-hidden="true" /> {busy ? 'Asking...' : 'Ask Flash'}
          </button>
        </div>
      </article>

      <article className={`panel gemini-result ${response?.ok ? 'ok' : ''}`}>
        <PanelTitle icon={<CheckCircle2 size={18} />} title="Response" />
        {error && <p className="error-text">{error}</p>}
        {!error && !response && <p className="empty">Ask Gemini Flash or check setup to see status here.</p>}
        {response && (
          <>
            <div className="result-meta">
              <StatusChip tone={response.ok ? 'ok' : response.disabled ? 'warn' : 'neutral'}>
                {response.ok ? 'ok' : response.disabled ? 'disabled' : 'check'}
              </StatusChip>
              <span>{response.model}</span>
              <span>{response.remaining} requests left today</span>
            </div>
            <pre>{response.text || response.message}</pre>
          </>
        )}
      </article>
    </section>
  )
}

function SetupItem({ label, ok, value }) {
  return (
    <div className={`setup-item ${ok ? 'ok' : ''}`}>
      <span>{label}</span>
      <strong>{ok ? 'Ready' : 'Check'}</strong>
      <small>{value}</small>
    </div>
  )
}

function PanelTitle({ icon, title }) {
  return (
    <div className="panel-title">
      {icon}
      <h3>{title}</h3>
    </div>
  )
}

function Status({ label, active, value }) {
  return (
    <div className={`status-row ${active ? 'active' : ''}`}>
      <span>{label}</span>
      <strong>{active ? value : 'empty'}</strong>
    </div>
  )
}

function StatusChip({ children, tone = 'neutral' }) {
  return <span className={`status-chip ${tone}`}>{children}</span>
}

function valueOrNull(result) {
  return result.status === 'fulfilled' ? result.value : null
}

function valueOrDefault(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback
}

function commandErrorMessage(error) {
  const message = error?.body?.stderr || error?.body?.message || error?.message || 'Unknown Multica control error'
  if (message.includes('not authenticated')) {
    return `${message}. Run multica setup self-host --port 18080 --frontend-port 13000.`
  }
  if (message.includes('Could not start Multica CLI')) {
    return `${message}. Install the Multica CLI with brew install multica-ai/tap/multica.`
  }
  if (message.includes('connection refused') || message.includes('server')) {
    return `${message}. Start Docker and the local Multica dev server.`
  }
  return message
}

function geminiErrorMessage(error) {
  return error?.body?.message || error?.message || 'Unknown Gemini bridge error'
}

function loadStoredTodoState() {
  if (typeof window === 'undefined') {
    return initialTodoState()
  }
  try {
    const raw = window.localStorage.getItem(TODO_STORAGE_KEY)
    return raw ? JSON.parse(raw) : initialTodoState()
  } catch {
    return initialTodoState()
  }
}

function shortId(value) {
  if (!value) {
    return ''
  }
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value
}

createRoot(document.getElementById('root')).render(<App />)
