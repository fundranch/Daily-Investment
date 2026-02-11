import { inject, injectable } from 'inversify';
import { BrowserWindow } from 'electron';
import { BaseApiFetcher, Options } from './base-api-fetcher';
import { SYMBOLS } from '../../../symbols';
import { handleMetalApiData } from '../utils';
import { FAKE_HEADERS } from './config';

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

    private getSource(key: 'au' | 'ag' | 'aum') {
        return `https://api.jijinhao.com/sQuoteCenter/todayMin.htm?code=${this.keyMap[key]}`;
    }

    public async fetch(options: Options) {
        super.fetch();
        try {
            const res = await fetch(this.getSource(options.key as any), { signal: this.abortController?.signal, headers: FAKE_HEADERS });
            const text = await res.text();
            const data = handleMetalApiData(text);
            // 更新渲染进程数据
            this.mainBrowser?.webContents.send('chart-data-update', { data: data.data, key: options.key });
        } catch(e) {
            console.error(e);
        }
        
    }
}