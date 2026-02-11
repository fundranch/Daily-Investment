import { injectable } from 'inversify';
import path from 'node:path';
import { app } from 'electron';
import BetterSqlite3 from 'better-sqlite3';

@injectable()
export class DbService {
    public db: BetterSqlite3.Database;

    constructor() {
        this.init();
    }
    
    private init() {
        const dbPath = path.join(app.getPath('userData'), 'fund.db');
        this.db = new BetterSqlite3(dbPath);
        // 创建表（幂等）
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS db_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            INSERT OR IGNORE INTO db_meta (key, value)
            VALUES ('schema_version', '1');

            CREATE TABLE IF NOT EXISTS self_selected_funds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                added_at TEXT NOT NULL,
                added_nav REAL NOT NULL,
                weight REAL DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS holding_funds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                added_at TEXT NOT NULL,
                invested_amount REAL NOT NULL,
                total_profit REAL DEFAULT 0,
                weight REAL DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
}