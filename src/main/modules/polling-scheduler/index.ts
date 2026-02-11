import { Container } from 'inversify';
import { PollingCore } from './polling-core';
import { PollingScheduler } from './scheduler';
import { CompositeApi } from './apis/composite';
import { MetalApi } from './apis/metal';
import { MetalChartApi } from './apis/metal-chart';
import { SelfSelectedFundApi } from './apis/self-selected-fund';
import { HoldFundApi } from './apis/hold-fund';

export function bindPollingProcess(container: Container) {
    container.bind(CompositeApi).toSelf().inSingletonScope();
    container.bind(MetalChartApi).toSelf().inSingletonScope();
    container.bind(MetalApi).toSelf().inSingletonScope();
    container.bind(SelfSelectedFundApi).toSelf().inSingletonScope();
    container.bind(HoldFundApi).toSelf().inSingletonScope();
    // container.bind(PollingConfig).toSelf().inSingletonScope();
    container.bind(PollingCore).toSelf().inSingletonScope();
    container.bind(PollingScheduler).toSelf().inSingletonScope();
}