import 'reflect-metadata';
import { Container } from 'inversify';
import { bindStorageProcess } from './modules/storage';
import { bindPollingProcess } from './modules/polling-scheduler';
import { SYMBOLS } from './symbols';
import { EventBus } from './modules/events';
import { bindDbProcess } from './modules/db';
import { MenuBuilder } from './modules/menu';

export const container = new Container();

container.bind(SYMBOLS.EventBus).to(EventBus).inSingletonScope();

container.bind(MenuBuilder).toSelf().inRequestScope();

bindStorageProcess(container);

bindPollingProcess(container);

bindDbProcess(container);