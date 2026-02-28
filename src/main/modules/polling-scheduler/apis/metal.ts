// 金属现价接口

import { inject, injectable } from 'inversify';
import { BrowserWindow } from 'electron';
import { BaseApiFetcher } from './base-api-fetcher';
import { FAKE_HEADERS, JD_FAKE_HEADERS } from './config';
import { handleMetalApiData } from '../utils';
import { MetalData, MetalItemData } from '../../../../types';
import { SYMBOLS } from '../../../symbols';
import { EventBus } from '../../events';

@injectable()
export class MetalApi extends BaseApiFetcher {
    @inject(SYMBOLS.EventBus) eventBus: EventBus;

    constructor(
        @inject(SYMBOLS.MainBrowserFactory) mainBrowserFactory: () => BrowserWindow,
        @inject(SYMBOLS.WatcherBrowserFactory) protected watcherBrowserFactory: () => BrowserWindow
    ) {
        super(mainBrowserFactory, watcherBrowserFactory);
    }

    protected get watcherBrowser() {
        return this.watcherBrowserFactory();
    }
    
    protected get source() {
        const date = new Date();
        return `https://api.jijinhao.com/quoteCenter/realTime.htm?codes=JO_92233,JO_165732,JO_92232&_=${date.getTime()}}`;
    }

    protected get msSource() {
        return 'https://ms.jr.jd.com/gw2/generic/CreatorSer/pc/m/pcQueryGoldProduct?reqData=%7B%22goldType%22:%221%22%7D';
    }
    // q1 开盘  q2 昨收 q3 最高 q4 最低  q63 最新  q70 涨跌额 q80 比率

    public async fetch() {
        super.fetch();
        try {
            const res = await Promise.allSettled([
                fetch(this.source, { signal: this.abortController?.signal, headers: FAKE_HEADERS }),
                fetch(this.msSource, { signal: this.abortController?.signal, headers: JD_FAKE_HEADERS })
            ]);
            const data: MetalData = {} as any;
            if(res[0].status === 'fulfilled') {
                const text = await res[0].value.text();
                const json = handleMetalApiData(text);
                Object.values(json).forEach((value: any) => {
                    if(value.showCode === 'XAU') {
                        data.au = this.handleDataToMetalData(value);
                    } else if(value.showCode === 'XAG') {
                        data.ag = this.handleDataToMetalData(value);
                    } else if(value.showCode === 'aum') {
                        data.aum = this.handleDataToMetalData(value);
                    }
                });
            }
            if(res[1].status === 'fulfilled') {
                const resData = await res[1].value.json();
                const metalData = resData.resultData?.data;
                if(metalData) {
                    data.aums = {
                        name: metalData.goldName,
                        code: 'aums',
                        price: metalData.priceValue,
                        ratio: metalData.raisePercent100,
                        change: metalData.raise,
                        status: this.getStatus(0, metalData.raise),
                        chartData: metalData.goldChartDataVOS,
                        // TODO 闭市条件
                        isClose: false,
                    };
                }
            }
            // 更新渲染进程数据
            this.mainBrowser?.webContents.send('metal-data-update', data);
            this.watcherBrowser?.webContents.send('metal-data-update', data);
            this.watcherBrowser?.webContents.send('metal-data-update', data);
            this.eventBus.emit('message-data-update', {
                au: parseFloat(data.au?.ratio),
                ag: parseFloat(data.ag?.ratio),
                aum: parseFloat(data.aum?.ratio),
                aums: parseFloat(data.aums?.ratio)
            });
        } catch(e) { console.error(e); }
    }

    private format(num: number) {
        return Number(num).toFixed(2);
    }

    private getStatus(data1: number, data2: number) {
        let status: -1 | 0 | 1 = 0;
        if(data1 < data2) {
            status = 1;
        } else if(data1 > data2) {
            status = -1;
        }
        return status;
    }


    private handleDataToMetalData(target: any): MetalItemData {
        return {
            name: target.showName,
            code: target.showCode,
            price: this.format(target.q63),
            ratio: `${this.format(target.q80)}%`,
            status: this.getStatus(target.q1, target.q63),
            isClose: target.status !== 100,
            change: (target.q70 > 0 ? '+' : '') + this.format(target.q70),
            max: this.format(target.q3),
            min: this.format(target.q4),
            yEnd: this.format(target.q2)
        };
    }
}