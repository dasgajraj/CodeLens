import { useEffect, useMemo, useReducer, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Command,
  Gauge,
  GitBranch,
  Lock,
  Moon,
  PanelRight,
  Play,
  ShieldCheck,
  Sparkles,
  SunMedium,
} from 'lucide-react'
import './App.css'

type ThemeMode = 'dark' | 'light'

type AppState = {
  theme: ThemeMode
  isAuthenticated: boolean
}

type Action =
  | { type: 'toggle-theme' }
  | { type: 'toggle-auth' }

const initialState: AppState = {
  theme: 'dark',
  isAuthenticated: true,
}

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'toggle-theme':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' }
    case 'toggle-auth':
      return { ...state, isAuthenticated: !state.isAuthenticated }
    default:
      return state
  }
}

const editorSnippet = `import { reviewCode } from "@codelens/sdk";

export async function runAnalysis() {
  const result = await reviewCode({
    repository: "frontend/src/App.tsx",
    prompt: "Surface regressions, risky async paths, and UX polish gaps.",
    mode: "autofix",
  });

  return {
    summary: result.summary,
    confidence: result.confidence,
    suggestions: result.suggestions.slice(0, 3),
  };
}`

const workspaceCards = [
  { label: 'Review latency', value: '182ms', meta: '12% faster than yesterday', icon: Gauge },
  { label: 'Protected branches', value: '24', meta: 'Policy synced 3 mins ago', icon: GitBranch },
  { label: 'Cloud checks', value: '98.4%', meta: 'No flaky suites detected', icon: Cloud },
]

const suggestionChips = ['Refactor effect ownership', 'Tighten auth middleware', 'Improve test naming']

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [panelOpen, setPanelOpen] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  const editorTheme = state.theme === 'dark' ? 'vs-dark' : 'light'
  const authLabel = state.isAuthenticated ? 'Authenticated' : 'Guest mode'

  const statusItems = useMemo(
    () => [
      {
        title: 'Inference stream',
        value: state.isAuthenticated ? 'Live' : 'Paused',
        detail: state.isAuthenticated ? 'AI copilots attached to workspace' : 'Sign in to sync suggestions',
        icon: Bot,
      },
      {
        title: 'Theme store',
        value: state.theme === 'dark' ? 'Dark' : 'Light',
        detail: 'Global preference reflected across shell surfaces',
        icon: state.theme === 'dark' ? Moon : SunMedium,
      },
      {
        title: 'Secure reviews',
        value: 'Enabled',
        detail: 'Branch protections and policy scans are active',
        icon: ShieldCheck,
      },
    ],
    [state.isAuthenticated, state.theme],
  )

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <main className="dashboard" aria-label="CodeLens dashboard">
        <section className="hero-panel surface">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Modern Dark Engineering
            </div>
            <h1>CodeLens turns code review into a calm, high-signal workspace.</h1>
            <p>
              A human-crafted dashboard for shipping safer code, faster feedback, and
              AI suggestions that feel integrated instead of bolted on.
            </p>
          </div>

          <div className="hero-actions">
            <button className="primary-button" type="button">
              <Play size={16} />
              Run Deep Review
            </button>
            <button className="ghost-button" type="button">
              <Command size={16} />
              Open Command Bar
            </button>
          </div>

          <div className="status-strip">
            <span className="status-pill status-pill-live">
              <CheckCircle2 size={14} />
              {authLabel}
            </span>
            <span className="status-pill">
              <Bell size={14} />
              3 high-confidence suggestions
            </span>
            <span className="status-pill">
              <Sparkles size={14} />
              Spring transitions enabled
            </span>
          </div>
        </section>

        <section className="left-rail surface glass-panel">
          <div className="rail-header">
            <div>
              <p className="section-label">Workspace</p>
              <h2>Signal overview</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => dispatch({ type: 'toggle-theme' })}
              aria-label="Toggle theme"
            >
              {state.theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="metric-list">
            {workspaceCards.map(({ label, value, meta, icon: Icon }) => (
              <article className="metric-card" key={label}>
                <div className="metric-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="metric-label">{label}</p>
                  <strong>{value}</strong>
                  <span>{meta}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="store-panel">
            <div className="store-header">
              <div>
                <p className="section-label">Global state</p>
                <h3>Redux-ready shell</h3>
              </div>
              <button
                className="ghost-button compact"
                type="button"
                onClick={() => dispatch({ type: 'toggle-auth' })}
              >
                <Lock size={14} />
                {state.isAuthenticated ? 'Sign out' : 'Sign in'}
              </button>
            </div>

            <div className="store-grid">
              {statusItems.map(({ title, value, detail, icon: Icon }) => (
                <article className="store-card" key={title}>
                  <Icon size={18} />
                  <p>{title}</p>
                  <strong>{value}</strong>
                  <span>{detail}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="editor-stage surface">
          <div className="editor-header">
            <div>
              <p className="section-label">Live editor</p>
              <h2>Monaco-powered review session</h2>
            </div>
            <button
              className="ghost-button compact"
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
            >
              <PanelRight size={14} />
              {panelOpen ? 'Hide AI panel' : 'Show AI panel'}
            </button>
          </div>

          <div className={`editor-layout ${panelOpen ? 'panel-open' : 'panel-closed'}`}>
            <div className="editor-frame">
              <div className="editor-toolbar">
                <div className="traffic-lights" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="editor-tab">frontend/src/App.tsx</span>
                <span className="editor-badge">Autofix preview</span>
              </div>

              <div className="editor-wrapper">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={editorSnippet}
                  theme={editorTheme}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    padding: { top: 18, bottom: 18 },
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbersMinChars: 3,
                    fontFamily: "'SFMono-Regular', 'SF Mono', 'Fira Code', monospace",
                    readOnly: true,
                  }}
                />
              </div>
            </div>

            <aside className={`ai-panel glass-panel ${panelOpen ? 'is-visible' : 'is-hidden'}`}>
              <div className="ai-panel-header">
                <div>
                  <p className="section-label">AI reviewer</p>
                  <h3>Floating suggestion rail</h3>
                </div>
                <span className="confidence-pill">92% confidence</span>
              </div>

              <article className="ai-callout">
                <div className="callout-icon">
                  <Bot size={18} />
                </div>
                <div>
                  <strong>Ownership gap detected</strong>
                  <p>
                    Move side effects into a dedicated orchestration layer to keep the
                    component render path deterministic.
                  </p>
                </div>
              </article>

              <div className="chip-row">
                {suggestionChips.map((chip) => (
                  <button className="chip" key={chip} type="button">
                    {chip}
                  </button>
                ))}
              </div>

              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-marker" />
                  <div>
                    <strong>Guard auth mutations</strong>
                    <p>Check middleware ownership before dispatching optimistic updates.</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <span className="timeline-marker" />
                  <div>
                    <strong>Reduce visual noise</strong>
                    <p>Fade tertiary metadata until hover to preserve scan speed.</p>
                  </div>
                </div>
              </div>

              <button className="primary-button full-width" type="button">
                Apply AI patch
                <ChevronRight size={16} />
              </button>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
