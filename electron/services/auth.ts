/**
 * Auth Service with proper security measures
 */
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { StorageService } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// Generate or load a unique secret per installation
function getJWTSecret(): string {
    const secretPath = path.join(app.getPath('userData'), '.jwt-secret');

    if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf-8');
    }

    // Generate a cryptographically secure random secret
    const secret = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(secretPath, secret, { mode: 0o600 }); // Only owner can read
    return secret;
}

// Simple token management without external JWT dependency
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SALT_ROUNDS = 12; // Increased from 10

// Rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): { allowed: boolean; remainingMs?: number } {
    const now = Date.now();
    const record = loginAttempts.get(identifier);

    if (!record || now > record.resetAt) {
        loginAttempts.set(identifier, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
        return { allowed: true };
    }

    if (record.count >= MAX_LOGIN_ATTEMPTS) {
        return { allowed: false, remainingMs: record.resetAt - now };
    }

    record.count++;
    return { allowed: true };
}

function resetRateLimit(identifier: string): void {
    loginAttempts.delete(identifier);
}

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthToken {
    token: string;
    user: Omit<User, 'passwordHash'>;
}

export const AuthService = {
    /**
     * Hash a password using bcrypt with higher cost factor
     */
    hashPassword: async (password: string): Promise<string> => {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    /**
     * Compare a plain text password with a hashed password
     */
    comparePassword: async (password: string, hash: string): Promise<boolean> => {
        return bcrypt.compare(password, hash);
    },

    /**
     * Generate a secure session token
     */
    generateToken: (userId: string): string => {
        const secret = getJWTSecret();
        const payload = {
            userId,
            exp: Date.now() + TOKEN_EXPIRY_MS,
            nonce: crypto.randomBytes(16).toString('hex')
        };
        const data = JSON.stringify(payload);
        const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
        return Buffer.from(data).toString('base64') + '.' + signature;
    },

    /**
     * Verify and decode a token
     */
    verifyToken: (token: string): { userId: string } | null => {
        try {
            const [dataB64, signature] = token.split('.');
            if (!dataB64 || !signature) return null;

            const data = Buffer.from(dataB64, 'base64').toString('utf-8');
            const secret = getJWTSecret();
            const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');

            // Timing-safe comparison
            if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
                return null;
            }

            const payload = JSON.parse(data);

            // Check expiration
            if (payload.exp < Date.now()) {
                return null;
            }

            return { userId: payload.userId };
        } catch {
            return null;
        }
    },

    /**
     * Register a new user with validation
     */
    register: async (email: string, password: string, displayName?: string): Promise<AuthToken | { error: string }> => {
        // Input validation
        if (!email || typeof email !== 'string') {
            return { error: 'Email is required' };
        }
        if (!password || typeof password !== 'string') {
            return { error: 'Password is required' };
        }

        // Sanitize email
        email = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = StorageService.findUserByEmail(email);
        if (existingUser) {
            return { error: 'User with this email already exists' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || email.length > 254) {
            return { error: 'Invalid email format' };
        }

        // Strong password validation
        if (password.length < 8) {
            return { error: 'Password must be at least 8 characters long' };
        }
        if (password.length > 128) {
            return { error: 'Password too long' };
        }
        if (!/[A-Z]/.test(password)) {
            return { error: 'Password must contain at least one uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { error: 'Password must contain at least one lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { error: 'Password must contain at least one number' };
        }

        // Hash password
        const passwordHash = await AuthService.hashPassword(password);

        // Sanitize display name
        const safeName = (displayName || email.split('@')[0])
            .replace(/[<>'"&]/g, '')
            .slice(0, 50);

        // Create user
        const user: User = {
            id: uuidv4(),
            email,
            passwordHash,
            displayName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        StorageService.createUser(user);

        // Generate token
        const token = AuthService.generateToken(user.id);

        // Store session
        StorageService.storeSession(token, user.id);

        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword };
    },

    /**
     * Login a user with rate limiting
     */
    login: async (email: string, password: string): Promise<AuthToken | { error: string }> => {
        // Input validation
        if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
            return { error: 'Invalid credentials' };
        }

        email = email.toLowerCase().trim();

        // Rate limiting check
        const rateCheck = checkRateLimit(email);
        if (!rateCheck.allowed) {
            const minutes = Math.ceil((rateCheck.remainingMs || 0) / 60000);
            return { error: `Too many login attempts. Try again in ${minutes} minutes.` };
        }

        // Find user
        const user = StorageService.findUserByEmail(email);
        if (!user) {
            return { error: 'Invalid email or password' };
        }

        // Verify password
        const isPasswordValid = await AuthService.comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return { error: 'Invalid email or password' };
        }

        // Reset rate limit on successful login
        resetRateLimit(email);

        // Generate token
        const token = AuthService.generateToken(user.id);

        // Store session
        StorageService.storeSession(token, user.id);

        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword };
    },

    /**
     * Validate a session token and return user if valid
     */
    validateSession: async (token: string): Promise<Omit<User, 'passwordHash'> | null> => {
        if (!token || typeof token !== 'string') {
            return null;
        }

        // Verify token
        const payload = AuthService.verifyToken(token);
        if (!payload) {
            return null;
        }

        // Check if session exists in storage
        const isSessionValid = StorageService.isSessionValid(token);
        if (!isSessionValid) {
            return null;
        }

        // Find user by ID (more secure than by email from token)
        const users = StorageService.getUsers();
        const user = users.find(u => u.id === payload.userId);
        if (!user) {
            return null;
        }

        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    /**
     * Logout a user (invalidate session)
     */
    logout: async (token: string): Promise<boolean> => {
        if (!token || typeof token !== 'string') {
            return false;
        }
        return StorageService.removeSession(token);
    },

    /**
     * Get current session from storage
     */
    getCurrentSession: (): { token: string; userId: string } | null => {
        return StorageService.getCurrentSession();
    }
};
