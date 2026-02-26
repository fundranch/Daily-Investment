import { inject, injectable, postConstruct } from 'inversify';
import { SYMBOLS } from '../../symbols';
import { EventBus } from '../events';
import { StorageModule } from '../storage/fund-storage';
import { NotifyMessage, NotifyMessageFactory } from './message';

@injectable()
export class Notifies {
    @inject(SYMBOLS.EventBus) eventBus: EventBus;

    @inject(StorageModule) storage: StorageModule;

    @inject(NotifyMessageFactory) notifyMessageFactory: () => NotifyMessage;

    // 根据对应的消息生成的map结构便于查找
    private codeMap: Map<string, NotifyMessage[]> = new Map();

    @postConstruct()
    protected init() {
        this.start();
        this.eventBus.on('notifies-data-update', () => {
            this.reset();
            this.start();
        });
        this.eventBus.on('message-data-update', (data: Record<string, number>) => {
            Object.keys(data).forEach(code => {
                const target = this.codeMap.get(code);
                target?.forEach(notifyMessage => {
                    notifyMessage.start(data[code]);
                });
            });
        });
    }

    // 初始化消息系统
    public start() {
        const notifies = this.storage.data?.notifies;
        if(!Array.isArray(notifies)) return;
        notifies.forEach(notify => {
            const instance = this.notifyMessageFactory();
            let list = this.codeMap.get(notify.code);
            if(!list) {
                list = [];
                this.codeMap.set(notify.code, list);
            }
            list.push(instance);
            instance.init(notify);
        });
    }

    private reset() {
        this.codeMap.clear();
    }
}