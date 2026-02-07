import { ipcMain } from 'electron';
import { Container } from 'inversify';
import { PollingCore } from './polling-core';
import { PollingScheduler } from './scheduler';
// import { PollingConfig } from './polling-config';
import { CompositeApi } from './apis/composite';
import { MetalApi } from './apis/metal';
import { MetalChartApi } from './apis/metal-chart';

ipcMain.on('set-polling-config', async (event, arg: Partial<any>) => {
});

export function bindPollingProcess(container: Container) {
    container.bind(CompositeApi).toSelf().inSingletonScope();
    container.bind(MetalChartApi).toSelf().inSingletonScope();
    container.bind(MetalApi).toSelf().inSingletonScope();
    // container.bind(PollingConfig).toSelf().inSingletonScope();
    container.bind(PollingCore).toSelf().inSingletonScope();
    container.bind(PollingScheduler).toSelf().inSingletonScope();
}