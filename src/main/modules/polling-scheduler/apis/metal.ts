// 金属现价接口

import { inject, injectable } from 'inversify';
import { BrowserWindow } from 'electron';
import { BaseApiFetcher } from './base-api-fetcher';
import { FAKE_HEADERS } from './config';
import { handleMetalApiData } from '../utils';
import { MetalData, MetalItemData } from '../../../../types';
import { SYMBOLS } from '../../../symbols';

@injectable()
export class MetalApi extends BaseApiFetcher {
    constructor(
        @inject(SYMBOLS.MainBrowserFactory) mainBrowserFactory: () => BrowserWindow
    ) {
        super(mainBrowserFactory);
    }
    
    protected get source() {
        const date = new Date();
        return `https://api.jijinhao.com/quoteCenter/realTime.htm?codes=JO_92233,JO_165732,JO_92232&_=${date.getTime()}}`;
    }
    // q1 开盘  q2 昨收 q3 最高 q4 最低  q63 最新  q70 涨跌额 q80 比率

    public async fetch() {
        super.fetch();
        try {
            const res = await fetch(this.source, { signal: this.abortController?.signal, headers: FAKE_HEADERS });
            const text = await res.text();
            const json = handleMetalApiData(text);
            const data: MetalData = {} as any;
            Object.values(json).forEach((value: any) => {
                if(value.showCode === 'XAU') {
                    data.au = this.handleDataToMetalData(value);
                } else if(value.showCode === 'XAG') {
                    data.ag = this.handleDataToMetalData(value);
                } else if(value.showCode === 'aum') {
                    data.aum = this.handleDataToMetalData(value);
                }
            });
            // 更新渲染进程数据
            this.mainBrowser?.webContents.send('metal-data-update', data);
        } catch(e) { console.error(e); }
    }

    private format(num: number) {
        return Number(num).toFixed(2);
    }

    private handleDataToMetalData(target: any): MetalItemData {
        let status: -1 | 0 | 1 = 0;
        if(target.q1 < target.q63) {
            status = 1;
        } else if(target.q1 > target.q63) {
            status = -1;
        }
        return {
            name: target.showName,
            code: target.showCode,
            price: this.format(target.q63),
            ratio: this.format(target.q80),
            status,
            isClose: target.status !== 100,
            change: this.format(target.q70),
            max: this.format(target.q3),
            min: this.format(target.q4),
            yEnd: this.format(target.q2)
        };
    }
}