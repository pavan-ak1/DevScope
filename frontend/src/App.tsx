import { useState, useEffect } from 'react'
import { apiService, type Repository } from './api/services'
import { IngestForm } from './components/IngestForm'
import { JobProgress } from './components/JobProgress'
import ChatInterface from './components/ChatInterface'
import RepositorySelector from './components/RepositorySelector'
import { Database, BookOpen, Layers, BarChart3, Activity, Sparkles, Menu, X, Plus, ChevronRight, HardDrive, RefreshCw } from 'lucide-react'

type AppState = 'select' | 'ingest' | 'ingesting' | 'chat'

function App() {
  const [appState, setAppState] = useState<AppState>('select')
  const [currentRepo, setCurrentRepo] = useState('')
  const [jobId, setJobId] = useState('')
  const [error, setError] = useState('')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'active' | 'waking' | 'offline'>('checking')

  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadRepositories = async () => {
    try {
      setLoadingRepos(true)
      const repos = await apiService.getRepositories()
      setRepositories(repos)
    } catch (err) {
      setError('Failed to load repositories')
    } finally {
      setLoadingRepos(false)
    }
  }

  // Poll or ping backend to wake it up
  const checkBackendHealth = async (isManual = false) => {
    if (isManual) {
      setBackendStatus('checking');
    }

    let resolved = false;
    const timeoutId = window.setTimeout(() => {
      if (!resolved) {
        setBackendStatus('waking');
      }
    }, 1500);

    try {
      const res = await apiService.checkHealth();
      resolved = true;
      clearTimeout(timeoutId);
      if (res && res.status === 'ok') {
        setBackendStatus('active');
        loadRepositories();
      } else {
        throw new Error('Invalid status');
      }
    } catch (err) {
      resolved = true;
      clearTimeout(timeoutId);
      console.error('Backend connection check failed:', err);
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkBackendHealth();

    // Set up a periodic check every 30 seconds to keep it alive or reconnect
    const intervalId = setInterval(() => {
      setBackendStatus(prev => {
        if (prev === 'active' || prev === 'offline') {
          apiService.checkHealth()
            .then(res => {
              if (res && res.status === 'ok') {
                setBackendStatus('active');
              }
            })
            .catch(() => {
              setBackendStatus('offline');
            });
        }
        return prev;
      });
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleIngest = async (repoUrl: string, repoName: string) => {
    try {
      setError('')
      const response = await apiService.ingestRepository({ repoUrl, repoName })
      setJobId(response.jobId)
      setCurrentRepo(repoName)
      setAppState('ingesting')
    } catch (err) {
      setError('Failed to start ingestion')
    }
  }

  const handleJobComplete = async () => {
    await loadRepositories()
    setAppState('chat')
  }

  const handleJobError = (errorMessage: string) => {
    setError(errorMessage)
    setAppState('select')
    setCurrentRepo('')
  }

  const handleSelectRepository = (repoName: string) => {
    setCurrentRepo(repoName)
    setAppState('chat')
    setError('')
    setMobileMenuOpen(false)
  }

  const handleShowIngest = () => {
    setAppState('ingest')
    setError('')
    setMobileMenuOpen(false)
  }

  const handleReset = () => {
    setAppState('select')
    setCurrentRepo('')
    setJobId('')
    setError('')
    setMobileMenuOpen(false)
  }

  // Calculate Aggregated Metrics
  const totalRepos = repositories.length
  const totalQueries = repositories.reduce((sum, r) => sum + (r.totalQueries || 0), 0)

  const reposWithQueries = repositories.filter(r => r.totalQueries && r.totalQueries > 0)
  const avgPrecision = reposWithQueries.length > 0
    ? reposWithQueries.reduce((sum, r) => sum + (r.avgPrecision || 0), 0) / reposWithQueries.length
    : 0

  if (backendStatus !== 'active') {
    return (
      <div className="backend-loader-overlay">
        <div className={`backend-loader-card ${backendStatus}`}>
          <div className="backend-loader-logo">
            <BookOpen size={32} />
          </div>
          <h1 className="backend-loader-title">DevScope</h1>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
            <div className={`backend-loader-spinner ${backendStatus}`}>
              <div className="spinner-orbit-1"></div>
              <div className="spinner-orbit-2"></div>
              <div className="spinner-core"></div>
            </div>

            <div className="backend-loader-status-text">
              {backendStatus === 'checking' && 'Initializing Secure Connection...'}
              {backendStatus === 'waking' && 'Waking Up Backend Services...'}
              {backendStatus === 'offline' && 'Connection Failed'}
            </div>

            <p className="backend-loader-desc">
              {backendStatus === 'checking' && 'Pinging the API server to establish session.'}
              {backendStatus === 'waking' && 'DevScope is hosted on Render free tier. The server spins down when idle and is currently starting up (this may take up to 60 seconds).'}
              {backendStatus === 'offline' && 'Could not reach the DevScope API. Please verify the backend is running and click retry.'}
            </p>

            {backendStatus === 'offline' && (
              <button className="backend-loader-retry-btn" onClick={() => checkBackendHealth(true)}>
                <RefreshCw size={14} /> Try Connecting Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Cast backendStatus to bypass type narrowing from the early return above.
  // In the main layout, we keep these status checks for robustness.
  const currentStatus = backendStatus as 'checking' | 'active' | 'waking' | 'offline';

  return (
    <div className="app-layout">
      {/* Sidebar Backdrop Overlay on Mobile */}
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar Dashboard Left Panel */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header" onClick={handleReset} style={{ cursor: 'pointer', userSelect: 'none' }}>
          <div className="sidebar-logo">
            <BookOpen size={16} />
          </div>
          <span className="sidebar-title">DevScope</span>
        </div>

        <div className="sidebar-content">
          <div>
            <div className="sidebar-section-title">Active Workspaces</div>
            {loadingRepos ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <span className="icon-spin">⏳</span> Loading workspaces...
              </div>
            ) : (
              <RepositorySelector
                repositories={repositories}
                currentRepo={appState === 'chat' ? currentRepo : ''}
                onSelectRepository={handleSelectRepository}
                onShowIngestForm={handleShowIngest}
                onRefresh={loadRepositories}
              />
            )}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div className="sidebar-section-title">System Health</div>
            <div className="health-status-container">
              <div className="health-status-row">
                <span className={`health-indicator-dot ${currentStatus}`}></span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {currentStatus === 'active' && 'Backend Active'}
                  {currentStatus === 'checking' && 'Checking Status...'}
                  {currentStatus === 'waking' && 'Waking Server...'}
                  {currentStatus === 'offline' && 'Backend Offline'}
                </span>
              </div>
              <p className="health-status-message">
                {currentStatus === 'active' && 'Hybrid LLM inference online & responsive.'}
                {currentStatus === 'checking' && 'Pinging backend to verify connectivity.'}
                {currentStatus === 'waking' && 'Render free tier cold-start detected. Waking up instance...'}
                {currentStatus === 'offline' && 'Could not connect to backend server.'}
              </p>
              {currentStatus === 'offline' && (
                <button className="health-retry-btn" onClick={() => checkBackendHealth(true)}>
                  🔄 Retry Connection
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="main-content">
        {/* Compact Navigation Bar */}
        <header className="app-header-compact">
          <div className="app-header-info">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                padding: '0.25rem',
                marginRight: '0.4rem',
                borderRadius: '4px'
              }}
              title="Toggle Sidebar"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {appState === 'chat' && currentRepo ? (
              <>
                <Database size={14} color="var(--primary)" />
                <h2>Workspace: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentRepo}</span></h2>
              </>
            ) : appState === 'ingesting' ? (
              <>
                <span className="icon-spin">⏳</span>
                <h2>Analyzing source code...</h2>
              </>
            ) : appState === 'ingest' ? (
              <>
                <Layers size={14} color="var(--secondary)" />
                <h2>Connect New Repository</h2>
              </>
            ) : (
              <>
                <Sparkles size={14} color="var(--accent)" />
                <h2>Workspace Dashboard</h2>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {appState !== 'select' && (
              <button onClick={handleReset} className="secondary-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)' }}>
                ← Dashboard Home
              </button>
            )}
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Dynamic Route Rendering */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Welcome Screen / Stats Dashboard */}
          {appState === 'select' && (
            <div className="welcome-container">
              <div className="welcome-header">
                <h1>DevScope Codebase Hub</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                  Semantic code search and real-time retrieval precision metrics.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Active Workspaces</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <Layers size={16} color="var(--primary)" />
                    <span className="stat-value">{totalRepos}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Evaluated Queries</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <BarChart3 size={16} color="var(--secondary)" />
                    <span className="stat-value">{totalQueries}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Mean Retrieval Precision</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <Activity size={16} color="var(--success)" />
                    <span className="stat-value">
                      {totalQueries > 0 ? `${(avgPrecision * 100).toFixed(0)}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Index Workspace section */}
              <div className="hub-section">
                <div className="hub-title">
                  <span>Connected Repositories</span>
                  {repositories.length > 0 && (
                    <button onClick={handleShowIngest} className="primary-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
                      <Plus size={14} /> Connect Repository
                    </button>
                  )}
                </div>

                <div className="hub-table-wrapper">
                  {repositories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
                      <HardDrive size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.6 }} />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Repositories Indexed</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Start by connecting a GitHub repository to enable semantic search capabilities.
                      </p>
                      <button onClick={handleShowIngest} className="primary-btn">
                        <Plus size={14} /> Connect your first repository
                      </button>
                    </div>
                  ) : (
                    <table className="hub-table">
                      <thead>
                        <tr>
                          <th>Repository Name</th>
                          <th>Date Ingested</th>
                          <th>Total Queries</th>
                          <th>Mean Precision</th>
                          <th>Cosine Similarity</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {repositories.map((repo) => (
                          <tr key={repo.name} onClick={() => handleSelectRepository(repo.name)}>
                            <td>
                              <div className="hub-repo-name">
                                <Database size={13} color="var(--primary)" />
                                <span>{repo.name}</span>
                              </div>
                            </td>
                            <td>{new Date(repo.ingestedAt).toLocaleDateString()}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{repo.totalQueries || 0}</td>
                            <td>
                              {repo.totalQueries && repo.totalQueries > 0 ? (
                                <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                                  🎯 {((repo.avgPrecision ?? 0) * 100).toFixed(0)}%
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>
                              {repo.totalQueries && repo.totalQueries > 0 ? (
                                `📊 ${(repo.avgSimilarity ?? 0).toFixed(2)}`
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', width: '40px' }}>
                              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Infrastructure details */}
              <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>RAG Pipeline Diagnostics</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Embeds repository text files using Mistral API (`mistral-embed`) and queries via Groq (`llama-3.1-8b-instant`). Utilizes PostgreSQL with `pgvector` for hybrid semantic and text search, managed asynchronously via Redis and BullMQ queues.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    PostgreSQL + pgvector
                  </span>
                  <span style={{ display: 'inline-flex', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Groq (Llama 3.1)
                  </span>
                  <span style={{ display: 'inline-flex', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Mistral Embed
                  </span>
                  <span style={{ display: 'inline-flex', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Redis + BullMQ
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* Ingest Repository Form Screen */}
          {appState === 'ingest' && (
            <div className="ingest-wrapper">
              <IngestForm onSubmit={handleIngest} isLoading={false} />
            </div>
          )}

          {/* Ingestion Progress Screen */}
          {appState === 'ingesting' && jobId && (
            <div style={{ margin: 'auto', width: '100%', padding: '1.5rem' }}>
              <JobProgress
                jobId={jobId}
                onComplete={handleJobComplete}
                onError={handleJobError}
              />
            </div>
          )}

          {/* Chat Workspace with Selected Repository */}
          {appState === 'chat' && currentRepo && (
            <ChatInterface repoName={currentRepo} />
          )}

        </div>
      </main>
    </div>
  )
}

export default App
