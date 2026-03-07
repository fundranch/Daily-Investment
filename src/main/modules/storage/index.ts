import { Container } from 'inversify';
import { StorageModule } from './fund-storage';
import { AIStorageModule } from './ai-storage';

export function bindStorageProcess(container: Container) {
    container.bind(StorageModule).toSelf().inSingletonScope();
    container.bind(AIStorageModule).toSelf().inSingletonScope();
}