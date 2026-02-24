import { inject, injectable, postConstruct } from 'inversify';
import { ipcMain } from 'electron';
import { DbService } from './db';
import { StorageModule } from '../storage/fund-storage';
import { EventBus } from '../events';
import { SYMBOLS } from '../../symbols';
import { HoldFundDb } from '../../../types/db';

@injectable()
export class HoldFundDbService {
    @inject(DbService) protected dbService: DbService;

    @inject(StorageModule) private storage: StorageModule;
    
    @inject(SYMBOLS.EventBus) eventBus: EventBus;
    

    @postConstruct()
    init() {
        ipcMain.handle('change-hold-fund', async (_, type: 'add' | 'update' | 'delete' | 'toTop', data?: any) => {
            if(type === 'add') {
                return this.addFund(data);
            }
            if(type === 'delete') {
                return this.deleteFund(data);
            }
            if(type === 'toTop') {
                return this.fundToTop(data);
            }
            if(type === 'update') {
                return this.updateFund(data);
            }
            return false;
        });
        ipcMain.handle('get-hold-fund', async () => {
            const data = this.getAllFunds();
            return data.map(i => ({ code:i.code, name: i.name }));
        });
    }

    private addFund(data: HoldFundDb) {
        const time = new Date();
        try {
            // 获取当前的最新净值
            this.dbService.db.prepare(`
                INSERT INTO holding_funds
                (code, name, added_at, invested_amount, total_profit)
                VALUES (?, ?, ?, ?, ?)`
            ).run(
                data.code,
                data.name,
                String(time.getTime()),
                data.invested_amount || 0,
                data.total_profit || 0
            );
            // 刷新调度器
            this.eventBus.emit('polling-scheduler-restart');
            return true;
        } catch(e) {
            return false;
        }
    }

    private async updateFund(data: HoldFundDb) {
        try {
            const stmt = this.dbService.db.prepare(`
                UPDATE holding_funds
                SET 
                    invested_amount = ?,
                    total_profit = ?,
                    updated_at = datetime('now')
                WHERE fund_code = ?
            `).run(
                data.invested_amount,
                data.total_profit,
                data.code
            );
            if(stmt.changes === 1) {
                // 刷新调度器
                this.eventBus.emit('polling-scheduler-restart');
            }
            return stmt.changes === 1;
        } catch(e) {
            return false;
        }
    }
    
    public deleteFund(code: string) {
        try {
            const result = this.dbService.db.prepare(`
                    DELETE FROM holding_funds WHERE code = ?
                `).run(code);
            return result.changes !== 0;
        } catch(e) {
            return false;
        }
    }
    
    // 基金置顶
    public fundToTop(code: string) {
        try {
            const data: any = this.dbService.db.prepare(`
                    SELECT MAX(weight) AS maxWeight
                    FROM holding_funds
                `).get();
            const result = this.dbService.db.prepare(`
                    UPDATE holding_funds
                    SET weight = ?
                    WHERE code = ?
                `).run(Number(data?.maxWeight) + 1, code);
            return result.changes === 1;
        } catch(e) {
            return false;
        }
    }
    
    public getAllFunds(): HoldFundDb[] {
        try {
            const result = this.dbService.db.prepare(`
                    SELECT *
                    FROM holding_funds
                    ORDER BY weight DESC, added_at DESC
                `).all();
            return result as HoldFundDb[];
        } catch(e) {
            return [];
        }
    }
}