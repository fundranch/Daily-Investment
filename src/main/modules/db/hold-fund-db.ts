import { inject, injectable, postConstruct } from 'inversify';
import { ipcMain } from 'electron';
import dayjs from 'dayjs';
import { DbService } from './db';
import { HoldFundDb } from '../../../types/db';
import { handleFundEstimateDataSource_0 } from '../polling-scheduler/utils';
import { BaseDbHandler } from './base-db-handler';
import { SYMBOLS } from '../../symbols';
import { Notifies } from '../notifies/main';
import { StorageModule } from '../storage/fund-storage';
import { EventBus } from '../events';

@injectable()
export class HoldFundDbService extends BaseDbHandler {
    @inject(DbService) protected dbService: DbService;

    constructor(
        @inject(StorageModule) protected storage: StorageModule,
        @inject(Notifies) protected notifies: Notifies,
        @inject(SYMBOLS.EventBus) protected eventBus: EventBus,
    ) {
        super(storage, notifies, eventBus);
    }

    @postConstruct()
    init() {
        ipcMain.handle('change-hold-fund', async (_, type: 'add' | 'update' | 'delete' | 'toTop', data?: any) => {
            if(type === 'add') {
                const result = await this.addFund(data);
                return result;
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

    private getSource(code: string) {
        return `https://m.dayfund.cn/ajs/ajaxdata.shtml?showtype=getfundvalue&fundcode=${code}`;
    } 

    private async addFund(data: HoldFundDb) {
        const time = new Date();
        try {
            // 获取当前的最新净值
            const result = await fetch(this.getSource(data.code));
            const handleData = await handleFundEstimateDataSource_0(result);
            this.dbService.db.prepare(`
                INSERT INTO holding_funds
                (code, name, added_at, invested_amount, total_profit, net, total_profit_update)
                VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).run(
                data.code,
                data.name,
                String(time.getTime()),
                data.invested_amount || 0,
                data.total_profit || 0,
                handleData?.net || 0,
                dayjs(handleData?.netTime).valueOf()
            );
            // 刷新调度器
            this.eventBus.emit('polling-scheduler-restart');
            return true;
        } catch(e) {
            console.log('error', e);
            return false;
        }
    }

    public updateFund(data: Partial<HoldFundDb>) {
        try {
            const stmt = this.dbService.db.prepare(`
                UPDATE holding_funds
                SET 
                    invested_amount = ?,
                    total_profit = ?
                WHERE code = ?
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
            // 刷新调度器
            if(result.changes !== 0) {
                this.eventBus.emit('polling-scheduler-restart');
            }
            // 处理删除基金后的相关副作用
            this.clearFundEffect(code);
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

    // 更新持有收益
    public updateTotalProfit(code: string, net: number, updateTime: string) {
        const fund = this.dbService.db.prepare(`
            SELECT * FROM holding_funds WHERE code = ?
        `).get(code) as HoldFundDb;
        if(!fund) return;
        // 判断当前时间和上次持有收益更新时间是否一致，若不一致则更新持有总收益以及持有金额
        const isBefore = dayjs(fund.total_profit_update).isBefore(dayjs(updateTime), 'day');
        if(!isBefore) return;
        // 计算出最新的收益并且更新数据库
        // 当前份额
        const share = fund.invested_amount / fund.net;
        // 最新持有
        const newInvestedAmount = Math.round(share * net * 100) / 100;
        // 最新总收益
        const newProfit = fund.total_profit + Math.round((net - fund.net) * share * 100) / 100;
        this.dbService.db.prepare(`
            UPDATE holding_funds
            SET 
                net = ?,
                invested_amount = ?,
                total_profit = ?,
                total_profit_update = ?
            WHERE code = ?
        `).run(
            net,
            newInvestedAmount,
            newProfit,
            dayjs(updateTime).valueOf(),
            code
        );
    } 
}