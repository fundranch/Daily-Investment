import { inject, injectable } from 'inversify';
import { BrowserWindow } from 'electron';
import { SYMBOLS } from '../../../symbols';

@injectable()
export abstract class BaseApiFetcher {

    constructor(
        @inject(SYMBOLS.MainBrowserFactory) protected mainBrowserFactory: () => BrowserWindow
    ) {}

    protected get mainBrowser() {
        return this.mainBrowserFactory();
    }
    
    protected abortController: AbortController = new AbortController();

    protected cancelIfRunning() {
        if(this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
    }

    public fetch(key?: string) {
        this.cancelIfRunning();
    };

    public cancel() {
        this.cancelIfRunning();
    }
}
