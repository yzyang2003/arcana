export interface SSEOptions {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  options: SSEOptions
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            options.onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) options.onChunk(content);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
    options.onDone();
  } catch (error) {
    options.onError(error instanceof Error ? error : new Error(String(error)));
  }
}
