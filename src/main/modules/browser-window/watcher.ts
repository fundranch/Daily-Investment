import { inject, injectable } from 'inversify';
import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { isDebug } from '../env';
import { installExtensions } from '../extensions';
import { getAssetPath, resolveHtmlPath } from '../../util';
import { MenuBuilder } from '../menu';
import '../polling-scheduler';
import { StorageData } from '../../../types';


const TITLE_HEIGHT = 30;

const BASE_WIDGTH = 250;

const LINE_HEIGHT = 40;

const MAX_LENGTH = 6;

@injectable()
export class WatcherWindow {
    @inject(MenuBuilder) private menuBuilder: MenuBuilder;

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
        this._window?.loadURL(resolveHtmlPath('watcher-window/index.html'));
        this.menuBuilder.buildMenu();
        return this._window;
    }


    private createWindow() {
        const win = new BrowserWindow({
            show: false,
            frame: false,
            resizable: false,
            alwaysOnTop: true,
            width: BASE_WIDGTH,
            height: LINE_HEIGHT,
            x: 50,
            y: 50,
            backgroundColor: '#fff',
            hasShadow: true,
            title: '',
            icon: getAssetPath('icon.png'),
            webPreferences: {
                preload: app.isPackaged
                    ? path.join(__dirname, 'preload.js')
                    : path.join(__dirname, '../../.erb/dll/preload.js'),
            }
        });
        win.setAlwaysOnTop(true, 'screen-saver'); 
        win.setVisibleOnAllWorkspaces(true, {
            visibleOnFullScreen: true,
        });
        return win;
    }

    public resizeWindow(config: StorageData['watcher']) {
        const length = config.fund.length + config.metal.length;
        const currentHeight = length > MAX_LENGTH ? MAX_LENGTH * LINE_HEIGHT : (length || 1) * LINE_HEIGHT;
        this._window?.setBounds({
            height: currentHeight
        });
    }
    
    private initListener() {
        this._window?.on('focus', () => {
            const bounds = this._window?.contentView.getBounds();
            if(!bounds) return;
            this._window?.setBounds({
                height: bounds.height + TITLE_HEIGHT
            });
            this._window?.webContents.send('hide-watcher-title', false);
        });

        this._window?.on('blur', () => {
            const bounds = this._window?.contentView.getBounds();
            if(!bounds) return;
            this._window?.setBounds({
                height: bounds.height - TITLE_HEIGHT
            });
            this._window?.webContents.send('hide-watcher-title', true);
        });
        this._window?.on('ready-to-show', () => {
            if(!this._window) {
                throw new Error('"mainWindow" is not defined');
            }
            if(process.env.START_MINIMIZED) {
                this._window.minimize();
            } else {
                this._window.show();
            }
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