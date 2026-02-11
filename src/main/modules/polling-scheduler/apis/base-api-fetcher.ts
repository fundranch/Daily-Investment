import { inject, injectable } from 'inversify';
import { BrowserWindow } from 'electron';
import { SYMBOLS } from '../../../symbols';

export type Options = { clean?: boolean, [x: string]: any }

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

    public fetch(options?: Options) {
        this.cancelIfRunning();
    };

    public cancel() {
        this.cancelIfRunning();
    }
}
