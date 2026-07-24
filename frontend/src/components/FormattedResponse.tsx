import { useEffect } from 'react';

declare global {
  interface Window {
    copyCode?: (codeId: string) => Promise<void>;
  }
}

interface FormattedResponseProps {
  content: string;
}

export default function FormattedResponse({ content }: FormattedResponseProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.copyCode) {
      window.copyCode = async (codeId: string) => {
        try {
          const codeElement = document.getElementById(codeId);
          if (!codeElement) return;
          const codeText = codeElement.textContent || '';
          await navigator.clipboard.writeText(codeText);
          
          const button = document.querySelector(`button[data-code-id="${codeId}"]`) as HTMLButtonElement;
          if (button) {
            const originalHTML = button.innerHTML;
            button.innerHTML = `
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span style="color: var(--success)">Copied</span>
            `;
            button.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            
            setTimeout(() => {
              button.innerHTML = originalHTML;
              button.style.borderColor = 'var(--border-color)';
            }, 2000);
          }
        } catch (err) {
          console.error('Failed to copy code block:', err);
        }
      };
    }
  }, []);

  const highlightCode = (code: string, lang: string): string => {
    const cleanLang = (lang || '').toLowerCase();
    
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const escaped = escapeHtml(code);
    if (!cleanLang || ['text', 'markdown', 'txt', 'bash', 'sh', 'shell'].includes(cleanLang)) {
      return escaped;
    }

    try {
      const placeholders: string[] = [];
      let temp = escaped;

      // 1. Extract strings (single quotes, double quotes, backticks)
      temp = temp.replace(/(["'`])([\s\S]*?)\1/g, (match) => {
        const ph = `___STRING_PLACEHOLDER_${placeholders.length}___`;
        placeholders.push(`<span class="token-string">${match}</span>`);
        return ph;
      });

      // 2. Extract comments (double slash or hash, block comments)
      temp = temp.replace(/(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/g, (match) => {
        const ph = `___COMMENT_PLACEHOLDER_${placeholders.length}___`;
        placeholders.push(`<span class="token-comment">${match}</span>`);
        return ph;
      });

      // 3. Highlight keywords
      const keywordsList = [
        'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 
        'break', 'continue', 'class', 'export', 'import', 'from', 'default', 'extends', 'new', 'this', 
        'typeof', 'instanceof', 'in', 'of', 'as', 'interface', 'type', 'async', 'await', 'try', 'catch', 
        'finally', 'throw', 'public', 'private', 'protected', 'static', 'readonly', 'implements', 
        'def', 'elif', 'with', 'yield', 'lambda', 'global', 'nonlocal', 'assert', 'pass', 'del', 'is', 'and', 'or', 'not', 
        'fn', 'pub', 'mut', 'use', 'mod', 'struct', 'enum', 'impl', 'trait', 'where',
        'select', 'from', 'where', 'insert', 'into', 'update', 'delete', 'create', 'table', 'index', 'join', 'on'
      ];
      const keywordsRegex = new RegExp(`\\b(${keywordsList.join('|')})\\b`, 'g');
      temp = temp.replace(keywordsRegex, '<span class="token-keyword">$1</span>');

      // 4. Highlight functions (word followed by open parenthesis)
      temp = temp.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="token-function">$1</span>');

      // 5. Highlight numbers
      temp = temp.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-number">$1</span>');

      // 6. Restore placeholders in reverse order
      for (let i = placeholders.length - 1; i >= 0; i--) {
        temp = temp.replace(`___STRING_PLACEHOLDER_${i}___`, placeholders[i]);
        temp = temp.replace(`___COMMENT_PLACEHOLDER_${i}___`, placeholders[i]);
      }

      return temp;
    } catch (err) {
      return escaped;
    }
  };

  const formatText = (text: string): string => {
    let formatted = text.trim();

    const escapeHtml = (str: string): string => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const codeBlocks: string[] = [];

    // Extract code blocks first to protect them from downstream markdown substitutions
    formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
      try {
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const cleanCode = code.trim();
        const highlightedCodeHtml = highlightCode(cleanCode, lang || 'code');
        const displayLang = escapeHtml(lang || 'code');

        const codeBlockHtml = `<div class="code-block">
          <div class="code-header">
            <span>${displayLang}</span>
            <button 
              onclick="window.copyCode('${codeId}')"
              class="copy-button"
              data-code-id="${codeId}"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre><code id="${codeId}" class="language-${lang || 'text'}">${highlightedCodeHtml}</code></pre>
        </div>`;

        const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
        codeBlocks.push(codeBlockHtml);
        return placeholder;
      } catch (error) {
        console.error('Error processing code block:', error);
        const fallbackHtml = `<pre><code>${escapeHtml(code || '')}</code></pre>`;
        const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
        codeBlocks.push(fallbackHtml);
        return placeholder;
      }
    });

    // Ensure placeholders have spacing and sit on their own line
    formatted = formatted.replace(/\s*(__CODE_BLOCK_PLACEHOLDER_\d+__)\s*/g, '\n$1\n');

    const lines = formatted.split('\n');
    const output: string[] = [];
    let listState: 'none' | 'ul' | 'ol' = 'none';
    let paragraphBuffer: string[] = [];

    const flushParagraph = () => {
      if (paragraphBuffer.length > 0) {
        const text = paragraphBuffer.join(' ').trim();
        if (text) {
          output.push(`<p>${text}</p>`);
        }
        paragraphBuffer = [];
      }
    };

    const closeList = () => {
      if (listState === 'ul') {
        output.push('</ul>');
      } else if (listState === 'ol') {
        output.push('</ol>');
      }
      listState = 'none';
    };

    const applyInlineFormatting = (str: string): string => {
      let processed = str;
      processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
      processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      return processed;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.match(/^__CODE_BLOCK_PLACEHOLDER_\d+__$/)) {
        closeList();
        flushParagraph();
        output.push(line);
        continue;
      }

      if (!line) {
        closeList();
        flushParagraph();
        continue;
      }

      // Markdown Headers
      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        closeList();
        flushParagraph();
        output.push(`<h3>${applyInlineFormatting(h3Match[1])}</h3>`);
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        closeList();
        flushParagraph();
        output.push(`<h2>${applyInlineFormatting(h2Match[1])}</h2>`);
        continue;
      }

      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        closeList();
        flushParagraph();
        output.push(`<h1>${applyInlineFormatting(h1Match[1])}</h1>`);
        continue;
      }

      // Bullet Lists
      const ulMatch = line.match(/^[*-]\s+(.+)$/);
      if (ulMatch) {
        flushParagraph();
        if (listState !== 'ul') {
          closeList();
          output.push('<ul>');
          listState = 'ul';
        }
        output.push(`<li>${applyInlineFormatting(ulMatch[1])}</li>`);
        continue;
      }

      // Numbered Lists
      const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (olMatch) {
        flushParagraph();
        if (listState !== 'ol') {
          closeList();
          output.push('<ol>');
          listState = 'ol';
        }
        output.push(`<li value="${olMatch[1]}">${applyInlineFormatting(olMatch[2])}</li>`);
        continue;
      }

      // Regular line - add to paragraph buffer
      closeList();
      paragraphBuffer.push(applyInlineFormatting(line));
    }

    closeList();
    flushParagraph();

    let result = output.filter(item => item.trim()).join('\n');

    // Restore code blocks
    codeBlocks.forEach((html, index) => {
      result = result.replace(`__CODE_BLOCK_PLACEHOLDER_${index}__`, html);
    });

    return result;
  };

  return (
    <div
      className="formatted-response"
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
    />
  );
}
