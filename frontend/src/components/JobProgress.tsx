import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../api/services';

interface JobProgressProps {
  jobId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

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
          setTimeout(onComplete, 1000);
        } else if (data.status === 'failed') {
          setStatus('failed');
          clearInterval(interval);
          onError(data.failedReason || 'Ingestion failed');
        } else {
          setStatus(data.status);
          if (data.progress) {
            setProgress(data.progress);
          } else {
             setProgress(prev => prev < 90 ? prev + 5 : prev);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 3000);
    
    return () => clearInterval(interval);
  }, [jobId, onComplete, onError]);

  return (
    <div className="glass-card loader-view">
      {status === 'failed' ? (
        <XCircle size={64} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
      ) : status === 'completed' ? (
        <CheckCircle size={64} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
      ) : (
        <Loader2 size={64} className="icon-spin" />
      )}
      
      <h2>
        {status === 'completed' ? 'Ingestion Complete!' : 
         status === 'failed' ? 'Ingestion Failed' : 
         'Analyzing Repository...'}
      </h2>
      
      {status !== 'failed' && status !== 'completed' && (
        <p className="subtitle" style={{ marginBottom: 0 }}>This might take a few minutes depending on the size of the repository.</p>
      )}

      {(status === 'active' || status === 'waiting' || status === 'completed') && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
};
