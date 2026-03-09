import 'reflect-metadata';
import { Container, LazyServiceIdentifier } from 'inversify';
import { BrowserWindow } from 'electron';
import { bindStorageProcess } from './modules/storage';
import { bindPollingProcess } from './modules/polling-scheduler';
import { SYMBOLS } from './symbols';
import { EventBus } from './modules/events';
import { bindDbProcess } from './modules/db';
import { MenuBuilder } from './modules/menu';
import { MainWindow } from './modules/browser-window';
import { WatcherWindow } from './modules/browser-window/watcher';
import { bindNotifiesProcess } from './modules/notifies';
import { bindSchedulerProcess } from './modules/scheduler';
import { DisposableManager } from './modules/disposable-manager';
import { bindAIProcess } from './modules/ai';

export const container = new Container();

container.bind(SYMBOLS.EventBus).to(EventBus).inSingletonScope();

container.bind(MainWindow).toSelf().inSingletonScope();
const mainWindowGetter = () => {
    return container.get(MainWindow).window;
};
container.bind<() => BrowserWindow | null>(SYMBOLS.MainBrowserFactory)
    .toConstantValue(mainWindowGetter);

container.bind(WatcherWindow).toSelf().inSingletonScope();
const watcherWindowGetter = () => {
    return container.get(WatcherWindow).window;
};
container.bind<() => BrowserWindow | null>(SYMBOLS.WatcherBrowserFactory)
    .toConstantValue(watcherWindowGetter);

container.bind(MenuBuilder).toSelf().inTransientScope();

container.bind(DisposableManager).toSelf().inSingletonScope();

bindStorageProcess(container);

bindNotifiesProcess(container);

bindPollingProcess(container);

bindDbProcess(container);

bindAIProcess(container);

bindSchedulerProcess(container);