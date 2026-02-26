import { Container, Factory } from 'inversify';
import { Notifies } from './main';
import { NotifyMessage, NotifyMessageFactory } from './message';

export function bindNotifiesProcess(container: Container) {
    container.bind(Notifies).toSelf().inSingletonScope();

    container.bind(NotifyMessage).toSelf().inTransientScope();

    container.bind<Factory<NotifyMessage>>(NotifyMessageFactory).toFactory((context) => {
        return () => context.get(NotifyMessage);
    });
}