interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const formatText = (text: string) => {
    let formatted = text;

    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      return `<div class="code-block">
        <div class="code-header">${lang || 'code'}</div>
        <pre><code>${code.trim()}</code></pre>
      </div>`;
    });

    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

    formatted = formatted.replace(/^\* (.+)$/gim, '<li class="ml-4">• $1</li>');
    formatted = formatted.replace(/(<li.*<\/li>)/s, '<ul class="list-disc ml-6">$1</ul>');

    formatted = formatted.replace(/\n\n/g, '</p><p class="mb-4">');
    formatted = `<p class="mb-4">${formatted}</p>`;

    return formatted;
  };

  return (
    <div 
      className="markdown-content text-gray-800 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
    />
  );
}
