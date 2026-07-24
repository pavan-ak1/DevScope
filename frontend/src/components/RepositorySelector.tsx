import { useState } from 'react';
import { apiService, type Repository } from '../api/services';
import { Database, Trash2, AlertTriangle, Plus, ChevronRight } from 'lucide-react';

interface RepositorySelectorProps {
  repositories: Repository[];
  currentRepo: string;
  onSelectRepository: (repoName: string) => void;
  onShowIngestForm: () => void;
  onRefresh: () => Promise<void>;
}

export default function RepositorySelector({
  repositories,
  currentRepo,
  onSelectRepository,
  onShowIngestForm,
  onRefresh
}: RepositorySelectorProps) {
  const [repoToDelete, setRepoToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteClick = (e: React.MouseEvent, repoName: string) => {
    e.stopPropagation();
    setRepoToDelete(repoName);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!repoToDelete) return;
    const name = repoToDelete;
    
    try {
      setDeleting(true);
      setDeleteError('');
      await apiService.deleteRepository(name);
      setRepoToDelete(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
      setDeleteError('Failed to delete repository');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (deleting) return;
    setRepoToDelete(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Delete Confirmation Modal Overlay */}
      {repoToDelete && (
        <div className="delete-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertTriangle size={20} />
            </div>
            <h3>Delete Repository?</h3>
            <p>
              Are you sure you want to permanently delete repository <strong>{repoToDelete}</strong>?
              This will remove all vector embeddings and metrics.
            </p>
            {deleteError && (
              <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                {deleteError}
              </p>
            )}
            <div className="delete-modal-actions">
              <button 
                onClick={handleCancelDelete} 
                className="delete-cancel-btn"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete} 
                className="delete-confirm-btn"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button 
          onClick={onShowIngestForm} 
          className="primary-btn"
          style={{ width: '100%', padding: '0.55rem 0.85rem', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
        >
          <Plus size={14} />
          Connect Repository
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginTop: '0.25rem' }}>
        {repositories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Database size={20} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
            <p>No ingested repos yet.</p>
          </div>
        ) : (
          <div className="repo-list">
            {repositories.map((repo) => {
              const isActive = currentRepo === repo.name;
              return (
                <div
                  key={repo.name}
                  className={`repo-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectRepository(repo.name)}
                >
                  <div className="repo-info">
                    <div className="repo-name" title={repo.name}>{repo.name}</div>
                    <div className="repo-date">
                      {new Date(repo.ingestedAt).toLocaleDateString()}
                    </div>
                    {repo.totalQueries && repo.totalQueries > 0 ? (
                      <div className="repo-badge-grid">
                        <span className="repo-badge" title="RAG Precision Score">
                          🎯 {((repo.avgPrecision ?? 0) * 100).toFixed(0)}%
                        </span>
                        <span className="repo-badge" title="Query Cosine Similarity">
                          📊 {(repo.avgSimilarity ?? 0).toFixed(2)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <button
                      onClick={(e) => handleDeleteClick(e, repo.name)}
                      className="delete-repo-btn"
                      title="Delete Repository"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={13} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
