import { inject, injectable, postConstruct } from 'inversify';
import { ipcMain } from 'electron';
import { BatchFundData, DbService } from './db';
import { SelfSelectedFundDb } from '../../../types/db';
import { handleFundEstimateDataSource_0 } from '../polling-scheduler/utils';
import { BaseDbHandler } from './base-db-handler';
import { StorageModule } from '../storage/fund-storage';
import { Notifies } from '../notifies/main';
import { SYMBOLS } from '../../symbols';
import { EventBus } from '../events';

@injectable()
export class SelfSelectedFundDbService extends BaseDbHandler {
    @inject(DbService) protected dbService: DbService;

    constructor(
        @inject(StorageModule) protected storage: StorageModule,
        @inject(Notifies) protected notifies: Notifies,
        @inject(SYMBOLS.EventBus) protected eventBus: EventBus
    ) {
        super(storage, notifies, eventBus);
    }

    @postConstruct()
    init() {
        ipcMain.handle('change-self-selected-fund', async (_, type: 'add' | 'delete' | 'toTop', data?: any) => {
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
            return false;
        });
        ipcMain.handle('get-self-selected-fund', async () => {
            const data = this.getAllFunds();
            return data.map(i => ({ code:i.code, name: i.name }));
        });
    }

    private getSource(code: string) {
        return `https://m.dayfund.cn/ajs/ajaxdata.shtml?showtype=getfundvalue&fundcode=${code}`;
    }

    // 获取最新净值
    private async getLatestNet(code: string) {
        const result = await fetch(this.getSource(code));
        const handleData = await handleFundEstimateDataSource_0(result);
        return handleData;
    }

    public async addFund(data: Partial<Omit<SelfSelectedFundDb, 'added_at'>>) {
        const time = new Date();
        try {
            // 获取当前的最新净值
            const handleData = await this.getLatestNet(data.code!);
            this.dbService.db.prepare(`
                INSERT INTO self_selected_funds
                (code, name, added_at, added_nav)
                VALUES (?, ?, ?, ?)`
            ).run(
                data.code,
                data.name,
                String(time.getTime()),
                handleData ? String(handleData.net) : '0'
            );
            // 刷新调度器
            this.eventBus.emit('polling-scheduler-restart');
            return true;
        } catch(e) {
            return false;
        }
    }

    public deleteFund(code: string) {
        try {
            const result = this.dbService.db.prepare(`
                DELETE FROM self_selected_funds WHERE code = ?
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
                FROM self_selected_funds
            `).get();
            const result = this.dbService.db.prepare(`
                UPDATE self_selected_funds
                SET weight = ?
                WHERE code = ?
            `).run(Number(data?.maxWeight) + 1, code);
            return result.changes === 1;
        } catch(e) {
            return false;
        }
    }

    public getAllFunds(): SelfSelectedFundDb[] {
        try {
            const result = this.dbService.db.prepare(`
                SELECT *
                FROM self_selected_funds
                ORDER BY weight DESC, added_at DESC
            `).all();
            return result as SelfSelectedFundDb[];
        } catch(e) {
            return [];
        }
    }

    // 批处理数据
    public async batchHandlerFund(handlers: BatchFundData[]) {
        const list: Record<string, BatchFundData[]> = {
            add: [],
            delete: []
        };
        handlers.forEach(handler => {
            list[handler.type]?.push(handler);
        });
        // 新增方法
        const addStmt = this.dbService.db.prepare(`
            INSERT INTO self_selected_funds
            (code, name, added_at, added_nav)
            VALUES (?, ?, ?, ?)
        `);
        // 删除方法
        const deleteStmt = this.dbService.db.prepare(`
            DELETE FROM self_selected_funds WHERE code = ?
        `);
        try {
            // 获取新增基金需要的数据
            const netList = await Promise.allSettled(list.add.map(fund => this.getLatestNet(fund.code)));
            const netMap = netList.reduce((pre, i) => {
                if(i.status === 'rejected') return pre;
                if(!i.value || i.value.net === undefined || i.value.netTime === undefined) return pre;
                pre[i.value.code!] = i.value;
                return pre;
            }, {} as any);
            const time = new Date();
            const updateFunds = this.dbService.db.transaction((funds) => {
                const addChanges: string[] = [];
                const deleteChanges: string[] = [];
                list.add.forEach(i => {
                    // 净值存在则可继续添加
                    const netInfo = netMap[i.code];
                    if(!netInfo) return;
                    const result = addStmt.run(i.code, i.name, String(time.getTime()), netInfo.net);
                    if(result.changes) {
                        addChanges.push(i.code);
                    }
                                
                });
                list.delete.forEach(i => {
                    const result = deleteStmt.run(i.code);
                    if(result.changes) {
                        deleteChanges.push(i.code);
                    }
                });
                return [
                    addChanges,
                    deleteChanges
                ];
            });
            const changes = updateFunds(handlers);
            if(changes.some(i => i.length)) {
                // 刷新调度器
                this.eventBus.emit('polling-scheduler-restart');
            }
            return changes;
        } catch(e) {
            return false;
        }
    }
}