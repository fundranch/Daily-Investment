import { inject, injectable, postConstruct } from 'inversify';
import { ipcMain } from 'electron';
import { BaseApiFetcher } from './apis/base-api-fetcher';
import { CompositeApi } from './apis/composite';
import { MetalApi } from './apis/metal';
import { MetalChartApi } from './apis/metal-chart';
import { StorageModule } from '../storage/fund-storage';
import { SelfSelectedFundApi } from './apis/self-selected-fund';
import { HoldFundApi } from './apis/hold-fund';

@injectable()
export class PollingScheduler {
    @inject(CompositeApi) protected compositeApi: CompositeApi;

    @inject(MetalApi) protected metalApi: MetalApi;

    @inject(MetalChartApi) protected metalChartApi: MetalChartApi;

    @inject(StorageModule) protected storageModule: StorageModule;

    @inject(SelfSelectedFundApi) protected selfSelectedFundApi: SelfSelectedFundApi;

    @inject(HoldFundApi) protected holdFundApi: HoldFundApi;

    @postConstruct()
    init() {
        ipcMain.on('select-chart-type', (event, data) => {
            if(!data.type || !data.key) return;
            this.chartTarget = data;
            this.restart();
        });
        
    }

    protected chartTarget: {type: 'metal' | 'fund', key: string } = {
        type: 'metal',
        key: 'au'
    };

    private get interval() {
        return this.storageModule.data?.interval || 5000;
    }

    private timer: any | null = null;

    private get fetchers(): BaseApiFetcher[] {
        const baseApi: BaseApiFetcher[] = [this.compositeApi, this.metalApi, this.selfSelectedFundApi, this.holdFundApi];
        if(this.chartTarget.type === 'metal')  {
            return baseApi.concat(this.metalChartApi);
        }
        return baseApi;
    }

    private async pollOnce(clean?: boolean) {
        try {
            await Promise.all(
                this.fetchers.map(fetcher => fetcher.fetch({ key: this.chartTarget.key, clean }))
            );
        } catch(err: any) {
            if(err.name !== 'AbortError') {
                console.error('Polling error:', err);
            }
        }
    }

    public restart() {
        this.stop();
        this.start(true);
    }

    public start(clean?: boolean) {
        if(this.timer) return;
        this.pollOnce(clean);
        this.timer = setInterval(() => {
            this.pollOnce(clean);
        }, this.interval || 6 * 10000);
    }

    public stop() {
        if(!this.timer) return;
        this.fetchers.forEach((fetch) => {
            fetch.cancel();
        });
        clearInterval(this.timer);
        this.timer = null;
    }
}
