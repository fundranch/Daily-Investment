import { injectable } from 'inversify';
import { Notification } from 'electron';
import { debounce } from 'lodash';
import { NotificationData } from '../../../types';

export const NotifyMessageFactory = Symbol.for('MessageFactory');

@injectable()
export class NotifyMessage {
    private data: NotificationData;

    private level: number = 1; // 针对消息类型为震幅类型时的分段计数整数

    private timer: any = null; // 针对消息类型为计时器类型时

    public init(data: NotificationData) {
        this.data = data;
    }

    public start(change: number) {
        if(!this.data.code) return;
        if(this.data.type === 'amplitude') {
            if(Math.abs(change) < this.data.threshold) return;
            // 根据比例判断是否需要消息提醒
            const currentLevel = Number(String(Math.abs(change) / this.data.threshold).split('.')[0]);
            if(currentLevel !== this.level) {
                this.message(change);
                this.level = currentLevel;
            }
        } else if(this.data.type === 'timer') {
            // 此时判断是否超过阈值
            if(Math.abs(change) >= this.data.threshold && this.timer === null) {
                this.message(change);
                this.timer = setInterval(() => {
                    this.message(change);
                }, this.data.timer || 1000 * 60);
            } else if(Math.abs(change) < this.data.threshold && this.timer !== null) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
    }

    private message = debounce((value) => {
        const text = `实时${value > 0 ? '上涨' : '下跌'}: ${value || 0}%, 请注意`;
        new Notification({
            title: this.data.name,
            body: text,
            sound: 'ping'
        }).show();
    }, 200);

    public dispose() {
        if(this.timer !== null) {
            clearInterval(this.timer);
        }
    }
}