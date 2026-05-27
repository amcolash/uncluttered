import { db } from './db.ts';

// With network_mode: host in docker-compose, both containers share the host
// network stack — so localhost resolves correctly from within the server container.
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const MODEL = 'gemma3:270m';

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export async function classifyEmail(subject: string, snippet: string): Promise<string> {
  const categories = db.data.categories;

  const categoryList = categories.map((c) => `- ${c.key}: ${c.description}`).join('\n');

  const systemPrompt =
    `You are an email classification assistant. ` +
    `Classify the email into exactly one of the following categories based on its subject and snippet.\n\n` +
    `Categories:\n${categoryList}\n\n` +
    `Rules:\n` +
    `- Respond with ONLY the category key (e.g. NEWSLETTER).\n` +
    `- Do not include punctuation, explanation, or any other text.`;

  const userMessage = `Subject: ${subject}\nSnippet: ${snippet}`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: false,
      options: {
        temperature: 0.1,
        num_threads: 2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OllamaChatResponse;
  const raw = data.message.content.trim().toUpperCase();

  // Validate against the known category keys; fall back to UNKNOWN if the
  // model returns something unrecognized.
  const validKeys = categories.map((c) => c.key);
  return validKeys.includes(raw) ? raw : 'UNKNOWN';
}
