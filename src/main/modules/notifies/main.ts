import { inject, injectable, postConstruct } from 'inversify';
import { SYMBOLS } from '../../symbols';
import { EventBus } from '../events';
import { StorageModule } from '../storage/fund-storage';
import { NotifyMessage, NotifyMessageFactory } from './message';
import { Disposable, DisposableManager } from '../disposable-manager';

@injectable()
export class Notifies implements Disposable {
    @inject(SYMBOLS.EventBus) eventBus: EventBus;

    @inject(StorageModule) storage: StorageModule;

    @inject(NotifyMessageFactory) notifyMessageFactory: () => NotifyMessage;

    // 根据对应的消息生成的map结构便于查找
    private codeMap: Map<string, NotifyMessage[]> = new Map();

     @inject(DisposableManager) protected disposableManager: DisposableManager;

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
         this.disposableManager.register(this);
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

    public removeNotifiesByCode(code: string) {
        const target = this.codeMap.get(code);
        if(!target) return;
        target.forEach(notify => {
            notify.dispose();
        });
        this.codeMap.delete(code);
    }

    private reset() {
        this.codeMap.clear();
    }

    public dispose(): void {
        this.codeMap.forEach((value) => {
            value.forEach(i => {
                i.dispose();
            });
        });
    }
}