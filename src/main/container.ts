import 'reflect-metadata';
import { Container } from 'inversify';
import { bindStorageProcess } from './modules/storage';
import { bindPollingProcess } from './modules/polling-scheduler';
import { SYMBOLS } from './symbols';
import { EventBus } from './modules/events';

export const container = new Container();

container.bind(SYMBOLS.EventBus).to(EventBus).inSingletonScope();

bindStorageProcess(container);

bindPollingProcess(container);