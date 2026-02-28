import { Container } from 'inversify';
import { NetScheduler } from './net-scheduler';

export function bindSchedulerProcess(container: Container) {
    container.bind(NetScheduler).toSelf().inSingletonScope();
}