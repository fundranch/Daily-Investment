import { Container } from 'inversify';
import { DbService } from './db';
import { SelfSelectedFundDbService } from './self-selected-fund-db';
import { HoldFundDbService } from './hold-fund-db';

export function bindDbProcess(container: Container) {
    container.bind(DbService).toSelf().inSingletonScope();
    container.bind(SelfSelectedFundDbService).toSelf().inSingletonScope();
    container.bind(HoldFundDbService).toSelf().inSingletonScope();
}