// 大盘指数接口
import { inject, injectable } from 'inversify';
import { BrowserWindow } from 'electron';
import { CompositeData } from '../../../../types';
import { BaseApiFetcher } from './base-api-fetcher';
import { SYMBOLS } from '../../../symbols';

@injectable()
export class CompositeApi extends BaseApiFetcher {
    constructor(
        @inject(SYMBOLS.MainBrowserFactory) mainBrowserFactory: () => BrowserWindow
    ) {
        super(mainBrowserFactory);
    }

    protected source = 'https://sp0.baidu.com/5LMDcjW6BwF3otqbppnN2DJv/finance.pae.baidu.com/vapi/v1/getmarketquotation?sid=60278_63148_67050_67080_67125_67129_67153_67222_67293_67318_67315_67323_67320_67435_67424_67460_67500_67489_67563_67556_67545_67621_67627_67612_67602_67634_67644_67651_67655_67678_67718_67747_67753&finClientType=pc&market=ab';

    public async fetch() {
        super.fetch();
        try {
            const res = await fetch(this.source, { signal: this.abortController?.signal });
            const json = await res.json();
            const data: CompositeData[] = [];
            json.Result?.index_quotation?.list?.forEach((i: any) => {
                data.push({
                    name: i.name,
                    code: i.code,
                    price: i.quotation?.price || '0.00',
                    ratio: i.quotation?.ratio || '0.00%',
                    status: i.quotation?.status || 0,
                    change: i.quotation?.price_change || '0'
                });
            });
            // 更新渲染进程数据
            this.mainBrowser?.webContents.send('composite-data-update', data);
        } catch(e) {
            console.error(e);
        }
        
    }
}