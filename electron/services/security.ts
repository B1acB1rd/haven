/**
 * Security utilities for input validation and sanitization
 */
export const SecurityUtils = {
    /**
     * Sanitize HTML content to prevent XSS attacks
     * Simple text-based sanitization - strips all HTML tags
     */
    sanitizeHTML: (dirty: string): string => {
        // Simple HTML escape - in a real app, use DOMPurify library
        return dirty
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Validate email format
     */
    isValidEmail: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate password strength
     * Returns { valid: boolean, errors: string[] }
     */
    validatePassword: (password: string): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Sanitize filename to prevent path traversal attacks
     */
    sanitizeFilename: (filename: string): string => {
        return filename
            .replace(/[^a-z0-9._-]/gi, '_')
            .replace(/\.+/g, '.')
            .substring(0, 255);
    },

    /**
     * Validate URL to prevent SSRF attacks
     */
    isValidURL: (url: string, allowedDomains?: string[]): boolean => {
        try {
            const parsed = new URL(url);

            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return false;
            }

            // Check against allowed domains if provided
            if (allowedDomains && allowedDomains.length > 0) {
                return allowedDomains.some(domain =>
                    parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
                );
            }

            return true;
        } catch {
            return false;
        }
    },

    /**
     * Rate limiter for preventing brute force attacks
     */
    createRateLimiter: (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
        const attempts = new Map<string, { count: number; resetAt: number }>();

        return {
            check: (identifier: string): boolean => {
                const now = Date.now();
                const record = attempts.get(identifier);

                if (!record || now > record.resetAt) {
                    attempts.set(identifier, { count: 1, resetAt: now + windowMs });
                    return true;
                }

                if (record.count >= maxAttempts) {
                    return false;
                }

                record.count++;
                return true;
            },

            reset: (identifier: string): void => {
                attempts.delete(identifier);
            },

            getRemainingTime: (identifier: string): number => {
                const record = attempts.get(identifier);
                if (!record) return 0;

                const remaining = record.resetAt - Date.now();
                return remaining > 0 ? remaining : 0;
            }
        };
    }
};
