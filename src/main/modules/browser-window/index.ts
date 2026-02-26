import { inject, injectable } from 'inversify';
import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { isDebug } from '../env';
import { installExtensions } from '../extensions';
import { getAssetPath, resolveHtmlPath } from '../../util';
import { MenuBuilder } from '../menu';
import '../polling-scheduler';
import { Notifies } from '../notifies/main';

@injectable()
export class MainWindow {
    @inject(MenuBuilder) private menuBuilder: MenuBuilder;

    @inject(Notifies) private notifies: Notifies;

    private _window: BrowserWindow | null = null;

    public get window() {
        return this._window;
    }

    public async create() {
        if(isDebug) {
            await installExtensions();
        }
        this._window = this.createWindow();
        this.initListener();
        this._window?.loadURL(resolveHtmlPath('main-window/index.html'));
        this.menuBuilder.buildMenu();
        return this._window;
    }

    private createWindow() {
        return new BrowserWindow({
            show: false,
            width: 1024,
            height: 728,
            minWidth: 950,
            minHeight: 700,
            backgroundColor: '#fff',
            title: '',
            icon: getAssetPath('icon.png'),
            webPreferences: {
                preload: app.isPackaged
                    ? path.join(__dirname, 'preload.js')
                    : path.join(__dirname, '../../.erb/dll/preload.js'),
            }
        });
    }

    private initListener() {
        this._window?.on('ready-to-show', () => {
            if(!this._window) {
                throw new Error('"mainWindow" is not defined');
            }
            if(process.env.START_MINIMIZED) {
                this._window.minimize();
            } else {
                this._window.show();
            }
            this.notifies.start();
        });

        this._window?.on('closed', () => {
            this._window = null;
        });

        this._window?.webContents.setWindowOpenHandler((edata) => {
            shell.openExternal(edata.url);
            return { action: 'deny' };
        });
    }
}