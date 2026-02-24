import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { isDebug } from '../env';
import { installExtensions } from '../extensions';
import { resolveHtmlPath } from '../../util';
import { MenuBuilder } from '../menu';
import '../polling-scheduler';
import { container } from '../../container';
import { SYMBOLS } from '../../symbols';
import { PollingScheduler } from '../polling-scheduler/scheduler';
import { StorageData } from '../../../types';

let watcherWindow: BrowserWindow | null = null;

const TITLE_HEIGHT = 30;

const BASE_WIDGTH = 250;

const LINE_HEIGHT = 40;

container.bind<() => BrowserWindow | null>(SYMBOLS.WatcherBrowserFactory).toFactory(() => {
    return () => watcherWindow;
});

export async function createWindow() {
    if(isDebug) {
        await installExtensions();
    }
    
    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');
    
    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths);
    };
    
    watcherWindow = new BrowserWindow({
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
        },
    });
    
    watcherWindow.loadURL(resolveHtmlPath('watcher-window/index.html'));

    watcherWindow.on('focus', () => {
        const bounds = watcherWindow?.contentView.getBounds();
        if(!bounds) return;
        watcherWindow?.setBounds({
            height: bounds.height + TITLE_HEIGHT
        });
        watcherWindow?.webContents.send('hide-watcher-title', false);
    });

    watcherWindow.on('blur', () => {
        const bounds = watcherWindow?.contentView.getBounds();
        if(!bounds) return;
        watcherWindow?.setBounds({
            height: bounds.height - TITLE_HEIGHT
        });
        watcherWindow?.webContents.send('hide-watcher-title', true);
    });
    
    watcherWindow.on('ready-to-show', () => {
        if(!watcherWindow) {
            throw new Error('"browserWindow" is not defined');
        }
        if(process.env.START_MINIMIZED) {
            watcherWindow.minimize();
        } else {
            watcherWindow.show();
        }
        container.get<PollingScheduler>(PollingScheduler).restart();
    });

    ipcMain.on('close-watcher-window', () => {
        watcherWindow?.close();
    });
    
    watcherWindow.on('closed', () => {
        watcherWindow = null;
    });
    
    const menuBuilder = container.get(MenuBuilder);
    menuBuilder.buildMenu();
    
    // Open urls in the user's browser
    watcherWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });

    return watcherWindow;
    
    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    //   new AppUpdater();
}

const MAX_LENGTH = 6;
export function resizeWindow(config: StorageData['watcher']) {
    const length = config.fund.length + config.metal.length;
    const currentHeight = length > MAX_LENGTH ? MAX_LENGTH * LINE_HEIGHT : length * LINE_HEIGHT;
    watcherWindow?.setBounds({
        height: currentHeight
    });
}