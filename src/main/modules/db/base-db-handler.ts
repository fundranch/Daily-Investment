import { inject, injectable } from 'inversify';
import { StorageData } from '../../../types';
import { StorageModule } from '../storage/fund-storage';
import { Notifies } from '../notifies/main';
import { EventBus } from '../events';

@injectable()
export abstract class BaseDbHandler {
    
    constructor(
        protected readonly storage: StorageModule,
        protected readonly notifies: Notifies,
        protected readonly eventBus: EventBus
    ) {}

    // 用于删除基金之后处理其相关副作用
    protected clearFundEffect(code: string) {
        const newWatcher = this.clearWatcherEffect(code);
        const newNotifies = this.clearNotifiesEffect(code);
        if(!newWatcher && !newNotifies) return;
        const storageData = { ...this.storage.data! };
        storageData.watcher = newWatcher ?? storageData.watcher;
        storageData.notifies = newNotifies ?? storageData.notifies;
        this.storage.setAppData(storageData);
    }

    protected clearWatcherEffect(code: string): StorageData['watcher'] | null {
        if(!this.storage.data?.watcher.fund.includes(code)) return null;
        const newWatcher = { ...this.storage.data.watcher };
        newWatcher.fund = newWatcher.fund.filter(i => i !== code);
        this.eventBus.emit('watcher-date-update', newWatcher);
        return newWatcher;
    }

    protected clearNotifiesEffect(code: string): StorageData['notifies'] | null {
        const target = this.storage.data?.notifies.some(i => i.code === code);
        if(!target) return null;
        // 关闭消息相关副作用
        this.notifies.removeNotifiesByCode(code);
        return this.storage.data!.notifies.filter(i => i.code !== code);
    }
}