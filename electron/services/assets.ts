import { getDb, saveDatabase } from '../database';
import { v4 as uuid } from 'uuid';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface Asset {
    id: string;
    project_id: string | null;
    name: string;
    type: string;
    source_tool: string | null;
    file_path: string | null;
    file_size: number | null;
    created_at: string;
}

export interface CreateAssetInput {
    project_id?: string;
    name: string;
    type: string;
    source_tool?: string;
    filePath?: string;
    fileSize?: number;
}

function getAssetsDir(): string {
    const userDataPath = app.getPath('userData');
    const assetsDir = path.join(userDataPath, 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
    return assetsDir;
}

function rowToAsset(columns: string[], values: (string | number | null | Uint8Array)[]): Asset {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
        obj[col] = values[i];
    });
    return obj as unknown as Asset;
}

export function getAssets(projectId?: string): Asset[] {
    const db = getDb();
    let result;

    if (projectId) {
        const stmt = db.prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC');
        stmt.bind([projectId]);
        const assets: Asset[] = [];
        while (stmt.step()) {
            assets.push(rowToAsset(stmt.getColumnNames(), stmt.get()));
        }
        stmt.free();
        return assets;
    } else {
        result = db.exec('SELECT * FROM assets ORDER BY created_at DESC');
        if (result.length === 0) return [];
        const columns = result[0].columns;
        return result[0].values.map(row => rowToAsset(columns, row));
    }
}

export function getAsset(id: string): Asset | null {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM assets WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
        const asset = rowToAsset(stmt.getColumnNames(), stmt.get());
        stmt.free();
        return asset;
    }
    stmt.free();
    return null;
}

export function createAsset(input: CreateAssetInput): Asset {
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();

    let finalPath = input.filePath || null;
    let fileSize = input.fileSize || null;

    // If a file path is provided, copy file to assets directory
    if (input.filePath && fs.existsSync(input.filePath)) {
        const assetsDir = getAssetsDir();
        const ext = path.extname(input.filePath);
        const newFileName = `${id}${ext}`;
        finalPath = path.join(assetsDir, newFileName);

        fs.copyFileSync(input.filePath, finalPath);
        const stats = fs.statSync(finalPath);
        fileSize = stats.size;
    }

    const stmt = db.prepare(
        'INSERT INTO assets (id, project_id, name, type, source_tool, file_path, file_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([id, input.project_id || null, input.name, input.type, input.source_tool || null, finalPath, fileSize, now]);
    stmt.free();

    saveDatabase();

    return {
        id,
        project_id: input.project_id || null,
        name: input.name,
        type: input.type,
        source_tool: input.source_tool || null,
        file_path: finalPath,
        file_size: fileSize,
        created_at: now,
    };
}

export function deleteAsset(id: string): boolean {
    const db = getDb();

    // Get asset to delete file if exists
    const asset = getAsset(id);
    if (asset?.file_path && fs.existsSync(asset.file_path)) {
        fs.unlinkSync(asset.file_path);
    }

    const stmt = db.prepare('DELETE FROM assets WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    saveDatabase();
    return true;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
