import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bot,
  Cpu,
  FileText,
  GitBranch,
  ListChecks,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Server,
  Terminal,
  UserPlus,
  Workflow
} from 'lucide-react'
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

function App() {
  return <MulticaControlCenter />
}

function MulticaControlCenter() {
  const [state, setState] = useState(createEmptyControlCenterState)
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

  const runtimes = state.runtimes.map(displayRuntime)
  const agents = state.agents.map(displayAgent)
  const projects = state.projects.map(displayProject)
  const repos = state.repos.map(displayRepo)
  const issues = state.issues.map(displayIssue)
  const onlineRuntimes = runtimes.filter(runtime => runtime.status === 'online')
  const daemonReady = Boolean(state.status?.ok)

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
            <p className="eyebrow">Real Multica bridge</p>
            <h2>Manage local agents, runtimes, projects, issues, and command output.</h2>
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
          <AgentMetric icon={<Cpu size={18} />} label="Online runtimes" value={onlineRuntimes.length} detail={`${runtimes.length} registered`} />
          <AgentMetric icon={<Bot size={18} />} label="Agents" value={agents.length} detail="configured teammates" />
          <AgentMetric icon={<GitBranch size={18} />} label="Projects" value={projects.length} detail={`${repos.length} workspace repos`} />
          <AgentMetric icon={<ListChecks size={18} />} label="Issues" value={issues.length} detail="visible in workspace" />
        </section>

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

function shortId(value) {
  if (!value) {
    return ''
  }
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value
}

createRoot(document.getElementById('root')).render(<App />)
