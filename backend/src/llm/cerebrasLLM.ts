import { ChatCerebras } from "@langchain/cerebras";

export const llm = new ChatCerebras({
    model:"gpt-oss-120b",
    apiKey:process.env.CEREBRAS_API_KEY,
    temperature:0,
});

