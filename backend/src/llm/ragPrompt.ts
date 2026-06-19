export function buildRagPrompt(
  question: string,
  contextChunks: { file_path: string; content: string }[]
) {
  const context = contextChunks
    .map(
      (c, i) =>
        `File Path: ${c.file_path}\nCode Snippet ${i + 1}:\n${c.content}`
    )
    .join("\n\n");

  return `
You are an expert software engineer guiding a user through their GitHub repository.

INSTRUCTIONS:
1. Answer the user's question using the provided CONTEXT (code snippets and their exact File Paths).
2. Explain the code snippets, functions, or configurations from the CONTEXT that are relevant to the question.
3. If the user asks "where is" a file, class, or functionality, identify the matching File Paths from the CONTEXT.
4. If the context is completely unrelated or does not contain any relevant information to answer the question, state clearly that you cannot find the answer in the repository files provided.

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:
`;
}