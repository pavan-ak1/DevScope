import { useState, useEffect, useRef } from 'react';
import { apiService, type AskResponse } from '../api/services';
import { Send, MessageCircle, AlertCircle, ChevronDown, ChevronUp, FileCode, Check, Copy } from 'lucide-react';
import FormattedResponse from './FormattedResponse';

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  context?: string;
}

interface ChatInterfaceProps {
  repoName: string;
}

const QUICK_SUGGESTIONS = [
  { text: "Explain the overall architecture of this repository.", category: "Architecture" },
  { text: "Which files contain the core backend logic?", category: "Structure" },
  { text: "What third-party libraries or dependencies are used?", category: "Dependencies" },
  { text: "Are there any security or performance concerns?", category: "Security" }
];

interface ChunkResult {
  id: string;
  file_path: string;
  content: string;
  score?: number;
}

interface RetrievedContextViewerProps {
  context: string | ChunkResult[];
}

function RetrievedContextViewer({ context }: RetrievedContextViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  let chunks: ChunkResult[] = [];
  try {
    if (typeof context === 'string') {
      const parsed = JSON.parse(context);
      if (Array.isArray(parsed)) {
        chunks = parsed;
      }
    } else if (Array.isArray(context)) {
      chunks = context;
    }
  } catch (e) {
    chunks = [{ id: 'raw', file_path: 'Retrieved Context Raw', content: String(context) }];
  }

  // Set first chunk active by default once loaded
  useEffect(() => {
    if (chunks.length > 0 && !activeChunkId) {
      setActiveChunkId(chunks[0].id || 'chunk-0');
    }
  }, [chunks, activeChunkId]);

  if (chunks.length === 0) {
    return null;
  }

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy chunk:', err);
    }
  };

  const activeChunk = chunks.find((c, index) => (c.id || `chunk-${index}`) === activeChunkId) || chunks[0];

  return (
    <div style={{
      marginTop: '1rem',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(24, 24, 27, 0.4)',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1rem',
          cursor: 'pointer',
          background: 'rgba(255, 255, 255, 0.01)',
          borderBottom: isOpen ? '1px solid var(--border-color)' : 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCode size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Retrieved Context ({chunks.length} source chunks)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>{isOpen ? 'Close' : 'Inspect sources'}</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', height: '320px', background: 'rgba(9, 9, 11, 0.4)' }}>
          {/* Left panel: list of files */}
          <div style={{
            width: '200px',
            borderRight: '1px solid var(--border-color)',
            overflowY: 'auto',
            padding: '0.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            background: 'rgba(9, 9, 11, 0.2)'
          }}>
            {chunks.map((chunk, index) => {
              const cid = chunk.id || `chunk-${index}`;
              const isActive = activeChunkId === cid;
              const fileName = chunk.file_path.split('/').pop() || chunk.file_path;
              
              return (
                <div
                  key={cid}
                  onClick={() => setActiveChunkId(cid)}
                  style={{
                    padding: '0.45rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(79, 70, 229, 0.15)' : '1px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.1rem',
                    transition: 'all 0.15s ease',
                    minWidth: 0
                  }}
                >
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={chunk.file_path}>
                    📄 {fileName}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Score: {chunk.score ? chunk.score.toFixed(3) : (1 - index * 0.05).toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right panel: code snippet preview */}
          {activeChunk && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.85rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.01)'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeChunk.file_path}>
                  {activeChunk.file_path}
                </span>
                <button
                  onClick={() => handleCopy(activeChunk.id || 'current', activeChunk.content)}
                  className="secondary-btn"
                  style={{
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.68rem',
                    borderRadius: '4px',
                    gap: '0.25rem'
                  }}
                >
                  {copiedId === (activeChunk.id || 'current') ? (
                    <>
                      <Check size={11} color="var(--success)" />
                      <span style={{ color: 'var(--success)' }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div style={{
                flex: 1,
                overflow: 'auto',
                background: 'var(--bg-code)',
                padding: '0.75rem',
                display: 'flex',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.76rem',
                lineHeight: 1.5
              }}>
                {/* Code viewport with visual line-numbers gutter */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'right',
                  color: 'var(--text-muted)',
                  paddingRight: '0.75rem',
                  borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                  userSelect: 'none',
                  flexShrink: 0
                }}>
                  {activeChunk.content.split('\n').map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
                <pre style={{ margin: 0, paddingLeft: '0.75rem', overflow: 'visible', color: '#cbd5e1' }}>
                  <code>{activeChunk.content}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CopyResponseButtonProps {
  text: string;
}

function CopyResponseButton({ text }: CopyResponseButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy response:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="secondary-btn"
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.72rem',
        padding: '0.2rem 0.4rem',
        borderRadius: '4px',
        transition: 'all 0.15s ease',
        outline: 'none',
        userSelect: 'none',
        height: 'auto'
      }}
      title="Copy response"
    >
      {copied ? (
        <>
          <Check size={12} style={{ color: 'var(--success)' }} />
          <span style={{ color: 'var(--success)' }}>Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>Copy Response</span>
        </>
      )}
    </button>
  );
}

interface TypewriterMessageProps {
  content: string;
  animate: boolean;
}

function TypewriterMessage({ content, animate }: TypewriterMessageProps) {
  const [displayedText, setDisplayedText] = useState(animate ? '' : content);
  
  useEffect(() => {
    if (!animate) {
      setDisplayedText(content);
      return;
    }
    
    let index = 0;
    const intervalTime = 10;
    const textLength = content.length;
    
    let step = 1;
    if (textLength > 1200) step = 8;
    else if (textLength > 600) step = 5;
    else if (textLength > 200) step = 2;

    const timer = setInterval(() => {
      setDisplayedText(() => {
        index += step;
        if (index >= textLength) {
          clearInterval(timer);
          return content;
        }
        return content.substring(0, index);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [content, animate]);

  const isTyping = displayedText.length < content.length;

  return (
    <div style={{ position: 'relative' }}>
      <FormattedResponse content={displayedText} />
      {animate && isTyping && (
        <span className="chatgpt-cursor" />
      )}
    </div>
  );
}

export default function ChatInterface({ repoName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMessages([]);
    setQuestion('');
    setError('');
  }, [repoName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const submitQuestion = async (qText: string) => {
    if (!qText.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: qText,
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError('');
    setQuestion('');

    try {
      const response: AskResponse = await apiService.askQuestion({
        repoName,
        question: qText,
      });

      const assistantMessage: ChatMessage = {
        type: 'assistant',
        content: response.answer,
        context: response.context,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !loading) {
      submitQuestion(question);
    }
  };

  return (
    <div className="workspace">
      <section className="workspace-chat">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div style={{
              margin: 'auto',
              textAlign: 'center',
              maxWidth: '540px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              color: 'var(--text-secondary)',
              animation: 'floatIn 0.5s ease'
            }}>
              <div style={{
                display: 'inline-flex',
                padding: '1rem',
                borderRadius: '50%',
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                border: '1px solid rgba(79, 70, 229, 0.15)',
                marginBottom: '0.25rem'
              }}>
                <MessageCircle size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>
                Query {repoName}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Ask language-specific queries, search function boundaries, identify endpoints, or inspect retrieval accuracy scores.
              </p>
              
              <div className="suggestions-grid">
                {QUICK_SUGGESTIONS.map((sug, idx) => (
                  <button 
                    key={idx}
                    onClick={() => submitQuestion(sug.text)}
                    className="suggestion-card"
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                  >
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                      {sug.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {sug.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.type}`}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'space-between',
                    width: '100%',
                    marginBottom: '0.15rem'
                  }}>
                    <span className="message-sender">
                      {msg.type === 'user' ? 'User' : 'DevScope AI'}
                    </span>
                    {msg.type === 'assistant' && (
                      <CopyResponseButton text={msg.content} />
                    )}
                  </div>
                  <div className="chat-bubble">
                    <div className="message-content">
                      {msg.type === 'assistant' ? (
                        <TypewriterMessage 
                          content={msg.content} 
                          animate={index === messages.length - 1} 
                        />
                      ) : (
                        <FormattedResponse content={msg.content} />
                      )}
                    </div>
                    {msg.context && (
                      <RetrievedContextViewer context={msg.context} />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {loading && (
            <div className="message-wrapper assistant">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '0.15rem'
              }}>
                <span className="message-sender">DevScope AI</span>
              </div>
              <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center' }}>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'var(--error-glow)', 
              border: '1px solid var(--error)', 
              padding: '0.65rem 0.9rem', 
              borderRadius: 'var(--radius-sm)', 
              color: '#fda4af', 
              fontSize: '0.8rem', 
              width: 'fit-content', 
              alignSelf: 'center',
              marginTop: '1rem'
            }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-panel">
          <div className="chat-input-wrapper">
            <form onSubmit={handleSubmit} className="chat-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`Ask a question about ${repoName}...`}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !question.trim()} title="Send query">
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
