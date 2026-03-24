/**
 * sanitize.ts — Shared input sanitization utilities for all AI / chat endpoints.
 *
 * Why this exists:
 *  - AI endpoints accept free-text queries which are uniquely vulnerable to prompt injection.
 *  - This utility provides a single, testable place to enforce input hygiene before
 *    any user text is processed or forwarded to an LLM / pattern-matcher.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum allowed length for any user-supplied query string. */
const MAX_QUERY_LENGTH = 500;

/**
 * Patterns that indicate an attempt to override AI instructions (prompt injection).
 * These are checked case-insensitively against the sanitised input.
 */
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(all\s+)?previous/i,
    /you\s+are\s+now\s+/i,
    /act\s+as\s+/i,
    /pretend\s+(you\s+are|to\s+be)\s+/i,
    /system\s*:/i,
    /<\|im_start\|>/i,
    /<\|im_end\|>/i,
    /\[INST\]/i,
    /\/\/\s*override/i,
    /jailbreak/i,
    /dan\s+mode/i,
];

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface SanitizeResult {
    /** The cleaned string, ready to use. Only present when ok === true. */
    value?: string;
    /** HTTP status code to return when ok === false. */
    status?: number;
    /** Error message to return to the client when ok === false. */
    error?: string;
    ok: boolean;
}

/**
 * Validates and sanitizes a user-supplied query string.
 *
 * Checks (in order):
 *  1. Type — must be a string.
 *  2. Length — must not exceed MAX_QUERY_LENGTH characters.
 *  3. Control characters — null bytes and ANSI escapes are stripped.
 *  4. Prompt injection — rejects known override patterns.
 *
 * @param input   Raw value from req.body or req.query.
 * @returns       A SanitizeResult. Check `result.ok` before using `result.value`.
 */
export function sanitizeUserInput(input: unknown): SanitizeResult {
    // 1. Type check
    if (typeof input !== 'string') {
        return {
            ok: false,
            status: 400,
            error: 'Query must be a string.',
        };
    }

    // 2. Empty / whitespace-only
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return {
            ok: false,
            status: 400,
            error: 'Query cannot be empty.',
        };
    }

    // 3. Length cap
    if (trimmed.length > MAX_QUERY_LENGTH) {
        return {
            ok: false,
            status: 400,
            error: `Query is too long. Maximum allowed length is ${MAX_QUERY_LENGTH} characters.`,
        };
    }

    // 4. Strip control characters (null bytes, ANSI escape sequences, carriage returns)
    const cleaned = trimmed
        .replace(/\x00/g, '')          // null bytes
        .replace(/\x1B\[[0-9;]*m/g, '') // ANSI colour codes
        .replace(/\r/g, '');            // stray carriage returns

    // 5. Prompt injection detection
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(cleaned)) {
            // Log server-side for monitoring but give a generic error to the client
            console.warn('[sanitize] Potential prompt injection attempt blocked:', cleaned.slice(0, 100));
            return {
                ok: false,
                status: 400,
                error: 'Invalid query content.',
            };
        }
    }

    return { ok: true, value: cleaned };
}
