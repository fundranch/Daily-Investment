import { injectable } from 'inversify';
import path from 'node:path';
import { app } from 'electron';
import BetterSqlite3 from 'better-sqlite3';

@injectable()
export class DbService {
    public db: BetterSqlite3.Database;

    constructor() {
        this.init();
        this.migrate();
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
                total_profit_update INT DEFAULT 0,
                net REAL DEFAULT 0,
                weight INT DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    private getCurrentVersion(): number {
        const row = this.db
            .prepare('SELECT value FROM db_meta WHERE key = \'schema_version\'')
            .get() as { value: string };

        return Number(row?.value ?? 1);
    }

    // 数据库升级
    private migrate() {
        const currentVersion = this.getCurrentVersion();

        if(currentVersion < 2) {
            this.migrateToV2();
        }
    }

    private migrateToV2() {
        // const trx = this.db.transaction(() => {
        //     this.db.exec(`
        //         ALTER TABLE holding_funds
        //         ADD COLUMN nav REAL DEFAULT 0;
        //     `);

        //     this.db
        //         .prepare(`
        //             UPDATE db_meta
        //             SET value = '2'
        //             WHERE key = 'schema_version'
        //         `)
        //         .run();
        // });
        // trx();
    }
}