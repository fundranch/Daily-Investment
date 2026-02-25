import { inject, injectable, postConstruct } from 'inversify';
import 'reflect-metadata';
import { ipcMain } from 'electron';
import { StorageModule } from '../storage/fund-storage';
import { PollingScheduler } from './scheduler';
import { EventBus } from '../events';
import { SYMBOLS } from '../../symbols';

@injectable()
export class PollingCore {
    @inject(StorageModule) protected storageModule: StorageModule;

    @inject(PollingScheduler) protected pollingScheduler: PollingScheduler;

    @inject(SYMBOLS.EventBus) eventBus: EventBus;

    @postConstruct()
    init() {
        ipcMain.on('refresh-polling', () => {
            this.pollingScheduler.restart();
        });
        this.eventBus.on('polling-scheduler-restart', () => {
            this.pollingScheduler.restart();
        });
    }

    public async initialize() {
        try {
            await this.getPollingConfig();
            this.eventBus.emit('watcher-date-update', this.storageModule.data?.watcher);
            this.pollingScheduler.start();
        } catch(e) {
            console.error(e);
        }
    }

    private async getPollingConfig() {
        await this.storageModule.initAppData();
    }
}