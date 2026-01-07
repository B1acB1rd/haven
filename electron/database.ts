import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: SqlJsDatabase | null = null;

function getDbPath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'creative-hub.db');
}

export async function initDatabase(): Promise<SqlJsDatabase> {
    if (db) return db;

    const dbPath = getDbPath();
    console.log('Initializing database at:', dbPath);

    // Initialize SQL.js
    const SQL = await initSqlJs();

    // Check if database file exists
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT DEFAULT 'other',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            source_tool TEXT,
            file_path TEXT,
            file_size INTEGER,
            created_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS prompt_history (
            id TEXT PRIMARY KEY,
            tool_id TEXT NOT NULL,
            mode TEXT NOT NULL,
            prompt TEXT NOT NULL,
            response TEXT,
            created_at TEXT NOT NULL
        )
    `);

    // Save to disk
    saveDatabase();

    return db;
}

export function getDb(): SqlJsDatabase {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

export function saveDatabase(): void {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(getDbPath(), buffer);
    }
}

export function closeDatabase(): void {
    if (db) {
        saveDatabase();
        db.close();
        db = null;
    }
}
