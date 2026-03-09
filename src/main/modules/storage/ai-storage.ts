import { inject, injectable, postConstruct } from 'inversify';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app, ipcMain } from 'electron';
import { SYMBOLS } from '../../symbols';
import { EventBus } from '../events';
import { AIStorageData } from '../../../types';

@injectable()
export class AIStorageModule {
    @inject(SYMBOLS.EventBus) eventBus: EventBus;

    private fileName = 'ai-config.json';

    public data: AIStorageData | null = null;

    @postConstruct()
    protected init() {
        this.getAppData();
        ipcMain.handle('get-ai-model-config', async () => {
            if(this.data) {
                return this.data;
            }
            const data = await this.getAppData();
            return data;
        });
        ipcMain.handle('set-ai-model-config', async (event, data) => {
            const res = await this.setAppData({
                ...this.data!,
                ...data
            });
            if(res) {
                this.eventBus.emit('ai-config-update', this.data);
            }
            return res;
        });
    }

    public getFilePath() {
        const appPath = app.getPath('userData');
        return path.resolve(appPath, this.fileName);
    }

    public async getAppData() {
        const appPath = this.getFilePath();
        try {
            const fileStats = await fs.stat(appPath);
            if(!fileStats?.isFile()) {
                this.setAppData({
                    apiKey: '',
                    model: '',
                    baseURI: ''
                }, { init: true });
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
    public async setAppData(data: string | AIStorageData, option?: { init?: boolean }) {
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