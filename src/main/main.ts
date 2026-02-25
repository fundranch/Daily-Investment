/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { EventEmitter } from 'stream';
import { isDebug } from './modules/env';
import { container } from './container';
import { SYMBOLS } from './symbols';
import { PollingCore } from './modules/polling-scheduler/polling-core';
import './modules/api';
import { StorageData } from '../types';
import { MainWindow } from './modules/browser-window';
import { WatcherWindow } from './modules/browser-window/watcher';

class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();
    }
}

if(process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

if(isDebug) {
    // require('electron-debug').default();
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if(process.platform !== 'darwin') {
        app.quit();
    }
});

app.whenReady().then(() => {
    const eventBus = container.get<EventEmitter>(SYMBOLS.EventBus);
    if(container.isBound(PollingCore)) {
        container.get(PollingCore).initialize();
    }
    // 主弹窗生成
    container.get<MainWindow>(MainWindow)?.create();
    eventBus.on('watcher-date-update', async (data: StorageData['watcher']) => {
        if(!data) return;
        const watchWindow = container.get<() => BrowserWindow>(SYMBOLS.WatcherBrowserFactory)();
        if(watchWindow && !data.open) {
            watchWindow.webContents.close();
        } else if(!watchWindow && data.open) {
            // 盯盘窗口生成
            await container.get<WatcherWindow>(WatcherWindow)?.create();
        }
        if(data.open) {
            // 根据配置项重新计算window的大小
            container.get<WatcherWindow>(WatcherWindow)?.resizeWindow(data);
        }
    });
    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if(!container.get<() => BrowserWindow>(SYMBOLS.MainBrowserFactory)()) {
            // 主弹窗生成
            container.get<MainWindow>(MainWindow)?.create();
        };
    });
}).catch(console.log);
