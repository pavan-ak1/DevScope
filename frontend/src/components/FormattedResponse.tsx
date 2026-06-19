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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copied!
            `;
            setTimeout(() => {
              button.innerHTML = originalHTML;
            }, 2000);
          }
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      };
    }
  }, []);
  const formatText = (text: string): string => {
    let formatted = text.trim();

    const escapeHtml = (str: string): string => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const codeBlocks: string[] = [];

    formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
      try {
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const cleanCode = code.trim();
        const escapedCode = escapeHtml(cleanCode);
        const displayLang = escapeHtml(lang || 'code');

        const codeBlockHtml = `<div class="code-block">
          <div class="code-header">
            <span>${displayLang}</span>
            <button 
              onclick="window.copyCode('${codeId}')"
              class="copy-button"
              data-code-id="${codeId}"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre><code id="${codeId}" class="language-${lang || 'text'}">${escapedCode}</code></pre>
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

    formatted = formatted.replace(/\s*(__CODE_BLOCK_PLACEHOLDER_\d+__)\s*/g, '\n\n$1\n\n');

    const paragraphs = formatted.split(/\n\s*\n/);
    const processedParagraphs = paragraphs.map(paragraph => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';

      if (trimmed.startsWith('__CODE_BLOCK_PLACEHOLDER_') && trimmed.endsWith('__')) {
        return trimmed;
      }

      let processed = trimmed;

      if (processed.match(/^###\s+(.+)$/m)) {
        return processed.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
      }
      if (processed.match(/^##\s+(.+)$/m)) {
        return processed.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
      }
      if (processed.match(/^#\s+(.+)$/m)) {
        return processed.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
      }

      if (processed.match(/^\*\s+.+$/m)) {
        const listHtml = processed
          .split('\n')
          .filter(line => line.match(/^\*\s+.+$/))
          .map(item => `<li>${item.replace(/^\*\s+/, '')}</li>`)
          .join('');
        return `<ul>${listHtml}</ul>`;
      }

      processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

      processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      processed = processed.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

      return `<p>${processed}</p>`;
    });

    let result = processedParagraphs.filter(p => p.trim()).join('\n');

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
