import { app, ipcMain, BrowserWindow } from 'electron';
import { inject, injectable, postConstruct } from 'inversify';
import fs from 'node:fs/promises';
import path from 'node:path';
import { StorageData } from '../../../types';
import { SYMBOLS } from '../../symbols';
import { EventBus } from '../events';

@injectable()
export class StorageModule {
    @inject(SYMBOLS.EventBus) eventBus: EventBus;

    private fileName = 'fund.json';

    public data: StorageData | null = {
        holdFundsSource: {},
        notifies: [],
        watcher: {
            open: false,
            fund: [],
            metal: [],
            opacity: 1
        },
        interval: 5000,
        fundSource: 1,
        selfSelectedFundsSource: {}
    };

    @postConstruct()
    protected init() {
        ipcMain.handle('get-setting-data', async () => {
            if(this.data) {
                return this.data;
            }
            const data = await this.getAppData();
            return data;
        });
        ipcMain.handle('set-setting-data', async (event, data) => {
            const res = await this.setAppData({
                ...this.data!,
                ...data
            });
            this.eventBus.emit('polling-scheduler-restart');
            return res;
        });
        ipcMain.handle('set-watcher-data', async (event, data) => {
            const newData: StorageData = {
                ...this.data!,
                watcher: { ...data }
            };
            const res = await this.setAppData(newData);
            this.eventBus.emit('watcher-date-update', newData.watcher);
            return res;
        });
        ipcMain.handle('set-notifies-data', async (event, data) => {
            const newData: StorageData = {
                ...this.data!,
                notifies: data
            };
            const res = await this.setAppData(newData);
            this.eventBus.emit('notifies-data-update', newData.notifies);
            return res;
        });
    }

    public async initAppData() {
        await this.getAppData();
        this.updateSettingDataEmitter();
        this.eventBus.emit('on-after-storage-init');
    }

    public getFilePath() {
        const appPath = app.getPath('userData');
        return path.resolve(appPath, this.fileName);
    }

    // 获取app资源值
    public async getAppData() {
        const appPath = this.getFilePath();
        try {
            const fileStats = await fs.stat(appPath);
            if(!fileStats?.isFile()) {
                this.setAppData(this.data!);
                return null;
            }
            const fileData = await fs.readFile(appPath, { encoding: 'utf-8' });
            const data = JSON.parse(fileData);
            this.data = data;
            return data;
        } catch(e) {
            return null;
        }
    }

    // 存储app资源值
    public async setAppData(data: string | StorageData) {
        const appPath = this.getFilePath();
        const handleData = typeof data === 'string' ? data : JSON.stringify(data);
        try {
            await fs.writeFile(appPath, handleData);
            this.data = JSON.parse(handleData);
            this.updateSettingDataEmitter();
            return true;
        } catch(e) {
            return false;
        }
    }

    // 给所有进程发送更新消息
    private updateSettingDataEmitter() {
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(window => {
            window.webContents.send('update-setting-data', this.data);
        });
    }
}