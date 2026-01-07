import { getDb, saveDatabase } from '../database';
import { v4 as uuid } from 'uuid';

export interface Project {
    id: string;
    name: string;
    description: string | null;
    type: string;
    created_at: string;
    updated_at: string;
}

export interface CreateProjectInput {
    name: string;
    description?: string;
    type?: string;
}

function rowToProject(columns: string[], values: (string | number | null | Uint8Array)[]): Project {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
        obj[col] = values[i];
    });
    return obj as unknown as Project;
}

export function getProjects(): Project[] {
    const db = getDb();
    const result = db.exec('SELECT * FROM projects ORDER BY updated_at DESC');
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map(row => rowToProject(columns, row));
}

export function getProject(id: string): Project | null {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        stmt.free();
        return rowToProject(columns, values);
    }
    stmt.free();
    return null;
}

export function createProject(input: CreateProjectInput): Project {
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();

    const stmt = db.prepare(
        'INSERT INTO projects (id, name, description, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run([id, input.name, input.description || null, input.type || 'other', now, now]);
    stmt.free();

    saveDatabase();

    return {
        id,
        name: input.name,
        description: input.description || null,
        type: input.type || 'other',
        created_at: now,
        updated_at: now,
    };
}

export function updateProject(id: string, input: Partial<CreateProjectInput>): Project | null {
    const db = getDb();
    const now = new Date().toISOString();

    const fields: string[] = ['updated_at = ?'];
    const values: (string | null)[] = [now];

    if (input.name !== undefined) {
        fields.push('name = ?');
        values.push(input.name);
    }
    if (input.description !== undefined) {
        fields.push('description = ?');
        values.push(input.description);
    }
    if (input.type !== undefined) {
        fields.push('type = ?');
        values.push(input.type);
    }

    values.push(id);

    const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(values as (string | null)[]);
    stmt.free();

    saveDatabase();

    return getProject(id);
}

export function deleteProject(id: string): boolean {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    saveDatabase();
    return true;
}
