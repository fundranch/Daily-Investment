import { inject, injectable, postConstruct } from 'inversify';
import { BrowserWindow } from 'electron';
import { BaseApiFetcher, Options } from './base-api-fetcher';
import { SYMBOLS } from '../../../symbols';
import { SelfSelectedFundDb } from '../../../../types/db';
import { SelfSelectedFundDbService } from '../../db/self-selected-fund-db';
import { StorageModule } from '../../storage/fund-storage';
import { correctNetData, getFundStatus, handleFundEstimateDataSource_0, handleFundEstimateDataSource_1 } from '../utils';
import { BaseFundData } from '../../../../types';
import { HoldFundApi } from './hold-fund';
import { NetScheduler } from '../../scheduler/net-scheduler';

@injectable()
export class SelfSelectedFundApi extends BaseApiFetcher {
    @inject(SelfSelectedFundDbService) private db: SelfSelectedFundDbService;

    @inject(HoldFundApi) private holdFundApi: HoldFundApi;

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

    private dbData: SelfSelectedFundDb[] = [];

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
        if(clean) {
            this.dbData = this.db.getAllFunds();
        }
        super.fetch();
        try {
            if(!this.dbData.length) {
                // 更新渲染进程数据
                this.mainBrowser?.webContents.send('self-selected-fund-update', []);
                this.watcherBrowser?.webContents.send('self-selected-fund-update', []);
                return;
            };
            const res = await Promise.allSettled(
                this.dbData.map(i => this.fetchItem(i.code))
            );
            // 根据数据源类型处理出相应的数据
            const data = await this.handleFetchData(res);
            // 更新渲染进程数据
            this.mainBrowser?.webContents.send('self-selected-fund-update', data);
            this.watcherBrowser?.webContents.send('self-selected-fund-update', data);
        } catch(e) {
            console.error(e);
        }   
    }

    // 基金缓存数据，避免数据获取失败时的数据异常
    private cacheNetMapData = new Map<string, Partial<BaseFundData>>();

    private async handleFetchData(data: PromiseSettledResult<{response: Response, code: string}>[]) {
        for(const item of data) {
            if(item.status === 'rejected') continue;
            const handleFunc = this.storage.data?.fundSource === 1 ? handleFundEstimateDataSource_1 : handleFundEstimateDataSource_0;
            const responseData = await handleFunc(item.value.response);
            const handleData = this.storage.data?.fundSource === 1
                ? correctNetData(responseData, this.netScheduler.netsData.get(item.value.code!))
                : responseData;
            if(!handleData) continue;
            this.cacheNetMapData.set(item.value.code!, handleData);
        }
        return this.dbData.map(i => {
            const mapData = this.cacheNetMapData.get(i.code);
            if(!mapData) return { ...i };
            return {
                ...i,
                ...mapData,
                isHold: this.holdFundApi.dbData.some(c => c.code === i.code),
                status: getFundStatus(mapData.estimateNet, mapData.net)
            };
        });
        
    }
}