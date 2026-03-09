import { inject, injectable, postConstruct } from 'inversify';
import cron, { ScheduledTask } from 'node-cron';
import { StorageModule } from '../storage/fund-storage';
import { SYMBOLS } from '../../symbols';
import { EventBus } from '../events';
import { SelfSelectedFundDbService } from '../db/self-selected-fund-db';
import { HoldFundDbService } from '../db/hold-fund-db';
import { handleFundEstimateDataSource_0 } from '../polling-scheduler/utils';
import { Disposable, DisposableManager } from '../disposable-manager';

// 净值调度器，保证基金净值数据更新准确
@injectable()
export class NetScheduler implements Disposable {
    public netsData = new Map<string, {net: string, time: string, code: string, change: string}>();

    @inject(SelfSelectedFundDbService) private selfSelectedDb: SelfSelectedFundDbService;

    @inject(HoldFundDbService) private holdDb: HoldFundDbService;
    
    private scheduledTask: ScheduledTask;

    @inject(SYMBOLS.EventBus) private eventBus: EventBus;

    @inject(StorageModule) protected storage: StorageModule;

    @inject(DisposableManager) protected disposableManager: DisposableManager;

    @postConstruct()
    protected init() {
        this.scheduledTask = cron.schedule('0 0 9,21 * * 1-5', () => {
            this.collectFundNet();
        });
        this.collectFundNet();
        this.disposableManager.register(this);
    }

    private getSource() {
        return 'https://api.fund.eastmoney.com/favor/GetFundsInfo?';
    }

    private async collectFundNet() {
        const selfSelectedFunds = this.selfSelectedDb.getAllFunds();
        const holdFunds = this.holdDb.getAllFunds();
        try {
            const params = [...selfSelectedFunds, ...holdFunds].map(i => i.code);
            const result = await this.fetch(`fcodes=${params.join(',')}`);
            this.netsData = new Map(result);
        } catch(e) {
            console.error(e);
        }
    }

    private async fetch(codes: string) {
        const result = await fetch(this.getSource(), {
            method: 'post',
            body: codes,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://favor.fund.eastmoney.com/'
            }
        });
        const data = await result.json();
        return data?.Data?.KFS?.map((i: any) => [i.FCODE, {
            code: i.FCODE,
            net: i.DWJZ || '',
            time: i.FSRQ || '',
            change: `${i.RZDF}%` || '',
        }]) || [];
    }

    public dispose(): void {
        this.scheduledTask.destroy();
    }
}