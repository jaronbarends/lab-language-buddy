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

type PostJsonWithDeadlineOptions<Result> = {
  /** After this the request is aborted and `onFailure` is called with `timedOut: true`. */
  timeoutMs: number;
  /** Validates the parsed JSON of a successful answer. Throwing makes it a failure. */
  parse: (json: unknown) => Result;
  onResult: (result: Result) => void;
  /** Not called for a request the caller cancelled with the returned function. */
  onFailure: (error: unknown, details: { timedOut: boolean }) => void;
};

/**
 * `postJson` with a deadline, for the effect hooks: the validated result goes to
 * `onResult`, any failure (including the deadline passing) to `onFailure`.
 *
 * Returns a function that cancels the request: it clears the deadline and aborts the
 * fetch. A cancelled request calls neither callback, so it is meant as the effect's
 * cleanup.
 */
export function postJsonWithDeadline<Result>(
  url: string,
  body: unknown,
  options: PostJsonWithDeadlineOptions<Result>,
): () => void {
  const { timeoutMs, parse, onResult, onFailure } = options;
  const abortController = new AbortController();

  // An abort from the returned function means nobody is waiting any more; an abort from
  // this deadline means somebody is, so it has to end in `onFailure`.
  let requestHasTimedOut = false;
  const timeoutId = setTimeout(() => {
    requestHasTimedOut = true;
    abortController.abort();
  }, timeoutMs);

  postJson(url, body, abortController.signal)
    .then((json) => {
      onResult(parse(json));
    })
    .catch((error: unknown) => {
      if (abortController.signal.aborted && !requestHasTimedOut) {
        return;
      }
      onFailure(error, { timedOut: requestHasTimedOut });
    })
    .finally(() => clearTimeout(timeoutId));

  return () => {
    clearTimeout(timeoutId);
    abortController.abort();
  };
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
