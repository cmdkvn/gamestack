import Anthropic from "@anthropic-ai/sdk";
import type { ChatClient, ChatRequest, ChatResponse } from "./types.ts";

export class AnthropicChatClient implements ChatClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async send(req: ChatRequest): Promise<ChatResponse> {
    const messages: Anthropic.MessageParam[] = [];
    if (req.history) {
      for (const h of req.history) {
        messages.push({ role: h.role, content: h.content });
      }
    }
    messages.push({ role: "user", content: req.prompt });

    const systemBlocks: Anthropic.TextBlockParam[] | undefined = req.system
      ? [
          {
            type: "text",
            text: req.system,
            ...(req.cacheSystem ? { cache_control: { type: "ephemeral" } } : {}),
          } satisfies Anthropic.TextBlockParam,
        ]
      : undefined;

    const start = Date.now();
    const response = await this.client.messages.create({
      model: req.model,
      max_tokens: req.maxTokens,
      messages,
      ...(systemBlocks ? { system: systemBlocks } : {}),
    });
    const latencyMs = Date.now() - start;

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const usage = response.usage as Anthropic.Usage & {
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
    return {
      text,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadInputTokens: usage.cache_read_input_tokens,
      cacheCreationInputTokens: usage.cache_creation_input_tokens,
      latencyMs,
      stopReason: response.stop_reason ?? undefined,
    };
  }
}
