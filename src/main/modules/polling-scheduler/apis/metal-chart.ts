import { inject, injectable } from 'inversify';
import { BrowserWindow } from 'electron';
import { BaseApiFetcher, Options } from './base-api-fetcher';
import { SYMBOLS } from '../../../symbols';
import { handleMetalApiData } from '../utils';
import { FAKE_HEADERS, JD_FAKE_HEADERS } from './config';

@injectable()
export class MetalChartApi extends BaseApiFetcher {
    constructor(
        @inject(SYMBOLS.MainBrowserFactory) mainBrowserFactory: () => BrowserWindow
    ) {
        super(mainBrowserFactory);
    }

    private keyMap = {
        au: 'JO_92233',
        ag: 'JO_92232',
        aum: 'JO_165732'
    };

    private getSource(key: 'au' | 'ag' | 'aum' | 'aums') {
        if(key === 'aums') {
            return 'https://ms.jr.jd.com/gw2/generic/CreatorSer/pc/m/pcQueryGoldProduct?reqData=%7B%22goldType%22:%221%22%7D';
        }
        return `https://api.jijinhao.com/sQuoteCenter/todayMin.htm?code=${this.keyMap[key]}`;
    }

    public async fetch(options: Options) {
        super.fetch();
        try {
            const res = await fetch(this.getSource(options.key as any), { signal: this.abortController?.signal, headers: options.key === 'aums' ? JD_FAKE_HEADERS : FAKE_HEADERS });
            const text = await res.text();
            // 更新渲染进程数据
            this.mainBrowser?.webContents.send('chart-data-update', { key: options.key, info: text });
        } catch(e) {
            console.error(e);
        }
        
    }
}