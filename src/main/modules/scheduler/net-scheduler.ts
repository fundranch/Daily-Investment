import { inject, injectable, postConstruct } from 'inversify';
import cron, { ScheduledTask } from 'node-cron';
import { StorageModule } from '../storage/fund-storage';
import { SYMBOLS } from '../../symbols';
import { EventBus } from '../events';
import { SelfSelectedFundDbService } from '../db/self-selected-fund-db';
import { HoldFundDbService } from '../db/hold-fund-db';
import { handleFundEstimateDataSource_0 } from '../polling-scheduler/utils';

// 净值调度器，保证基金净值数据更新准确
@injectable()
export class NetScheduler {
    public readonly netsData = new Map<string, {net: string, time: string, code: string, change: string}>();

    @inject(SelfSelectedFundDbService) private selfSelectedDb: SelfSelectedFundDbService;

    @inject(HoldFundDbService) private holdDb: HoldFundDbService;
    
    private scheduledTask: ScheduledTask;

    @inject(SYMBOLS.EventBus) private eventBus: EventBus;

    @inject(StorageModule) protected storage: StorageModule;

    @postConstruct()
    protected init() {
        this.scheduledTask = cron.schedule('0 0 9,21 * * 1-5', () => {
            this.collectFundNet();
        });
        this.collectFundNet();
    }

    private getSource(code: string) {
        return `https://m.dayfund.cn/ajs/ajaxdata.shtml?showtype=getfundvalue&fundcode=${code}`;
    } 

    private async collectFundNet() {
        const selfSelectedFunds = this.selfSelectedDb.getAllFunds();
        const holdFunds = this.holdDb.getAllFunds();
        try {
            const results = await Promise.allSettled([
                ...selfSelectedFunds.map(i => this.fetch(i.code)),
                ...holdFunds.map(i => this.fetch(i.code)),
            ]);
            results.forEach(i => {
                if(i.status === 'rejected' || !i.value) return;
                this.netsData.set(i.value.code, i.value);
            });
            console.log('----', this.netsData);
        } catch(e) {
            console.error(e);
        }
    }

    private async fetch(code: string) {
        const result = await fetch(this.getSource(code));
        const data = await handleFundEstimateDataSource_0(result);
        return { 
            code,
            net: data?.net || '',
            time: data?.netTime || '',
            change: data?.estimateChange || ''
        };
    }
}