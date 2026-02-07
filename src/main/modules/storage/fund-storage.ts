import { app, ipcMain } from 'electron';
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
        holdFunds: [],
        interval: 5000,
        optionalFunds: []
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
            const res = await this.setAppData(data);
            this.eventBus.emit('storage-config-change');
            return res;
        });
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
            return true;
        } catch(e) {
            return false;
        }
    }
}