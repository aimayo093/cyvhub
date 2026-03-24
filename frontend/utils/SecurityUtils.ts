/**
 * Utility functions for frontend security
 */

export class SecurityUtils {
    /**
     * Sanitizes CMS content to prevent XSS.
     * Strips arbitrary <script> tags, onerror handlers, and javascript: URIs.
     * 
     * Note: In a real-world scenario, you would use DOMPurify or a mature backend sanitization library.
     * This is a rudimentary mock implementation for demonstration.
     */
    static sanitizeCMSInput(input: string): string {
        if (!input) return input;

        let sanitized = input;
        // Remove script tags
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove inline event handlers (onerror, onload, etc.)
        sanitized = sanitized.replace(/on\w+\s*=\s*(['"]).*?\1/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=\s*[^>\s]+/gi, '');

        // Remove javascript: URIs
        sanitized = sanitized.replace(/javascript\s*:/gi, 'blocked:');

        return sanitized;
    }
}
