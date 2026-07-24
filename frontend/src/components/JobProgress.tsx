import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, Check } from 'lucide-react';
import { apiService } from '../api/services';

interface JobProgressProps {
  jobId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

interface StepItem {
  id: number;
  label: string;
  minProgress: number;
}

const INGEST_STEPS: StepItem[] = [
  { id: 1, label: 'Fetching repository file tree from GitHub API', minProgress: 0 },
  { id: 2, label: 'Filtering files and parsing code structure', minProgress: 15 },
  { id: 3, label: 'Chunking code blocks recursively by syntax', minProgress: 40 },
  { id: 4, label: 'Generating semantic vectors via LLM embeddings', minProgress: 70 },
  { id: 5, label: 'Storing embeddings and optimizing pgvector index', minProgress: 90 },
];

export const JobProgress: React.FC<JobProgressProps> = ({ jobId, onComplete, onError }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('waiting');
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const checkStatus = async () => {
      try {
        const data = await apiService.getJobStatus(jobId);
        
        if (data.status === 'completed') {
          setProgress(100);
          setStatus('completed');
          clearInterval(interval);
          setTimeout(onComplete, 1200);
        } else if (data.status === 'failed') {
          setStatus('failed');
          clearInterval(interval);
          onError(data.failedReason || 'Ingestion failed');
        } else {
          setStatus(data.status);
          if (typeof data.progress === 'number') {
            setProgress(data.progress);
          } else {
            setProgress(prev => (prev < 90 ? prev + 3 : prev));
          }
        }
      } catch (err) {
        console.error('Failed to update job status:', err);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 2500);
    
    return () => clearInterval(interval);
  }, [jobId, onComplete, onError]);

  const getStepStatus = (step: StepItem) => {
    if (status === 'failed') {
      if (progress >= step.minProgress && progress < step.minProgress + 20) {
        return 'failed';
      }
    }
    if (progress === 100) return 'completed';
    if (progress >= step.minProgress) {
      const nextStep = INGEST_STEPS.find(s => s.id === step.id + 1);
      if (!nextStep || progress < nextStep.minProgress) {
        return 'active';
      }
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="glass-card" style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem', textAlign: 'center', alignItems: 'center' }}>
        <div style={{
          display: 'inline-flex',
          padding: '0.85rem',
          borderRadius: '50%',
          background: status === 'failed' ? 'var(--error-glow)' : 'var(--primary-glow)',
          color: status === 'failed' ? 'var(--error)' : 'var(--primary)',
          marginBottom: '0.5rem'
        }}>
          {status === 'failed' ? (
            <XCircle size={28} />
          ) : status === 'completed' ? (
            <CheckCircle2 size={28} color="var(--success)" />
          ) : (
            <Loader2 size={28} className="icon-spin" />
          )}
        </div>
        
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          {status === 'completed' ? 'Codebase Indexing Complete' : 
           status === 'failed' ? 'Ingestion Failed' : 
           'Ingesting Codebase'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0, maxWidth: '360px' }}>
          {status === 'completed' ? 'Vectors optimized and pgvector storage loaded. Launching workspace...' :
           status === 'failed' ? 'An issue occurred during file analysis or indexing.' :
           'Processing repository trees and building semantic index chunks. This might take a few moments.'}
        </p>
      </div>

      {status !== 'failed' && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Pipeline Build Progress</span>
            <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{progress}%</span>
          </div>
          <div className="metric-track" style={{ height: '5px', borderRadius: '9999px' }}>
            <div className="metric-fill" style={{ width: `${progress}%`, height: '100%', borderRadius: '9999px' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          Active Processing Timeline
        </h4>
        
        <div className="timeline">
          {INGEST_STEPS.map((step) => {
            const stepStatus = getStepStatus(step);
            return (
              <div key={step.id} className={`timeline-step ${stepStatus}`}>
                <div className="timeline-marker">
                  {stepStatus === 'completed' ? (
                    <Check size={12} strokeWidth={3} />
                  ) : stepStatus === 'active' ? (
                    <Loader2 size={12} className="icon-spin" />
                  ) : stepStatus === 'failed' ? (
                    <XCircle size={12} />
                  ) : (
                    <span style={{ fontSize: '0.7rem' }}>{step.id}</span>
                  )}
                </div>
                <div className="timeline-content">
                  <span className="timeline-title">
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
