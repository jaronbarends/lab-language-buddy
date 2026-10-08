import { ChatErrorSchema } from "@/lib/chat-schema";

/**
 * POSTs a JSON body to one of our routes and returns the parsed JSON of a successful
 * answer, which the caller still has to validate. A failing answer throws an `Error`
 * carrying the route's own message. Shared by the drivers that call `/api/chat` and
 * `/api/evaluation`.
 */
export async function postJson(
  url: string,
  body: unknown,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(await errorTextOf(response));
  }

  return response.json();
}

/** The routes answer failures with `{ error }`; anything else falls back to the status. */
async function errorTextOf(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;
  try {
    const body: unknown = await response.json();
    const parsedError = ChatErrorSchema.safeParse(body);
    if (parsedError.success) {
      return parsedError.data.error;
    }
  } catch {
    // Not JSON — the status is all there is.
  }
  return fallback;
}
