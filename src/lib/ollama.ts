export interface OllamaRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
}

export async function callOllama(url: string, request: OllamaRequest) {
  const response = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  return response;
}

export async function testOllamaConnection(url: string) {
  const response = await fetch(`${url}/api/tags`);
  if (!response.ok) {
    throw new Error('Ollama unreachable');
  }
  return await response.json();
}
