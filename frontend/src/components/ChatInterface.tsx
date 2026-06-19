import { useState, useEffect, useRef } from 'react';
import { apiService, type AskResponse } from '../api/services';
import { Send, MessageCircle } from 'lucide-react';
import FormattedResponse from './FormattedResponse';

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  context?: string;
}

interface ChatInterfaceProps {
  repoName: string;
}

export default function ChatInterface({ repoName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<{ avgPrecision: number; avgSimilarity: number; totalQueries: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMetrics = async () => {
    try {
      const data = await apiService.getMetrics(repoName);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [repoName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: question,
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError('');

    try {
      const response: AskResponse = await apiService.askQuestion({
        repoName,
        question,
      });

      const assistantMessage: ChatMessage = {
        type: 'assistant',
        content: response.answer,
        context: response.context,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setQuestion('');
      setTimeout(loadMetrics, 2000);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageCircle size={24} />
          <h3>Ask about {repoName}</h3>
        </div>
        {metrics && metrics.totalQueries > 0 && (
          <div className="chat-metrics-summary" style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
            <span title="Average Precision of retrieved context" style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 500 }}>
              🎯 Prec: {(metrics.avgPrecision * 100).toFixed(0)}%
            </span>
            <span title="Average Cosine Similarity" style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 500 }}>
              📊 Sim: {metrics.avgSimilarity.toFixed(2)}
            </span>
            <span title="Total queries asked" style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 500 }}>
              💬 Qs: {metrics.totalQueries}
            </span>
          </div>
        )}
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Ask a question about the repository to get started.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <div className="message-content">
                <FormattedResponse content={msg.content} />
              </div>
              {msg.context && (
                <details className="context">
                  <summary>Context</summary>
                  <pre>
                    {typeof msg.context === 'string' 
                      ? msg.context 
                      : JSON.stringify(msg.context, null, 2)
                    }
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
        {loading && <div className="message assistant">Thinking...</div>}
        {error && <div className="error">{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask your question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !question.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
