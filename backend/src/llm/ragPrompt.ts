export function buildRagPrompt(
    question:string,
    retirevedChunks:{
        file_path:string;
        text:string;
    }[]
):string{
    const context = retirevedChunks.map(
      (chunk) =>
        `FILE: ${chunk.file_path}\nCODE:\n${chunk.text}`
    )
    .join("\n\n-----------------\n\n");

    return `
You are a codebase expert.

Answer the question ONLY using the code provided below.
If the answer is not present in the code, say:
"I could not find this information in the repository."

QUESTION:
${question}

CODE CONTEXT:
${context}

ANSWER:
`.trim();
}