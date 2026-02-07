import { Container } from 'inversify';
import { StorageModule } from './fund-storage';

export function bindStorageProcess(container: Container) {
    container.bind(StorageModule).toSelf().inSingletonScope();
}