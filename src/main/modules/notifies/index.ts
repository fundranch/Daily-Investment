import { Notification } from 'electron';
import { injectable, postConstruct } from 'inversify';

@injectable()
export class Notifies {
    @postConstruct()
    protected init() {

    }

    public test() {
        new Notification({
            title: 'test',
            body: '这是一段文本',
            sound: 'ping'
        }).show();
    }
}