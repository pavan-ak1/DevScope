import { useState, useEffect } from 'react';
import { apiService, type Repository } from '../api/services';
import { MessageCircle, Database, Trash2, AlertTriangle } from 'lucide-react';

interface RepositorySelectorProps {
  onSelectRepository: (repoName: string) => void;
  onShowIngestForm: () => void;
}

export default function RepositorySelector({ onSelectRepository, onShowIngestForm }: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const repos = await apiService.getRepositories();
      setRepositories(repos);
    } catch (err) {
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const [repoToDelete, setRepoToDelete] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, repoName: string) => {
    e.stopPropagation();
    setRepoToDelete(repoName);
  };

  const handleConfirmDelete = async () => {
    if (!repoToDelete) return;
    const name = repoToDelete;
    setRepoToDelete(null);

    try {
      setLoading(true);
      setError('');
      await apiService.deleteRepository(name);
      await loadRepositories();
    } catch (err) {
      console.error(err);
      setError('Failed to delete repository');
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setRepoToDelete(null);
  };

  if (loading) {
    return (
      <div className="glass-card">
        <div className="loader-view">
          <div className="icon-spin">⏳</div>
          <h2>Loading repositories...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card">
        <div style={{ textAlign: 'center' }}>
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={loadRepositories} className="primary-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ position: 'relative' }}>
      {repoToDelete && (
        <div className="delete-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertTriangle size={24} />
            </div>
            <h3>Delete Repository?</h3>
            <p>
              Are you sure you want to permanently delete repository <strong>{repoToDelete}</strong>?
              This will delete all stored vector embeddings and metrics.
            </p>
            <div className="delete-modal-actions">
              <button onClick={handleCancelDelete} className="delete-cancel-btn">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="delete-confirm-btn">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Database size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
        <h2>Select Repository</h2>
        <p className="subtitle">Choose an existing repository to chat with, or add a new one.</p>
      </div>

      {repositories.length === 0 ? (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            No repositories found. Start by ingesting your first repository.
          </p>
          <button onClick={onShowIngestForm} className="primary-btn">
            <Database size={20} style={{ marginRight: '0.5rem' }} />
            Add Repository
          </button>
        </div>
      ) : (
        <>
          <div className="repo-list" style={{ marginBottom: '1.5rem' }}>
            {repositories.map((repo) => (
              <div
                key={repo.name}
                className="repo-item"
                onClick={() => onSelectRepository(repo.name)}
                style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <MessageCircle size={20} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                  <div className="repo-info" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div className="repo-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repo.name}</div>
                    <div className="repo-date">
                      Ingested {new Date(repo.ingestedAt).toLocaleDateString()}
                    </div>
                    {repo.totalQueries && repo.totalQueries > 0 ? (
                      <div className="repo-metrics" style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span style={{ background: 'var(--bg-tertiary)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                          🎯 Prec: {((repo.avgPrecision ?? 0) * 100).toFixed(0)}%
                        </span>
                        <span style={{ background: 'var(--bg-tertiary)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                          📊 Sim: {(repo.avgSimilarity ?? 0).toFixed(2)}
                        </span>
                        <span style={{ background: 'var(--bg-tertiary)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                          💬 Qs: {repo.totalQueries}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <button
                    onClick={(e) => handleDeleteClick(e, repo.name)}
                    className="delete-repo-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--error-color)'; e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    title="Delete Repository"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="repo-arrow">→</div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={onShowIngestForm} 
            className="secondary-btn"
            style={{ width: '100%' }}
          >
            <Database size={20} style={{ marginRight: '0.5rem' }} />
            Add New Repository
          </button>
        </>
      )}
    </div>
  );
}

