/**
 * After this an evaluation counts as failed. The AI's reply waits for the evaluation (see
 * `AI_TURN_RECEIVED` in the reducer), so it is also the longest a reply can be held back.
 */
export const EVALUATION_TIMEOUT_MS = 10_000;
