import type { Message } from "./generator";
import { buildApiUrl } from "./client";

/**
 * Generate a smart title (4-12 words) for a conversation based on its messages.
 * Returns null if unable to generate a title.
 */
export async function generateSmartTitle(
  messages: Message[],
  apiBaseUrl: string,
  apiKey: string,
  model: string,
): Promise<string | null> {
  const hasUser = messages.some((m) => m.role === "user");
  const hasAssistant = messages.some((m) => m.role === "assistant");
  if (!hasUser || !hasAssistant) return null;

  const relevant = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(0, 6)
    .map((m) => {
      const text =
        typeof m.content === "string"
          ? m.content
          : ((m.content as any[])?.find((p: any) => p.type === "text")?.text ?? "");
      return `${m.role}: ${text.slice(0, 200)}`;
    })
    .join("\n");

  try {
    const res = await fetch(buildApiUrl(apiBaseUrl, "/chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "Generate a concise title (4-12 words) for this development conversation. " +
              "The title should describe the app or task being built. " +
              "Use the same language as the user's message. " +
              "Return ONLY the title text, no quotes, no explanation, no punctuation at the end.",
          },
          { role: "user", content: relevant },
        ],
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const title = json.choices?.[0]?.message?.content?.trim() || "";

    if (!title || title.length > 80) return null;
    return title;
  } catch {
    return null;
  }
}
