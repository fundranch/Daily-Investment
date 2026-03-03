import { inject, injectable, postConstruct } from 'inversify';
import { BrowserWindow } from 'electron';
import { BaseApiFetcher, Options } from './base-api-fetcher';
import { SYMBOLS } from '../../../symbols';
import { HoldFundDb } from '../../../../types/db';
import { StorageModule } from '../../storage/fund-storage';
import { correctNetData, getFundStatus, handleFundEstimateDataSource_0, handleFundEstimateDataSource_1, toFixed } from '../utils';
import { BaseFundData } from '../../../../types';
import { HoldFundDbService } from '../../db/hold-fund-db';
import { EventBus } from '../../events';
import { NetScheduler } from '../../scheduler/net-scheduler';

@injectable()
export class HoldFundApi extends BaseApiFetcher {
    @inject(SYMBOLS.EventBus) private eventBus: EventBus;

    @inject(HoldFundDbService) private db: HoldFundDbService;

    @inject(StorageModule) private storage: StorageModule;

    @inject(NetScheduler) private netScheduler: NetScheduler;

    constructor(
        @inject(SYMBOLS.MainBrowserFactory) mainBrowserFactory: () => BrowserWindow,
        @inject(SYMBOLS.WatcherBrowserFactory) watcherBrowserFactory: () => BrowserWindow
    ) {
        super(mainBrowserFactory, watcherBrowserFactory);
    }

    private getSource(code: string) {
        if(this.storage.data?.fundSource === 1) {
            return `https://fundgz.1234567.com.cn/js/${code}.js?rt=1589463125600`;
        }
        return `https://m.dayfund.cn/ajs/ajaxdata.shtml?showtype=getfundvalue&fundcode=${code}`;
    } 

    public dbData: HoldFundDb[] = [];

    @postConstruct()
    init() {
        // 获取数据库自选数据
        this.dbData = this.db.getAllFunds();
    }

    private async fetchItem(code: string) {
        const response = await fetch(this.getSource(code), { signal: this.abortController?.signal });
        return { response, code };
    }

    public async fetch({ clean }: Options) {
        this.dbData = this.db.getAllFunds();
        super.fetch();
        try {
            if(!this.dbData.length) {
                this.mainBrowser?.webContents.send('hold-fund-update', []);
                this.watcherBrowser?.webContents.send('hold-fund-update', []);
                return;
            };
            const res = await Promise.allSettled(
                this.dbData.map(i => this.fetchItem(i.code))
            );
            // 根据数据源类型处理出相应的数据
            const data = await this.handleFetchData(res);
            // 更新渲染进程数据
            this.mainBrowser?.webContents.send('hold-fund-update', data);
            this.watcherBrowser?.webContents.send('hold-fund-update', data);
            this.eventBus.emit('message-data-update', data.reduce<Record<string, number>>((pre, i: any) => {
                pre[i.code] = parseFloat(i.estimateChange);
                return pre;
            }, {}));
        } catch(e) {
            console.error(e);
        }   
    }

    private async handleFetchData(data: PromiseSettledResult<{response: Response, code: string}>[]) {
        const dataMap = new Map<string, Partial<BaseFundData>>();
        for(const item of data) {
            if(item.status === 'rejected') continue;
            const handleFunc = this.storage.data?.fundSource === 1 ? handleFundEstimateDataSource_1 : handleFundEstimateDataSource_0;
            const responseData = await handleFunc(item.value.response);
            const handleData = this.storage.data?.fundSource === 1
                ? correctNetData(responseData, this.netScheduler.netsData.get(item.value.code!))
                : responseData;
            if(!handleData) continue;
            dataMap.set(item.value.code!, handleData);
            this.db.updateTotalProfit(item.value.code!, handleData.net as any, handleData.netTime!);
        }
        return this.dbData.map(i => {
            const mapData = dataMap.get(i.code);
            if(!mapData) return { ...i };
            // 计算当日的收益
            const total = toFixed((i.invested_amount / Number(mapData.estimateNet))) || 0;
            const todayProfit = toFixed((Number(mapData.estimateNet) - Number(mapData.net)) * total);
            return {
                ...i,
                ...mapData,
                todayProfit,
                status: getFundStatus(mapData.estimateNet, mapData.net)
            };
        });
        
    }
}