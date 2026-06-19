import { useState } from 'react'
import { apiService } from './api/services'
import { IngestForm } from './components/IngestForm'
import { JobProgress } from './components/JobProgress'
import ChatInterface from './components/ChatInterface'
import RepositorySelector from './components/RepositorySelector'
import './styles.css'

type AppState = 'select' | 'ingest' | 'ingesting' | 'chat'

function App() {
  const [appState, setAppState] = useState<AppState>('select')
  const [currentRepo, setCurrentRepo] = useState('')
  const [jobId, setJobId] = useState('')
  const [error, setError] = useState('')

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

  const handleJobComplete = () => {
    setAppState('chat')
  }

  const handleJobError = (errorMessage: string) => {
    setError(errorMessage)
    setAppState('select')
  }

  const handleReset = () => {
    setAppState('select')
    setCurrentRepo('')
    setJobId('')
    setError('')
  }

  return (
    <div className={`app ${appState === 'chat' ? 'chat-active' : ''}`}>
      <header className="app-header">
        <h1>📚 Repository Explainer</h1>
        <p>Ask questions about any code repository using AI</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {appState === 'select' && (
          <RepositorySelector
            onSelectRepository={(repoName) => {
              setCurrentRepo(repoName)
              setAppState('chat')
            }}
            onShowIngestForm={() => setAppState('ingest')}
          />
        )}

        {appState === 'ingest' && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <IngestForm onSubmit={handleIngest} isLoading={false} />
            <button
              onClick={() => setAppState('select')}
              className="secondary-btn"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              ← Back to Repositories
            </button>
          </div>
        )}

        {appState === 'ingesting' && jobId && (
          <JobProgress
            jobId={jobId}
            onComplete={handleJobComplete}
            onError={handleJobError}
          />
        )}

        {appState === 'chat' && currentRepo && (
          <div className="chat-container">
            <div className="chat-header">
              <h2>🤖 Chat with {currentRepo}</h2>
              <button onClick={handleReset} className="reset-btn">
                ← New Repository
              </button>
            </div>
            <ChatInterface repoName={currentRepo} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App


